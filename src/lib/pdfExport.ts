import type jsPDF from "jspdf";
import { loadJsPdf } from "@/lib/loadJsPdf";
import { formatLocalDateKey } from "@/lib/zimbabweSchoolCalendar";
import { qrMatrix } from "@/lib/qrCode";
import { drawSchoolLetterhead, getReportPalette, loadSchoolLogoDataUrl } from "@/lib/pdfBranding";

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
    absent?: boolean;
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
  currencyBreakdown?: Array<{
    currency: "USD" | "ZWG";
    totalFees: number;
    totalPaid: number;
    balance: number;
  }>;
  transactions: Array<{
    date: string;
    description: string;
    amount: number;
    type: "payment" | "invoice" | "discount" | "penalty";
    reference: string;
    currency?: "USD" | "ZWG";
  }>;
}

export interface StudentReportCardPdfData {
  studentName: string;
  studentId: string;
  className: string;
  examName: string;
  termLabel: string;
  reportHeading: string;
  reportPeriod: string;
  issuedDate: string;
  average: number;
  overallGrade: string;
  passed: number;
  totalSubjects: number;
  classPosition: string;
  levelPosition: string;
  /** "Position in 3B1 & 3B2" when the class shares a level; the class position then already is the overall one. */
  positionLabel?: string;
  /** Link to the report in the student's portal account, printed as a QR code. */
  qrUrl?: string;
  teacherComment: string;
  principalComment: string;
  attendance: {
    totalDays: number;
    schoolDays: number;
    present: number;
    absent: number;
    late: number;
    excused?: number;
    sickBay?: number;
    suspended?: number;
    unrecorded: number;
    absentDates: string[];
    throughDate: string;
    calendarLabel: string;
    isOutOfDate?: boolean;
  };
  results: Array<{ subject: string; marks: number; scored: number; absent?: boolean; percentage: number; grade: string; comment: string }>;
}

export const exportReportCardPdf = async (data: StudentReportCardPdfData) => {
  const JsPdf = await loadJsPdf();
  const pdf = new JsPdf("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const left = 14;
  const right = pageWidth - left;
  const width = right - left;
  const palette = getReportPalette();

  const schoolLogo = await loadSchoolLogoDataUrl();
  drawSchoolLetterhead(pdf, schoolLogo, data.reportHeading, `${data.reportPeriod} · ${data.examName}`);

  pdf.setTextColor(...palette.ink);
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
  pdf.setDrawColor(...palette.border);
  pdf.line(left, 70, right, 70);

  const summaryY = 75;
  const summaryWidth = width / 4;
  const summary = [
    ["AVERAGE", `${data.average.toFixed(2)}%`],
    ["GRADE", data.overallGrade],
    ["PASSED", `${data.passed} / ${data.totalSubjects}`],
    [data.positionLabel ? data.positionLabel.toUpperCase() : "CLASS POSITION", data.classPosition],
  ];
  summary.forEach(([label, value], index) => {
    const x = left + index * summaryWidth;
    pdf.setFillColor(...(index === 0 ? palette.navy : palette.tint));
    pdf.roundedRect(x, summaryY, summaryWidth - 1.5, 18, 2, 2, "F");
    pdf.setTextColor(...(index === 0 ? palette.paper : palette.muted));
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.5);
    pdf.text(label, x + 3, summaryY + 6);
    pdf.setTextColor(...(index === 0 ? palette.paper : palette.navy));
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
  pdf.setFillColor(...palette.navy);
  pdf.rect(left, tableTop, width, headerHeight, "F");
  pdf.setTextColor(...palette.paper);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  pdf.text("Subject", left + 3, tableTop + 6);
  pdf.text("Score", 88, tableTop + 6, { align: "right" });
  pdf.text("Out of", 108, tableTop + 6, { align: "right" });
  pdf.text("Percentage", 135, tableTop + 6, { align: "right" });
  pdf.text("Grade", 154, tableTop + 6, { align: "right" });
  pdf.text("Subject comment", 158, tableTop + 6);

  let y = tableTop + headerHeight;
  data.results.forEach((result, index) => {
    const commentLines = pdf.splitTextToSize(result.comment || "", right - 161);
    const currentRowHeight = Math.max(rowHeight, Math.min(13, 3 + commentLines.length * 3.2));
    if (index % 2 === 1) {
      pdf.setFillColor(...palette.tint);
      pdf.rect(left, y, width, currentRowHeight, "F");
    }
    pdf.setDrawColor(...palette.border);
    pdf.line(left, y + currentRowHeight, right, y + currentRowHeight);
    pdf.setTextColor(...palette.ink);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    const baseline = y + Math.min(currentRowHeight - 1.5, 4.4);
    pdf.text(pdf.splitTextToSize(result.subject, 50)[0], left + 3, baseline);
    pdf.text(result.absent ? "ABS" : String(Math.round(result.scored * 100) / 100), 88, baseline, { align: "right" });
    pdf.text(String(result.marks), 108, baseline, { align: "right" });
    pdf.text(result.absent ? "—" : `${result.percentage.toFixed(1)}%`, 135, baseline, { align: "right" });
    pdf.setFont("helvetica", "bold");
    pdf.text(result.grade, 154, baseline, { align: "right" });
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    if (commentLines.length) {
      const maxCommentLines = Math.max(1, Math.floor((currentRowHeight - 2) / 3.2));
      const visibleCommentLines = commentLines.slice(0, maxCommentLines);
      if (commentLines.length > maxCommentLines) {
        visibleCommentLines[maxCommentLines - 1] = `${visibleCommentLines[maxCommentLines - 1].slice(0, -3)}...`;
      }
      pdf.text(visibleCommentLines, 158, baseline);
    }
    y += currentRowHeight;
  });

  y += 8;
  pdf.setTextColor(...palette.navy);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  if (!data.positionLabel) pdf.text(`Level position: ${data.levelPosition}`, left, y);
  y += 6;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  const attendanceLines = pdf.splitTextToSize(
    `${data.attendance.calendarLabel} through ${data.attendance.throughDate}: ${data.attendance.totalDays} marked days · ${data.attendance.present} present · ${data.attendance.absent} unexcused absent · ${data.attendance.excused ?? 0} excused · ${data.attendance.late} late · ${data.attendance.sickBay ?? 0} sick bay · ${data.attendance.suspended ?? 0} suspended · ${data.attendance.unrecorded} unmarked of ${data.attendance.schoolDays} scheduled school days`,
    width,
  );
  pdf.text(attendanceLines, left, y);
  y += attendanceLines.length * 4 + 3;
  const absentDatesText = data.attendance.absentDates.length
    ? `Absent dates: ${data.attendance.absentDates.join(", ")}`
    : "Absent dates: none recorded";
  const absentDateLines = pdf.splitTextToSize(absentDatesText, width);
  if (y + absentDateLines.length * 4 > pageHeight - 20) {
    pdf.addPage();
    y = 20;
  }
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.text(absentDateLines, left, y);
  y += absentDateLines.length * 4 + 4;

  const comments = [
    ["CLASS TEACHER'S COMMENT", data.teacherComment],
    ["PRINCIPAL'S COMMENT", data.principalComment],
  ].filter((item) => item[1]);
  if (comments.length && y < pageHeight - 39) {
    const gap = 5;
    const columnWidth = (width - gap) / comments.length;
    comments.forEach(([label, comment], index) => {
      const x = left + index * (columnWidth + gap);
      const lines = pdf.splitTextToSize(comment, columnWidth - 8);
      const boxHeight = Math.max(18, Math.min(38, 10 + lines.length * 4.2));
      pdf.setDrawColor(...palette.border);
      pdf.setFillColor(...palette.tint);
      pdf.roundedRect(x, y, columnWidth, boxHeight, 2, 2, "FD");
      pdf.setFillColor(...palette.pink);
      pdf.rect(x, y + 2, 0.6, boxHeight - 4, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7.5);
      pdf.setTextColor(...palette.muted);
      pdf.text(label, x + 4, y + 6);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(...palette.ink);
      pdf.text(lines.slice(0, 5), x + 4, y + 12);
    });
  }

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(...palette.muted);
  pdf.text(`Issued ${data.issuedDate} · Available in the student portal`, left, pageHeight - 9);

  const qr = data.qrUrl ? qrMatrix(data.qrUrl) : null;
  if (qr) {
    const quiet = 2;
    const modules = qr.length + quiet * 2;
    const side = 22;
    const unit = side / modules;
    const qrLeft = right - side;
    const qrTop = pageHeight - 12 - side;
    pdf.setFillColor(255, 255, 255);
    pdf.rect(qrLeft, qrTop, side, side, "F");
    pdf.setFillColor(11, 27, 58);
    qr.forEach((row, r) => row.forEach((dark, c) => {
      if (dark) pdf.rect(qrLeft + (c + quiet) * unit, qrTop + (r + quiet) * unit, unit + 0.02, unit + 0.02, "F");
    }));
    pdf.text("Scan to open this report in the portal", qrLeft + side, pageHeight - 9, { align: "right" });
  }

  const safeName = data.studentName.trim().replace(/[^a-z0-9-_]+/gi, "_") || "Student";
  pdf.save(`Report_Card_${safeName}_${formatLocalDateKey(new Date())}.pdf`);
};

export const exportFeeStatementPdf = async (data: FeeStatementPdfData) => {
  const JsPdf = await loadJsPdf();
  const pdf = new JsPdf("p", "mm", "a4");
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
  const breakdown = data.currencyBreakdown?.length ? data.currencyBreakdown : [{ currency: "USD" as const, ...data.summary }];
  const summaryHeight = 18 + breakdown.length * 7;
  pdf.setFillColor(240, 240, 240);
  pdf.rect(margin, yPos, pageWidth - 2 * margin, summaryHeight, "F");
  pdf.setFont("helvetica", "bold");
  pdf.text("Account Summary", margin + 5, yPos + 8);
  pdf.setFont("helvetica", "normal");
  const summaryY = yPos + 15;
  const colWidth = (pageWidth - 2 * margin) / 4;
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  ["Currency", "Total Fees", "Paid", "Balance"].forEach((label, index) => pdf.text(label, margin + 5 + index * colWidth, summaryY));
  pdf.setFont("helvetica", "normal");
  breakdown.forEach((item, index) => {
    const rowY = summaryY + 6 + index * 7;
    const symbol = item.currency === "USD" ? "US$" : "ZiG";
    [item.currency, `${symbol} ${item.totalFees.toFixed(2)}`, `${symbol} ${item.totalPaid.toFixed(2)}`, `${symbol} ${item.balance.toFixed(2)}`]
      .forEach((value, column) => pdf.text(value, margin + 5 + column * colWidth, rowY));
  });
  pdf.setFontSize(9);
  yPos += summaryHeight + 10;

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
      ? `-${txn.currency === "ZWG" ? "ZiG" : "US$"} ${Math.abs(txn.amount).toFixed(2)}`
      : `${txn.currency === "ZWG" ? "ZiG" : "US$"} ${txn.amount.toFixed(2)}`;
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

export const buildAttendancePdf = async (opts: {
  className: string;
  date: string;
  teacherName: string;
  rows: AttendancePdfRow[];
}) => {
  const JsPdf = await loadJsPdf();
  const pdf = new JsPdf("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  let y = 18;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text("ABLE GOD COLLEGE", pageWidth / 2, y, { align: "center" });
  y += 8;
  pdf.setFontSize(13);
  pdf.text("Class Attendance Register", pageWidth / 2, y, { align: "center" });
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
  const unmarked = opts.rows.filter((row) => row.status === "unmarked").length;
  pdf.setFont("helvetica", "bold");
  pdf.text(`Present: ${present}    Absent: ${absent}    Late: ${late}    Unmarked: ${unmarked}    Total: ${opts.rows.length}`, 14, y, { maxWidth: pageWidth - 28 });
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


const money = (value: number | string, currency: string) =>
  `${currency} ${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const schoolHeader = (pdf: jsPDF, title: string) => {
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text("ABLE GOD COLLEGE", 105, 20, { align: "center" });
  pdf.setFontSize(14);
  pdf.text(title, 105, 29, { align: "center" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
};

const detailRows = (pdf: jsPDF, rows: Array<[string, string]>, startY: number) => {
  let y = startY;
  for (const [label, value] of rows) {
    pdf.setFont("helvetica", "bold");
    pdf.text(label, 20, y);
    pdf.setFont("helvetica", "normal");
    pdf.text(value || "—", 70, y);
    y += 8;
  }
  return y;
};

export interface InvoicePdfData {
  invoice_no: string;
  student_name: string;
  student_id?: string;
  class_name?: string;
  term: string;
  amount: string | number;
  paid: string | number;
  currency: string;
  status: string;
  date: string;
}

/** A one page invoice the accounts office can print or send. */
export const exportInvoicePdf = async (data: InvoicePdfData) => {
  const JsPdf = await loadJsPdf();
  const pdf = new JsPdf("p", "mm", "a4");
  schoolHeader(pdf, "INVOICE");
  const balance = Number(data.amount) - Number(data.paid);
  const y = detailRows(pdf, [
    ["Invoice number", data.invoice_no],
    ["Date", data.date],
    ["Student", data.student_name],
    ["Student ID", data.student_id ?? ""],
    ["Class", data.class_name ?? ""],
    ["Term", data.term],
    ["Status", data.status.toUpperCase()],
  ], 48);
  pdf.setDrawColor(200);
  pdf.line(20, y + 2, 190, y + 2);
  detailRows(pdf, [
    ["Amount billed", money(data.amount, data.currency)],
    ["Paid so far", money(data.paid, data.currency)],
    ["Balance due", money(Math.max(0, balance), data.currency)],
  ], y + 12);
  pdf.setFontSize(9);
  pdf.text("Pay using the invoice number as your reference. Payments are credited automatically.", 105, 280, { align: "center" });
  pdf.save(`invoice-${data.invoice_no}.pdf`);
};

export interface ReceiptPdfData {
  receipt_no: string;
  invoice_no: string;
  student_name: string;
  amount: string | number;
  currency: string;
  method: string;
  reference?: string;
  date: string;
  recorded_by?: string;
}

/** The receipt handed to a parent after a payment. */
export const exportReceiptPdf = async (data: ReceiptPdfData) => {
  const JsPdf = await loadJsPdf();
  const pdf = new JsPdf("p", "mm", "a4");
  schoolHeader(pdf, "PAYMENT RECEIPT");
  const y = detailRows(pdf, [
    ["Receipt number", data.receipt_no],
    ["Date", data.date],
    ["Student", data.student_name],
    ["Invoice", data.invoice_no],
    ["Payment method", data.method],
    ["Reference", data.reference ?? ""],
    ["Received by", data.recorded_by ?? ""],
  ], 48);
  pdf.setDrawColor(200);
  pdf.line(20, y + 2, 190, y + 2);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.text("Amount received", 20, y + 14);
  pdf.text(money(data.amount, data.currency), 190, y + 14, { align: "right" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text("Thank you. Please keep this receipt for your records.", 105, 280, { align: "center" });
  pdf.save(`receipt-${data.receipt_no}.pdf`);
};
