import type { Customer, Dispute, Invoice, Payment, CollectionActivity } from "../types";
import { computeInvoice } from "./calculations";

export function getInvoiceContext(
  invoiceNumber: string | null,
  data: {
    invoices: Invoice[];
    customers: Customer[];
    payments: Payment[];
    activities: CollectionActivity[];
    disputes: Dispute[];
  }
) {
  if (!invoiceNumber) return null;
  const invoice = data.invoices.find((i) => i.invoice_number === invoiceNumber);
  if (!invoice) return null;

  const customer = data.customers.find((c) => c.customer_code === invoice.customer_code);
  const computed = computeInvoice(invoice, data.disputes);
  const payments = data.payments
    .filter((p) => p.invoice_number === invoiceNumber)
    .sort((a, b) => b.payment_date.localeCompare(a.payment_date));
  const activities = data.activities
    .filter((a) => a.invoice_number === invoiceNumber)
    .sort((a, b) => b.activity_date.localeCompare(a.activity_date));
  const dispute = data.disputes.find(
    (d) =>
      d.invoice_number === invoiceNumber &&
      ["Open", "Under Review", "Waiting Customer"].includes(d.status)
  );

  return { invoice: computed, customer, payments, activities, dispute };
}
