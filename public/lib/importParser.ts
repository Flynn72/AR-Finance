export interface ParsedSheet {
  headers: string[];
  rows: Record<string, string>[];
}

/**
 * Membaca file .xlsx/.xls/.csv menjadi header + baris data mentah (string).
 * SheetJS di-import dinamis supaya tidak membebani initial bundle (sama
 * seperti exportService.ts) — hanya dimuat saat wizard import dibuka.
 */
export async function parseSpreadsheetFile(file: File): Promise<ParsedSheet> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];

  const rawRows: string[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: false,
    defval: "",
  });

  if (rawRows.length === 0) return { headers: [], rows: [] };

  const headers = rawRows[0].map((h) => String(h).trim());
  const rows: Record<string, string>[] = rawRows.slice(1)
    .filter((row) => row.some((cell) => String(cell).trim() !== ""))
    .map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        obj[h] = String(row[idx] ?? "").trim();
      });
      return obj;
    });

  return { headers, rows };
}
