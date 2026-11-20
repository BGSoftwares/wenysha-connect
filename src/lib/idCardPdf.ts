import jsPDF from "jspdf";
import { getReportPalette, loadSchoolLogoDataUrl } from "@/lib/pdfBranding";
import { layoutCode128 } from "@/lib/code128";
import { schoolContact } from "@/lib/schoolContact";

export interface IdCardStudent {
  student_id: string;
  name: string;
  class_name: string;
  gender?: string;
}

const CARD_W = 85.6; // standard ID card size (CR80), in millimetres
const CARD_H = 54;
const GAP = 4;

/** Ten cards per A4 page, with crop-friendly gaps. Each card carries the crest, name, class, student number and a Code 128 barcode. */
export async function exportStudentIdCardsPdf(students: IdCardStudent[], fileName = "student-id-cards.pdf") {
  if (!students.length) throw new Error("There are no students to print cards for.");
  const palette = getReportPalette();
  const logo = await loadSchoolLogoDataUrl();
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const left = (doc.internal.pageSize.getWidth() - (CARD_W * 2 + GAP)) / 2;
  const top = (doc.internal.pageSize.getHeight() - (CARD_H * 5 + GAP * 4)) / 2;

  students.forEach((student, index) => {
    const slot = index % 10;
    if (index > 0 && slot === 0) doc.addPage();
    const x = left + (slot % 2) * (CARD_W + GAP);
    const y = top + Math.floor(slot / 2) * (CARD_H + GAP);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...palette.border);
    doc.roundedRect(x, y, CARD_W, CARD_H, 3, 3, "FD");
    doc.setFillColor(...palette.navy);
    doc.roundedRect(x, y, CARD_W, 13, 3, 3, "F");
    doc.rect(x, y + 8, CARD_W, 5, "F");
    doc.setFillColor(...palette.pink);
    doc.rect(x, y + 13, CARD_W, 1.2, "F");
    if (logo) doc.addImage(logo, "PNG", x + 3, y + 1.8, 9.4, 9.4);

    doc.setTextColor(255, 255, 255);
    doc.setFont("times", "bold");
    doc.setFontSize(10);
    doc.text(schoolContact.name, x + 14.5, y + 6.2);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.text("STUDENT IDENTITY CARD", x + 14.5, y + 10.2);

    doc.setTextColor(...palette.ink);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(student.name, x + 5, y + 22, { maxWidth: CARD_W - 10 });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...palette.muted);
    doc.text(student.class_name || "Class not set", x + 5, y + 27.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...palette.ink);
    doc.text(`Student no. ${student.student_id}`, x + 5, y + 32.5);

    // Barcode, centred, with the number printed under it for manual entry.
    const moduleWidth = 0.28;
    const width = layoutCode128(student.student_id, moduleWidth, () => undefined);
    const barLeft = x + (CARD_W - width) / 2;
    doc.setFillColor(0, 0, 0);
    layoutCode128(student.student_id, moduleWidth, (offset, barWidth) => doc.rect(barLeft + offset, y + 36, barWidth, 11, "F"));
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.text(student.student_id, x + CARD_W / 2, y + 50.5, { align: "center" });
  });

  doc.save(fileName);
}
