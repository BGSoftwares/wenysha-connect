import jsPDF from "jspdf";

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

export interface StudentReportCardPdfData {
  studentName: string;
  studentId: string;
  className: string;
  examName: string;
  termLabel: string;
  issuedDate: string;
  average: number;
  overallGrade: string;
  passed: number;
  totalSubjects: number;
  classPosition: string;
  levelPosition: string;
  teacherComment: string;
  principalComment: string;
  attendance: { totalDays: number; present: number; absent: number };
  results: Array<{ subject: string; marks: number; scored: number; percentage: number; grade: string }>;
}

export const exportReportCardPdf = async (data: StudentReportCardPdfData) => {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const left = 14;
  const right = pageWidth - left;
  const width = right - left;

  pdf.setFillColor(20, 36, 79);
  pdf.rect(0, 0, pageWidth, 34, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text("ABLE GOD COLLEGE", pageWidth / 2, 14, { align: "center" });
  pdf.setFontSize(11);
  pdf.text("STUDENT REPORT CARD", pageWidth / 2, 23, { align: "center" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text(data.examName, pageWidth / 2, 30, { align: "center", maxWidth: width });

  pdf.setTextColor(35, 39, 60);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.text("Student", left, 44);
  pdf.text("Student ID", 112, 44);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text(pdf.splitTextToSize(data.studentName, 85)[0], left, 50);
  pdf.text(data.studentId || "—", 112, 50);
  pdf.setFont("helvetica", "bold");
  pdf.text("Class", left, 59);
  pdf.text("Term", 112, 59);
  pdf.setFont("helvetica", "normal");
  pdf.text(data.className || "—", left, 65);
  pdf.text(data.termLabel, 112, 65, { maxWidth: 82 });
  pdf.setDrawColor(221, 210, 220);
  pdf.line(left, 70, right, 70);

  const summaryY = 75;
  const summaryWidth = width / 4;
  const summary = [
    ["AVERAGE", `${data.average.toFixed(2)}%`],
    ["GRADE", data.overallGrade],
    ["PASSED", `${data.passed} / ${data.totalSubjects}`],
    ["CLASS POSITION", data.classPosition],
  ];
  summary.forEach(([label, value], index) => {
    const x = left + index * summaryWidth;
    pdf.setFillColor(index % 2 ? 249 : 244, index % 2 ? 243 : 239, index % 2 ? 247 : 244);
    pdf.roundedRect(x, summaryY, summaryWidth - 1.5, 18, 2, 2, "F");
    pdf.setTextColor(115, 108, 126);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.5);
    pdf.text(label, x + 3, summaryY + 6);
    pdf.setTextColor(23, 36, 76);
    pdf.setFontSize(10);
    pdf.text(pdf.splitTextToSize(value, summaryWidth - 6)[0], x + 3, summaryY + 13);
  });

  const tableTop = 101;
  const headerHeight = 9;
  const reserve = data.teacherComment || data.principalComment ? 45 : 28;
  const availableRowsHeight = pageHeight - 15 - tableTop - headerHeight - reserve;
  const rowHeight = data.results.length
    ? Math.max(5.5, Math.min(9, availableRowsHeight / data.results.length))
    : 9;
  pdf.setFillColor(20, 43, 86);
  pdf.rect(left, tableTop, width, headerHeight, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  pdf.text("Subject", left + 3, tableTop + 6);
  pdf.text("Score", 119, tableTop + 6, { align: "right" });
  pdf.text("Out of", 139, tableTop + 6, { align: "right" });
  pdf.text("Percentage", 169, tableTop + 6, { align: "right" });
  pdf.text("Grade", right - 3, tableTop + 6, { align: "right" });

  let y = tableTop + headerHeight;
  data.results.forEach((result, index) => {
    if (index % 2 === 1) {
      pdf.setFillColor(248, 245, 248);
      pdf.rect(left, y, width, rowHeight, "F");
    }
    pdf.setDrawColor(232, 226, 233);
    pdf.line(left, y + rowHeight, right, y + rowHeight);
    pdf.setTextColor(37, 41, 62);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    const baseline = y + Math.min(rowHeight - 1.5, 4.4);
    pdf.text(pdf.splitTextToSize(result.subject, 85)[0], left + 3, baseline);
    pdf.text(result.scored.toFixed(2), 119, baseline, { align: "right" });
    pdf.text(String(result.marks), 139, baseline, { align: "right" });
    pdf.text(`${result.percentage.toFixed(1)}%`, 169, baseline, { align: "right" });
    pdf.setFont("helvetica", "bold");
    pdf.text(result.grade, right - 3, baseline, { align: "right" });
    y += rowHeight;
  });

  y += 8;
  pdf.setTextColor(23, 36, 76);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.text(`Level position: ${data.levelPosition}`, left, y);
  pdf.text(`Attendance: ${data.attendance.present}/${data.attendance.totalDays} days present · ${data.attendance.absent} absent`, right, y, { align: "right", maxWidth: 112 });
  y += 8;

  const comments = [
    ["TEACHER COMMENT", data.teacherComment],
    ["PRINCIPAL'S COMMENT", data.principalComment],
  ].filter((item) => item[1]);
  if (comments.length && y < pageHeight - 39) {
    const gap = 5;
    const columnWidth = (width - gap) / comments.length;
    comments.forEach(([label, comment], index) => {
      const x = left + index * (columnWidth + gap);
      const lines = pdf.splitTextToSize(comment, columnWidth - 8);
      const boxHeight = Math.max(18, Math.min(38, 10 + lines.length * 4.2));
      pdf.setDrawColor(226, 214, 224);
      pdf.setFillColor(255, 250, 253);
      pdf.roundedRect(x, y, columnWidth, boxHeight, 2, 2, "FD");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7.5);
      pdf.setTextColor(115, 108, 126);
      pdf.text(label, x + 4, y + 6);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(55, 52, 69);
      pdf.text(lines.slice(0, 5), x + 4, y + 12);
    });
  }

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(120, 120, 130);
  pdf.text(`Issued ${data.issuedDate} · Available in the student portal`, left, pageHeight - 9);
  const safeName = data.studentName.trim().replace(/[^a-z0-9-_]+/gi, "_") || "Student";
  pdf.save(`Report_Card_${safeName}_${new Date().toISOString().split("T")[0]}.pdf`);
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
    } catch { /* fall back to a downloadable PDF and WhatsApp link */ }
  }
  opts.pdf.save(opts.fileName);
  const destination = opts.groupUrl?.trim()
    ? opts.groupUrl.trim()
    : `https://wa.me/?text=${encodeURIComponent(`${opts.text} Attach the downloaded attendance PDF.`)}`;
  window.open(destination, "_blank", "noopener,noreferrer");
  return "opened";
}
