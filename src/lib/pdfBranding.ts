import type jsPDF from "jspdf";
import logo from "/able-god-college-logo.png";
import { schoolContact } from "@/lib/schoolContact";

type RGB = readonly [number, number, number];

export function getReportPalette() {
  const styles = getComputedStyle(document.documentElement);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Unable to load report colours.");
  const readColor = (token: string): RGB => {
    context.fillStyle = `hsl(${styles.getPropertyValue(token).trim()})`;
    context.fillRect(0, 0, 1, 1);
    const channels = context.getImageData(0, 0, 1, 1).data;
    return [channels[0], channels[1], channels[2]];
  };
  return {
    navy: readColor("--report-navy"), pink: readColor("--report-pink"),
    paper: readColor("--report-paper"), tint: readColor("--report-tint"),
    ink: readColor("--report-ink"), muted: readColor("--report-muted"),
    border: readColor("--report-border"),
  };
}

export async function loadSchoolLogoDataUrl(): Promise<string | null> {
  try {
    const response = await fetch(logo);
    if (!response.ok) return null;
    const imageBlob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Unable to read the school crest."));
      reader.onerror = () => reject(reader.error ?? new Error("Unable to read the school crest."));
      reader.readAsDataURL(imageBlob);
    });
  } catch {
    return null;
  }
}

/** Draws the same school letterhead colors and contact block used on the report card. */
export function drawSchoolLetterhead(doc: jsPDF, logoDataUrl: string | null, title: string, subtitle: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const right = pageWidth - 14;
  const palette = getReportPalette();

  doc.setFillColor(...palette.navy);
  doc.rect(0, 0, pageWidth, 37, "F");
  doc.setFillColor(...palette.paper);
  doc.roundedRect(14, 6, 20, 20, 2, 2, "F");
  if (logoDataUrl) doc.addImage(logoDataUrl, "PNG", 16, 8, 16, 16);

  doc.setTextColor(255, 255, 255);
  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.text(schoolContact.name, 39, 14);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(232, 226, 241);
  doc.text("B'EZrat Hashem".toUpperCase(), 39, 20);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.8);
  doc.setTextColor(255, 255, 255);
  doc.text("CONTACT", right, 8, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.4);
  doc.text(schoolContact.phones.map((phone) => phone.label).join(" / "), right, 14, { align: "right", maxWidth: 77 });
  doc.text(schoolContact.address, right, 19, { align: "right", maxWidth: 77 });

  doc.setFont("times", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  doc.text(title.toUpperCase(), pageWidth / 2, 28, { align: "center", maxWidth: pageWidth - 28 });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(subtitle, pageWidth / 2, 34, { align: "center", maxWidth: pageWidth - 28 });

  doc.setFillColor(...palette.pink);
  doc.rect(0, 37, pageWidth, 1.4, "F");
}
