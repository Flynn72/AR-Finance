import { create } from "zustand";

/**
 * State UI murni (modal terbuka/tertutup + konteks invoice terkait) —
 * terpisah dari useARStore supaya "data" dan "UI state" tidak tercampur.
 * Dipakai supaya Record Payment & Kirim Pengingat bisa dipicu dari banyak
 * tempat (Sidebar, Invoice table, Invoice Detail Drawer, Dashboard widget)
 * tanpa duplikasi modal di tiap halaman.
 */
interface UIState {
  recordPaymentOpen: boolean;
  recordPaymentInvoiceNumber: string | null;
  openRecordPayment: (invoiceNumber?: string) => void;
  closeRecordPayment: () => void;

  reminderOpen: boolean;
  reminderInvoiceNumber: string | null;
  openReminder: (invoiceNumber: string) => void;
  closeReminder: () => void;

  logActivityOpen: boolean;
  logActivityInvoiceNumber: string | null;
  openLogActivity: (invoiceNumber?: string) => void;
  closeLogActivity: () => void;

  importWizardOpen: boolean;
  openImportWizard: () => void;
  closeImportWizard: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  recordPaymentOpen: false,
  recordPaymentInvoiceNumber: null,
  openRecordPayment: (invoiceNumber) =>
    set({ recordPaymentOpen: true, recordPaymentInvoiceNumber: invoiceNumber ?? null }),
  closeRecordPayment: () =>
    set({ recordPaymentOpen: false, recordPaymentInvoiceNumber: null }),

  reminderOpen: false,
  reminderInvoiceNumber: null,
  openReminder: (invoiceNumber) => set({ reminderOpen: true, reminderInvoiceNumber: invoiceNumber }),
  closeReminder: () => set({ reminderOpen: false, reminderInvoiceNumber: null }),

  logActivityOpen: false,
  logActivityInvoiceNumber: null,
  openLogActivity: (invoiceNumber) =>
    set({ logActivityOpen: true, logActivityInvoiceNumber: invoiceNumber ?? null }),
  closeLogActivity: () => set({ logActivityOpen: false, logActivityInvoiceNumber: null }),

  importWizardOpen: false,
  openImportWizard: () => set({ importWizardOpen: true }),
  closeImportWizard: () => set({ importWizardOpen: false }),
}));
