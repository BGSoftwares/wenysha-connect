import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export interface ReportCardPdfData {
  studentName: string;
  grade: string;
  class: string;
  exam: string;
  position: number;
  totalStudents: number;
  date: string;
  results: Array<{
    subject: string;
    marks: number;
    scored: number;
    percentage: number;
    grade: string;
    comment: string;
  }>;
  average: number;
  averageGrade: string;
  teacherComment: string;
  headComment: string;
  attendance: {
    totalDays: number;
    present: number;
    absent: number;
    behavior: string;
  };
}

export interface FeeStatementPdfData {
  studentName: string;
  studentId: string;
  grade: string;
  date: string;
  summary: {
    totalFees: number;
    totalPaid: number;
    balance: number;
    arrears: number;
  };
  transactions: Array<{
    date: string;
    description: string;
    amount: number;
    type: "payment" | "invoice" | "discount" | "penalty";
    reference: string;
  }>;
}

export const exportReportCardPdf = async (elementId: string, studentName: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error("Element not found for PDF export");
    return;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      width: element.scrollWidth,
      height: element.scrollHeight,
    });

    const pdf = new jsPDF("p", "mm", "a4");
    const margin = 8;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const availableWidth = pageWidth - margin * 2;
    const availableHeight = pageHeight - margin * 2;
    const scale = Math.min(availableWidth / canvas.width, availableHeight / canvas.height);
    const imgWidth = canvas.width * scale;
    const imgHeight = canvas.height * scale;

    pdf.addImage(
      canvas.toDataURL("image/png"),
      "PNG",
      (pageWidth - imgWidth) / 2,
      (pageHeight - imgHeight) / 2,
      imgWidth,
      imgHeight,
      undefined,
      "FAST",
    );
    pdf.save(`Report_Card_${studentName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
  }
};

export const exportFeeStatementPdf = async (data: FeeStatementPdfData) => {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = 210;
  const margin = 15;
  let yPos = 20;

  // Header
  pdf.setFontSize(18);
  pdf.setFont("helvetica", "bold");
  pdf.text("ABLE GOD COLLEGE", pageWidth / 2, yPos, { align: "center" });
  yPos += 8;
  
  pdf.setFontSize(14);
  pdf.text("FEE STATEMENT", pageWidth / 2, yPos, { align: "center" });
  yPos += 10;

  // Student Info
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Student: ${data.studentName}`, margin, yPos);
  pdf.text(`Date: ${data.date}`, pageWidth - margin, yPos, { align: "right" });
  yPos += 6;
  pdf.text(`Student ID: ${data.studentId}`, margin, yPos);
  pdf.text(`Grade: ${data.grade}`, pageWidth - margin, yPos, { align: "right" });
  yPos += 12;

  // Summary Box
  pdf.setFillColor(240, 240, 240);
  pdf.rect(margin, yPos, pageWidth - 2 * margin, 30, "F");
  pdf.setFont("helvetica", "bold");
  pdf.text("Account Summary", margin + 5, yPos + 8);
  pdf.setFont("helvetica", "normal");
  
  const summaryY = yPos + 15;
  const colWidth = (pageWidth - 2 * margin) / 4;
  
  pdf.text(`Total Fees:`, margin + 5, summaryY);
  pdf.text(`$${data.summary.totalFees.toFixed(2)}`, margin + 5, summaryY + 5);
  
  pdf.text(`Paid:`, margin + colWidth + 5, summaryY);
  pdf.text(`$${data.summary.totalPaid.toFixed(2)}`, margin + colWidth + 5, summaryY + 5);
  
  pdf.text(`Balance:`, margin + 2 * colWidth + 5, summaryY);
  pdf.text(`$${data.summary.balance.toFixed(2)}`, margin + 2 * colWidth + 5, summaryY + 5);
  
  pdf.text(`Arrears:`, margin + 3 * colWidth + 5, summaryY);
  pdf.text(`$${data.summary.arrears.toFixed(2)}`, margin + 3 * colWidth + 5, summaryY + 5);
  
  yPos += 40;

  // Transaction History Header
  pdf.setFont("helvetica", "bold");
  pdf.text("Transaction History", margin, yPos);
  yPos += 8;

  // Table Header
  pdf.setFillColor(34, 45, 50);
  pdf.setTextColor(255, 255, 255);
  pdf.rect(margin, yPos, pageWidth - 2 * margin, 8, "F");
  
  const cols = [margin + 3, margin + 28, margin + 88, margin + 118, margin + 148];
  pdf.setFontSize(9);
  pdf.text("Date", cols[0], yPos + 5.5);
  pdf.text("Description", cols[1], yPos + 5.5);
  pdf.text("Type", cols[2], yPos + 5.5);
  pdf.text("Reference", cols[3], yPos + 5.5);
  pdf.text("Amount", cols[4], yPos + 5.5);
  yPos += 8;

  // Transaction Rows
  pdf.setTextColor(0, 0, 0);
  pdf.setFont("helvetica", "normal");
  
  data.transactions.forEach((txn, idx) => {
    if (yPos > 270) {
      pdf.addPage();
      yPos = 20;
    }
    
    const bgColor = idx % 2 === 0 ? 255 : 245;
    pdf.setFillColor(bgColor, bgColor, bgColor);
    pdf.rect(margin, yPos, pageWidth - 2 * margin, 7, "F");
    
    pdf.text(txn.date, cols[0], yPos + 5);
    pdf.text(txn.description.substring(0, 30), cols[1], yPos + 5);
    pdf.text(txn.type.charAt(0).toUpperCase() + txn.type.slice(1), cols[2], yPos + 5);
    pdf.text(txn.reference.substring(0, 15), cols[3], yPos + 5);
    
    const amountStr = txn.type === "payment" || txn.type === "discount" 
      ? `-$${Math.abs(txn.amount).toFixed(2)}` 
      : `$${txn.amount.toFixed(2)}`;
    pdf.text(amountStr, cols[4], yPos + 5);
    
    yPos += 7;
  });

  // Footer
  yPos += 15;
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);
  pdf.text("This is an electronically generated statement.", margin, yPos);
  pdf.text(`Generated on: ${new Date().toLocaleString()}`, margin, yPos + 5);

  pdf.save(`Fee_Statement_${data.studentName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`);
};

export interface AttendancePdfRow {
  name: string;
  status: string;
}

export const buildAttendancePdf = (opts: {
  className: string;
  date: string;
  teacherName: string;
  rows: AttendancePdfRow[];
}) => {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  let y = 18;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text("ABLE GOD COLLEGE", pageWidth / 2, y, { align: "center" });
  y += 8;
  pdf.setFontSize(13);
  pdf.text("Marked Class Attendance", pageWidth / 2, y, { align: "center" });
  y += 10;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text(`Class: ${opts.className}`, 14, y);
  pdf.text(`Date: ${opts.date}`, pageWidth - 14, y, { align: "right" });
  y += 6;
  pdf.text(`Class teacher: ${opts.teacherName}`, 14, y);
  y += 10;

  const present = opts.rows.filter((row) => row.status === "present").length;
  const absent = opts.rows.filter((row) => row.status === "absent").length;
  const late = opts.rows.filter((row) => row.status === "late").length;
  pdf.setFont("helvetica", "bold");
  pdf.text(`Present: ${present}    Absent: ${absent}    Late: ${late}    Total: ${opts.rows.length}`, 14, y);
  y += 8;

  pdf.text("#", 14, y);
  pdf.text("Learner", 24, y);
  pdf.text("Status", 150, y);
  pdf.setFont("helvetica", "normal");
  pdf.line(14, y + 2, pageWidth - 14, y + 2);
  y += 8;

  opts.rows.forEach((row, index) => {
    if (y > 280) {
      pdf.addPage();
      y = 20;
    }
    pdf.text(String(index + 1), 14, y);
    pdf.text(pdf.splitTextToSize(row.name, 120)[0], 24, y);
    pdf.text(row.status.toUpperCase(), 150, y);
    y += 7;
  });

  y += 8;
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);
  pdf.text("Generated from the Able God College teacher portal for the class parents WhatsApp group.", 14, y);
  return pdf;
};

export async function sharePdfToWhatsApp(opts: {
  pdf: jsPDF;
  fileName: string;
  text: string;
  groupUrl?: string;
}): Promise<"shared" | "opened"> {
  const blob = opts.pdf.output("blob");
  const file = new File([blob], opts.fileName, { type: "application/pdf" });
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: opts.fileName, text: opts.text });
      return "shared";
    } catch {
      return "opened";
    }
  }
  opts.pdf.save(opts.fileName);
  const destination = opts.groupUrl?.trim()
    ? opts.groupUrl.trim()
    : `https://wa.me/?text=${encodeURIComponent(`${opts.text} Attach the downloaded attendance PDF.`)}`;
  window.open(destination, "_blank", "noopener,noreferrer");
  return "opened";
}
