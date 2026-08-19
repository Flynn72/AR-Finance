// Formatting util — IDR & tanggal Indonesia, sesuai PRD section 5.5 & 29
// Contoh wajib: "Rp 125.450.000" dan "12 Agustus 2026"

const idrFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatCurrency(value: number): string {
  return idrFormatter.format(value);
}

/** Versi ringkas untuk KPI card besar, mis. "Rp2,45 M" / "Rp850 Jt" */
export function formatCurrencyCompact(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000_000) {
    return `${sign}Rp${(abs / 1_000_000_000).toFixed(2).replace(".", ",")} M`;
  }
  if (abs >= 1_000_000) {
    return `${sign}Rp${(abs / 1_000_000).toFixed(0)} Jt`;
  }
  return formatCurrency(value);
}

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const dateFormatterShort = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function formatDate(value: string | Date): string {
  return dateFormatter.format(new Date(value));
}

export function formatDateShort(value: string | Date): string {
  return dateFormatterShort.format(new Date(value));
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}
