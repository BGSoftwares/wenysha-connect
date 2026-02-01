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
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    const pdf = new jsPDF("p", "mm", "a4");
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

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
  pdf.text("WENYASHA INTERNATIONAL SCHOOL", pageWidth / 2, yPos, { align: "center" });
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
