import type { Customer, InvoiceComputed } from "../types";
import { computeCustomerSummary, computeDSO } from "./calculations";

export interface CustomerRow {
  customer: Customer;
  summary: ReturnType<typeof computeCustomerSummary>;
  dso: number;
  invoiceCount: number;
}

/**
 * Baris untuk Customer Directory — satu sumber (computedInvoices dari store)
 * dipakai untuk menghitung exposure, credit utilization, dan DSO per customer.
 */
export function getCustomerRows(
  customers: Customer[],
  computedInvoices: InvoiceComputed[]
): CustomerRow[] {
  return customers.map((customer) => {
    const customerInvoices = computedInvoices.filter(
      (inv) => inv.customer_code === customer.customer_code
    );
    return {
      customer,
      summary: computeCustomerSummary(customer, computedInvoices),
      dso: computeDSO(customerInvoices),
      invoiceCount: customerInvoices.length,
    };
  });
}
