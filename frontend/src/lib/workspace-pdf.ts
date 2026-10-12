export interface PdfReport {
  title: string;
  generatedAt?: string;
  notice?: string;
  sections: { title: string; columns: string[]; rows: (string | number)[][] }[];
}

let fontRequest: Promise<string> | undefined;

async function loadFont(): Promise<string> {
  if (!fontRequest) {
    fontRequest = fetch("/fonts/NotoSans-Regular.ttf").then(async response => {
      if (!response.ok) throw new Error("The PDF font could not be loaded. Please retry.");
      const bytes = new Uint8Array(await response.arrayBuffer());
      let binary = "";
      for (let index = 0; index < bytes.length; index += 8192) {
        binary += String.fromCharCode(...bytes.subarray(index, index + 8192));
      }
      return btoa(binary);
    }).catch(error => { fontRequest = undefined; throw error; });
  }
  return fontRequest;
}

export async function createReportPdf(report: PdfReport): Promise<ArrayBuffer> {
  const [{ jsPDF }, { autoTable }, font] = await Promise.all([
    import("jspdf"), import("jspdf-autotable"), loadFont(),
  ]);
  const doc = new jsPDF({ format: "a4", unit: "mm", compress: true });
  doc.addFileToVFS("NotoSans-Regular.ttf", font);
  doc.addFont("NotoSans-Regular.ttf", "Trustix", "normal");
  doc.setFont("Trustix", "normal");
  doc.setProperties({ title: report.title, author: "Trustix", creator: "Trustix" });
  doc.setTextColor(19, 59, 83);
  doc.setFontSize(18);
  const titleLines = doc.splitTextToSize(report.title.slice(0, 300), 174);
  doc.text(titleLines, 18, 34);
  let y = 36 + titleLines.length * 8;
  doc.setFontSize(9);
  doc.setTextColor(90, 110, 116);
  doc.text(`Generated: ${report.generatedAt || new Date().toISOString()}`, 18, y);
  y += 9;
  const sections = report.notice ? [
    { title: "Important", columns: ["Notice"], rows: [[report.notice]] }, ...report.sections,
  ] : report.sections;
  for (const section of sections) {
    autoTable(doc, {
      startY: y, margin: { top: 30, right: 18, bottom: 22, left: 18 },
      head: [[{ content: section.title, colSpan: section.columns.length }], section.columns],
      body: section.rows.length ? section.rows.map(row => row.map(String)) : [[{ content: "No records in this snapshot.", colSpan: section.columns.length }]],
      theme: "grid", styles: { font: "Trustix", fontStyle: "normal", fontSize: 9, cellPadding: 3, overflow: "linebreak", textColor: [36, 63, 73], lineColor: [225, 234, 231], lineWidth: 0.15 },
      headStyles: { fillColor: [19, 102, 88], textColor: [255, 255, 255], fontStyle: "normal" },
      alternateRowStyles: { fillColor: [245, 250, 248] },
      didDrawPage: ({ cursor }) => { y = (cursor?.y || 35) + 9; },
    });
    if (y > 250 && section !== sections[sections.length - 1]) { doc.addPage(); y = 30; }
  }
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    doc.setFont("Trustix", "normal"); doc.setFontSize(11); doc.setTextColor(19, 102, 88);
    doc.text("TRUSTIX", 18, 17);
    doc.setDrawColor(19, 201, 155); doc.line(18, 21, 192, 21);
    doc.setFontSize(8); doc.setTextColor(100, 119, 123);
    doc.text("Private workspace export", 18, 285);
    doc.text(`${page} / ${pages}`, 192, 285, { align: "right" });
  }
  return doc.output("arraybuffer");
}
