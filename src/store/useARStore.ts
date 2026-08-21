import { create } from "zustand";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import { generateMockData } from "../lib/mockData";
import { computeInvoice, computeCustomerSummary } from "../lib/calculations";
import type {
  Customer,
  Invoice,
  Payment,
  CollectionActivity,
  Dispute,
  InvoiceComputed,
} from "../types";

/**
 * Single source of truth untuk seluruh aplikasi (aturan #10 & #11 PRD).
 * Semua halaman baca dari store ini via selector (computed di
 * lib/calculations.ts) — tidak ada data duplikat/hardcode per halaman.
 *
 * Data layer: Supabase (Postgres) — dipilih karena aplikasi sekarang
 * dipakai bersama oleh tim Finance (bukan lagi per-browser/IndexedDB).
 * Alur tulis (Import, Record Payment, Catat Aktivitas, dll) selalu lewat
 * action di sini, yang menulis ke Supabase lalu memperbarui state lokal,
 * sehingga Dashboard/Reports/Customer Summary otomatis ikut berubah.
 */

interface ARState {
  customers: Customer[];
  invoices: Invoice[];
  payments: Payment[];
  activities: CollectionActivity[];
  disputes: Dispute[];

  status: "idle" | "loading" | "ready" | "error";
  error: string | null;

  init: () => Promise<void>;
  refetch: () => Promise<void>;
  /** Kosongkan seluruh state + putus koneksi realtime — dipanggil saat sesi
   * auth berganti user (login akun lain / logout), supaya tidak ada data
   * milik user sebelumnya yang "nyangkut" di memori browser. */
  reset: () => void;

  recordPayment: (payment: Payment) => Promise<void>;
  logActivity: (activity: CollectionActivity) => Promise<void>;
  upsertDispute: (dispute: Dispute) => Promise<void>;
  setInvoiceEscalated: (invoiceNumber: string, escalated: boolean) => Promise<void>;
  replaceImportedData: (data: {
    customers?: Customer[];
    invoices?: Invoice[];
    activities?: CollectionActivity[];
  }) => Promise<void>;
  resetToMockData: () => Promise<void>;

  // Selectors (computed, tidak disimpan sebagai state)
  getComputedInvoices: () => InvoiceComputed[];
  getCustomerSummary: (customerCode: string) => ReturnType<typeof computeCustomerSummary> | null;
}

/**
 * PostgREST (API Supabase) kadang mengembalikan kolom `numeric` sebagai
 * string, bukan number murni, untuk menghindari presisi float hilang pada
 * angka besar. Semua kalkulasi di lib/calculations.ts mengasumsikan number
 * asli, jadi kita normalisasi eksplisit di sini — sekali, di titik masuk
 * data — supaya seluruh aplikasi di atasnya tetap aman tanpa perlu tahu
 * detail ini.
 */
function normalizeNumericFields<T>(rows: T[], keys: (keyof T)[]): T[] {
  return rows.map((row) => {
    const copy = { ...row };
    for (const key of keys) {
      const value = copy[key];
      if (value !== null && value !== undefined) {
        copy[key] = Number(value as unknown as number) as T[typeof key];
      }
    }
    return copy;
  });
}

async function fetchAll() {
  const [customersRes, invoicesRes, paymentsRes, activitiesRes, disputesRes] = await Promise.all([
    supabase.from("customers").select("*"),
    supabase.from("invoices").select("*"),
    supabase.from("payments").select("*"),
    supabase.from("collection_activities").select("*"),
    supabase.from("disputes").select("*"),
  ]);

  const firstError =
    customersRes.error ?? invoicesRes.error ?? paymentsRes.error ?? activitiesRes.error ?? disputesRes.error;
  if (firstError) throw new Error(firstError.message);

  return {
    customers: normalizeNumericFields((customersRes.data ?? []) as Customer[], ["credit_limit"]),
    invoices: normalizeNumericFields((invoicesRes.data ?? []) as Invoice[], ["amount", "paid_amount"]),
    payments: normalizeNumericFields((paymentsRes.data ?? []) as Payment[], ["payment_amount"]),
    activities: normalizeNumericFields((activitiesRes.data ?? []) as CollectionActivity[], [
      "promise_amount",
    ]),
    disputes: normalizeNumericFields((disputesRes.data ?? []) as Dispute[], ["amount"]),
  };
}

async function seedIfEmpty() {
  const { count } = await supabase.from("customers").select("*", { count: "exact", head: true });
  if (count && count > 0) return;

  const { customers, invoices, payments, activities, disputes } = generateMockData();

  // Urutan insert mengikuti foreign key: customers -> invoices -> (payments, activities, disputes)
  const { error: custErr } = await supabase.from("customers").insert(customers);
  if (custErr) throw new Error(custErr.message);

  const { error: invErr } = await supabase.from("invoices").insert(invoices);
  if (invErr) throw new Error(invErr.message);

  const [payRes, actRes, dispRes] = await Promise.all([
    supabase.from("payments").insert(payments),
    supabase.from("collection_activities").insert(activities),
    supabase.from("disputes").insert(disputes),
  ]);
  const seedErr = payRes.error ?? actRes.error ?? dispRes.error;
  if (seedErr) throw new Error(seedErr.message);
}

async function deleteAllRows() {
  // Urutan delete mengikuti foreign key (anak dulu, baru induk).
  await supabase.from("collection_activities").delete().not("activity_id", "is", null);
  await supabase.from("payments").delete().not("payment_id", "is", null);
  await supabase.from("disputes").delete().not("dispute_id", "is", null);
  await supabase.from("invoices").delete().not("invoice_number", "is", null);
  await supabase.from("customers").delete().not("customer_code", "is", null);
}

/**
 * Realtime sync — supaya perubahan yang dibuat satu user (mis. Record
 * Payment) langsung terlihat di layar user lain tanpa perlu refresh manual.
 * Didengarkan lewat 1 channel untuk 5 tabel; event apa pun (insert/update/
 * delete) memicu refetch penuh yang di-debounce, bukan patch parsial —
 * lebih sederhana dan tetap konsisten dengan prinsip "satu sumber data"
 * (aturan #14 PRD: hindari kompleksitas kalau bisa lebih sederhana).
 *
 * Prasyarat: jalankan supabase/enable-realtime.sql di Supabase SQL Editor
 * supaya tabel-tabel ini diikutkan ke publication realtime.
 */
let realtimeChannel: RealtimeChannel | null = null;
let refetchTimer: ReturnType<typeof setTimeout> | null = null;

function subscribeRealtime(onChange: () => void) {
  if (realtimeChannel) return;

  const scheduleRefetch = () => {
    if (refetchTimer) clearTimeout(refetchTimer);
    refetchTimer = setTimeout(onChange, 500);
  };

  const tables = ["customers", "invoices", "payments", "collection_activities", "disputes"];
  let channel = supabase.channel("ar-data-changes");
  for (const table of tables) {
    channel = channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table },
      scheduleRefetch
    );
  }
  realtimeChannel = channel.subscribe();
}

function unsubscribeRealtime() {
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
  if (refetchTimer) {
    clearTimeout(refetchTimer);
    refetchTimer = null;
  }
}

export const useARStore = create<ARState>((set, get) => ({
  customers: [],
  invoices: [],
  payments: [],
  activities: [],
  disputes: [],
  status: "idle",
  error: null,

  init: async () => {
    if (get().status === "loading" || get().status === "ready") return;
    set({ status: "loading", error: null });
    try {
      // Tidak ada auto-seed di sini sama sekali — baik lokal maupun produksi.
      // Tabel kosong akan tetap kosong sampai diisi lewat Import Wizard, atau
      // (khusus development) lewat tombol "Reset ke Data Contoh" di Settings.
      const data = await fetchAll();
      set({ ...data, status: "ready" });
      subscribeRealtime(() => get().refetch());
    } catch (err) {
      set({ status: "error", error: err instanceof Error ? err.message : "Gagal memuat data." });
    }
  },

  refetch: async () => {
    try {
      const data = await fetchAll();
      set({ ...data });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Gagal memuat data." });
    }
  },

  reset: () => {
    unsubscribeRealtime();
    set({
      customers: [],
      invoices: [],
      payments: [],
      activities: [],
      disputes: [],
      status: "idle",
      error: null,
    });
  },

  recordPayment: async (payment) => {
    const { error: payErr } = await supabase.from("payments").insert(payment);
    if (payErr) throw new Error(payErr.message);

    const invoice = get().invoices.find((i) => i.invoice_number === payment.invoice_number);
    if (invoice) {
      const newPaidAmount = Math.min(invoice.paid_amount + payment.payment_amount, invoice.amount);
      const { error: invErr } = await supabase
        .from("invoices")
        .update({ paid_amount: newPaidAmount })
        .eq("invoice_number", payment.invoice_number);
      if (invErr) throw new Error(invErr.message);
    }

    await get().refetch();
  },

  logActivity: async (activity) => {
    const { error } = await supabase.from("collection_activities").insert(activity);
    if (error) throw new Error(error.message);
    await get().refetch();
  },

  upsertDispute: async (dispute) => {
    const { error } = await supabase.from("disputes").upsert(dispute, { onConflict: "dispute_id,user_id" });
    if (error) throw new Error(error.message);
    await get().refetch();
  },

  setInvoiceEscalated: async (invoiceNumber, escalated) => {
    const { error } = await supabase
      .from("invoices")
      .update({ is_escalated: escalated })
      .eq("invoice_number", invoiceNumber);
    if (error) throw new Error(error.message);
    await get().refetch();
  },

  replaceImportedData: async (data) => {
    if (data.customers?.length) {
      const { error } = await supabase
        .from("customers")
        .upsert(data.customers, { onConflict: "customer_code,user_id" });
      if (error) throw new Error(error.message);
    }
    if (data.invoices?.length) {
      const { error } = await supabase
        .from("invoices")
        .upsert(data.invoices, { onConflict: "invoice_number,user_id" });
      if (error) throw new Error(error.message);
    }
    if (data.activities?.length) {
      const { error } = await supabase
        .from("collection_activities")
        .upsert(data.activities, { onConflict: "activity_id,user_id" });
      if (error) throw new Error(error.message);
    }
    await get().refetch();
  },

  resetToMockData: async () => {
    set({ status: "loading" });
    try {
      await deleteAllRows();
      await seedIfEmpty();
      const data = await fetchAll();
      set({ ...data, status: "ready" });
    } catch (err) {
      set({ status: "error", error: err instanceof Error ? err.message : "Gagal mereset data." });
    }
  },

  getComputedInvoices: () => {
    const { invoices, disputes } = get();
    return invoices.map((inv) => computeInvoice(inv, disputes));
  },

  getCustomerSummary: (customerCode) => {
    const customer = get().customers.find((c) => c.customer_code === customerCode);
    if (!customer) return null;
    return computeCustomerSummary(customer, get().getComputedInvoices());
  },
}));
