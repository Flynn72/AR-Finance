import { getTemplate, IMPORT_DATA_TYPE_LABEL, type ImportDataType, type FieldType } from "./importTemplates";

/**
 * Template diunduh langsung dari definisi field yang sama dipakai untuk
 * validasi import (importTemplates.ts) — supaya template yang dibagikan
 * ke user tidak pernah "basi"/beda dengan aturan validasi sungguhan.
 * xlsx di-import dinamis (lazy) sama seperti exportService.ts.
 */

const EXAMPLE_VALUES: Record<ImportDataType, Record<string, string | number>> = {
  invoices: {
    invoice_number: "INV-2026-1001",
    customer_code: "CUST-1000",
    invoice_date: "2026-07-01",
    due_date: "2026-08-15",
    amount: 45000000,
    paid_amount: 0,
    collector: "Budi Santoso",
    is_escalated: "false",
  },
  customers: {
    customer_code: "CUST-1000",
    customer_name: "PT Sumber Mitra Logistik",
    industry: "Logistik & Distribusi",
    contact: "finance@sumbermitra.co.id",
    credit_limit: 500000000,
    risk_level: "",
    status: "Active",
  },
  activities: {
    customer_code: "CUST-1000",
    invoice_number: "INV-2026-1001",
    activity_type: "Telepon",
    activity_date: "2026-08-10",
    notes: "Customer berjanji akan membayar minggu depan.",
    collector: "Budi Santoso",
    next_follow_up: "2026-08-17",
    is_ptp: "true",
    promise_payment_date: "2026-08-20",
    promise_amount: 45000000,
  },
};

const TYPE_LABEL: Record<FieldType, string> = {
  string: "Teks",
  number: "Angka",
  date: "Tanggal (YYYY-MM-DD, DD/MM/YYYY, atau DD-MM-YYYY)",
  boolean: "Ya/Tidak (isi: true/false, ya/tidak, atau 1/0)",
  enum: "Pilihan tetap",
};

export async function downloadImportTemplate(dataType: ImportDataType) {
  const XLSX = await import("xlsx");
  const template = getTemplate(dataType);
  const label = IMPORT_DATA_TYPE_LABEL[dataType];

  const headers = template.map((f) => f.label + (f.required ? " *" : ""));
  const exampleValues = EXAMPLE_VALUES[dataType];
  const exampleRow = template.map((f) => exampleValues[f.key] ?? "");

  const dataSheet = XLSX.utils.aoa_to_sheet([
    headers,
    exampleRow,
    [],
    [
      "* = wajib diisi. Baris 2 adalah contoh — hapus/timpa dengan data asli sebelum diimpor. Lihat sheet 'Petunjuk' untuk detail tiap kolom.",
    ],
  ]);
  dataSheet["!cols"] = headers.map((h) => ({ wch: Math.max(18, h.length + 4) }));

  const instructionRows: (string | number)[][] = [
    [`Petunjuk Import — ${label}`],
    [],
    ["Kolom", "Wajib?", "Tipe Data", "Nilai yang Diizinkan", "Keterangan"],
    ...template.map((f) => {
      let note = f.helpText ?? "";
      if (!f.required && f.defaultValue !== undefined) {
        note = (note ? note + " " : "") + `Kosongkan untuk default: ${f.defaultValue || '"-"'}.`;
      }
      return [
        f.label,
        f.required ? "Ya" : "Tidak",
        TYPE_LABEL[f.type],
        f.type === "enum" ? (f.enumValues ?? []).join(", ") : "-",
        note,
      ];
    }),
  ];
  const instructionSheet = XLSX.utils.aoa_to_sheet(instructionRows);
  instructionSheet["!cols"] = [{ wch: 22 }, { wch: 10 }, { wch: 36 }, { wch: 30 }, { wch: 45 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, dataSheet, label.slice(0, 31));
  XLSX.utils.book_append_sheet(workbook, instructionSheet, "Petunjuk");
  XLSX.writeFile(workbook, `Template_${label.replace(/\s+/g, "_")}.xlsx`);
}
