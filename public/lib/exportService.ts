/**
 * Layanan export context-sensitive (PRD section 4A "Export" & section 25):
 * data yang diexport adalah data yang sedang ditampilkan, bukan seluruh
 * database. Dipakai oleh halaman Reports (dan bisa dipakai halaman lain
 * ke depannya lewat fungsi generik yang sama).
 *
 * xlsx & jsPDF di-import secara dinamis (lazy) supaya tidak membengkakkan
 * initial bundle — keduanya cukup berat dan hanya dibutuhkan saat user
 * benar-benar menekan tombol export.
 */

export interface ExportSheet {
  name: string;
  headers: string[];
  rows: (string | number)[][];
  /** Index kolom (0-based) yang nilainya IDR — akan diberi format angka Rupiah asli di Excel, bukan teks. */
  currencyColumns?: number[];
}

const IDR_NUMBER_FORMAT = '"Rp"#,##0';

export async function exportToExcel(filename: string, sheets: ExportSheet[]) {
  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();

  for (const sheet of sheets) {
    const worksheet = XLSX.utils.aoa_to_sheet([sheet.headers, ...sheet.rows]);

    if (sheet.currencyColumns?.length) {
      sheet.rows.forEach((_, rowIdx) => {
        for (const colIdx of sheet.currencyColumns!) {
          const cellRef = XLSX.utils.encode_cell({ r: rowIdx + 1, c: colIdx }); // +1: lewati baris header
          const cell = worksheet[cellRef];
          if (cell && cell.t === "n") cell.z = IDR_NUMBER_FORMAT;
        }
      });
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name.slice(0, 31));
  }
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export interface PdfSection {
  heading: string;
  columns: string[];
  rows: (string | number)[][];
}

export async function exportToPdf(filename: string, title: string, sections: PdfSection[]) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new jsPDF();
  const marginX = 14;
  let cursorY = 18;

  doc.setFontSize(14);
  doc.text(title, marginX, cursorY);
  doc.setFontSize(9);
  doc.setTextColor(100);
  cursorY += 6;
  doc.text(`Dibuat pada ${new Date().toLocaleDateString("id-ID", { dateStyle: "long" })}`, marginX, cursorY);
  doc.setTextColor(20);
  cursorY += 6;

  for (const section of sections) {
    doc.setFontSize(11);
    doc.text(section.heading, marginX, cursorY + 4);

    autoTable(doc, {
      startY: cursorY + 7,
      head: [section.columns],
      body: section.rows.map((row) => row.map(String)),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [15, 23, 42] },
      margin: { left: marginX, right: marginX },
    });

    // @ts-expect-error -- lastAutoTable ditambahkan runtime oleh plugin jspdf-autotable
    cursorY = doc.lastAutoTable.finalY + 10;
  }

  doc.save(`${filename}.pdf`);
}
