import jsPDF from "jspdf";
import { schoolContact } from "@/lib/schoolContact";
import { schoolIdentity } from "@/lib/schoolInformation";
import { loadSchoolLogoDataUrl } from "@/lib/pdfBranding";

/**
 * Generates and triggers the download of an official, printable
 * Able God College Student Enrolment & Admission Application Form.
 */
export async function downloadEnrolmentFormPdf(): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Navy branding header
  doc.setFillColor(16, 38, 79); // #10264f deep navy
  doc.rect(0, 0, pageWidth, 36, "F");

  // Accent gold line
  doc.setFillColor(212, 160, 23); // #d4a017 gold
  doc.rect(0, 36, pageWidth, 2.5, "F");

  // Logo
  try {
    const logoData = await loadSchoolLogoDataUrl();
    if (logoData) {
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(margin, 5, 25, 25, 2, 2, "F");
      doc.addImage(logoData, "PNG", margin + 1.5, 6.5, 22, 22);
    }
  } catch {
    // Logo fallback
  }

  // School Letterhead Text
  doc.setTextColor(255, 255, 255);
  doc.setFont("times", "bold");
  doc.setFontSize(18);
  doc.text(schoolIdentity.name.toUpperCase(), margin + 29, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(`Motto: ${schoolIdentity.motto}  |  Values: ${schoolIdentity.schoolValues.join(" • ")}`, margin + 29, 20);
  doc.text(`Campus: ${schoolContact.address}  |  Tel: ${schoolContact.phones.map((p) => p.label).join(" / ")}`, margin + 29, 25.5);
  doc.text("Email: admissions@ablegodcollege.edu  |  Website: www.ablegodcollege.edu", margin + 29, 31);

  let y = 45;

  // Title block
  doc.setTextColor(16, 38, 79);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("STUDENT ENROLMENT & ADMISSION APPLICATION FORM", pageWidth / 2, y, { align: "center" });

  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Standard Tuition: US$ 200 per term  •  Application Fee: US$ 20  •  Enrolment Fee: US$ 50", pageWidth / 2, y, { align: "center" });

  y += 6;

  // Helper function to draw section header
  const drawSectionHeader = (title: string, currentY: number): number => {
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, currentY, contentWidth, 6.5, "F");
    doc.setFillColor(16, 38, 79);
    doc.rect(margin, currentY, 3, 6.5, "F");
    doc.setTextColor(16, 38, 79);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(title, margin + 5, currentY + 4.5);
    return currentY + 9;
  };

  // Helper function to draw form fields with underline
  const drawField = (label: string, value: string, x: number, currentY: number, width: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(label, x, currentY);

    const labelWidth = doc.getTextWidth(label) + 2;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);

    const lineX1 = x + labelWidth;
    const lineX2 = x + width;
    if (lineX2 > lineX1) {
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.line(lineX1, currentY + 0.5, lineX2, currentY + 0.5);
    }
    if (value) {
      doc.text(value, lineX1 + 1, currentY);
    }
  };

  // SECTION A: STUDENT DETAILS
  y = drawSectionHeader("SECTION A: STUDENT DETAILS", y);
  const col1 = margin;
  const col2 = margin + contentWidth / 2 + 2;
  const halfW = contentWidth / 2 - 2;

  drawField("Surname:", "", col1, y, halfW);
  drawField("First Name(s):", "", col2, y, halfW);
  y += 6.5;

  drawField("Date of Birth (DD/MM/YYYY):", "", col1, y, halfW);
  drawField("Gender:", "[   ] Male     [   ] Female", col2, y, halfW);
  y += 6.5;

  drawField("National ID / Birth Cert No:", "", col1, y, halfW);
  drawField("Form Applying For:", "[  ] Form 1   [  ] Form 2   [  ] Form 3   [  ] Form 4   [  ] A-Level", col2, y, halfW);
  y += 6.5;

  drawField("Residential Address:", "", col1, y, contentWidth);
  y += 6.5;
  drawField("City / Town:", "", col1, y, halfW);
  drawField("Religious Affiliation:", "", col2, y, halfW);
  y += 8;

  // SECTION B: PREVIOUS ACADEMIC RECORD
  y = drawSectionHeader("SECTION B: PREVIOUS ACADEMIC RECORD", y);
  drawField("Previous School Attended:", "", col1, y, halfW);
  drawField("Highest Grade / Form Passed:", "", col2, y, halfW);
  y += 6.5;

  drawField("Grade 7 Units / O-Level Passes:", "", col1, y, halfW);
  drawField("Reason for Leaving Previous School:", "", col2, y, halfW);
  y += 6.5;

  drawField("Intended Academic Track / Subject Choices (Arts, Commercials, Sciences):", "", col1, y, contentWidth);
  y += 8;

  // SECTION C: PARENT / GUARDIAN INFORMATION
  y = drawSectionHeader("SECTION C: PARENT / GUARDIAN INFORMATION", y);
  drawField("Parent / Guardian Full Name:", "", col1, y, halfW);
  drawField("Relationship to Student:", "", col2, y, halfW);
  y += 6.5;

  drawField("Primary Phone / WhatsApp:", "", col1, y, halfW);
  drawField("Alternative Phone:", "", col2, y, halfW);
  y += 6.5;

  drawField("Email Address:", "", col1, y, halfW);
  drawField("Occupation / Employer:", "", col2, y, halfW);
  y += 6.5;

  drawField("Physical Home Address:", "", col1, y, contentWidth);
  y += 8;

  // SECTION D: EMERGENCY & MEDICAL INFORMATION
  y = drawSectionHeader("SECTION D: EMERGENCY & HEALTH NOTIFICATION", y);
  drawField("Emergency Contact Person:", "", col1, y, halfW);
  drawField("Emergency Phone Number:", "", col2, y, halfW);
  y += 6.5;
  drawField("Known Medical Conditions / Allergies:", "None  /  Specify: _____________________________________", col1, y, contentWidth);
  y += 8;

  // SECTION E: FEES & DECLARATION
  y = drawSectionHeader("SECTION E: TUITION FEE & PARENT DECLARATION", y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const declarationText =
    "1. I agree that tuition fees are US$ 200 per term (or prevailing official equivalent) payable on or before the first day of each term.\n" +
    "2. I understand that the application fee (US$ 20) and enrolment fee (US$ 50) are non-refundable.\n" +
    "3. I agree to abide by the school code of conduct, uniform requirements, punctual arrival by 6:55 AM, and disciplinary regulations of Able God College.\n" +
    "4. I certify that the information given above is true, complete, and accurate.";

  const splitDeclaration = doc.splitTextToSize(declarationText, contentWidth);
  doc.text(splitDeclaration, margin, y);
  y += 18;

  drawField("Parent / Guardian Signature:", "", col1, y, halfW);
  drawField("Date (DD/MM/YYYY):", "", col2, y, halfW);
  y += 8;

  // SECTION F: OFFICIAL USE ONLY
  y = drawSectionHeader("SECTION F: FOR OFFICIAL USE ONLY (ADMISSIONS OFFICE)", y);
  drawField("Application Status: [  ] Approved   [  ] Pending   [  ] Rejected", "", col1, y, halfW);
  drawField("Assigned Class / Stream:", "", col2, y, halfW);
  y += 6.5;
  drawField("Receipt / Reference Number:", "", col1, y, halfW);
  drawField("Authorised Signature & School Stamp:", "", col2, y, halfW);

  // Footer bar
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Able God College Admissions Office  •  3878 Zexcom, Masvingo  •  +263 779 381 415 / +263 775 686 614  •  Page 1 of 1`,
    pageWidth / 2,
    pageHeight - 6,
    { align: "center" }
  );

  doc.save("Able_God_College_Student_Enrolment_Form.pdf");
}
