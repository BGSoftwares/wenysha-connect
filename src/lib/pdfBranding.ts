import type jsPDF from "jspdf";
import logo from "/able-god-college-logo.png";
import { schoolContact } from "@/lib/schoolContact";

type RGB = readonly [number, number, number];

const reportCardNavy: RGB = [16, 36, 79];
const reportCardPurple: RGB = [52, 36, 95];
const reportCardMagenta: RGB = [179, 22, 105];
const accentStops: RGB[] = [[237, 60, 145], [216, 33, 121], [240, 200, 108]];

function drawGradientBand(doc: jsPDF, y: number, height: number, stops: RGB[]) {
  const width = doc.internal.pageSize.getWidth();
  const segmentCount = 72;

  for (let index = 0; index < segmentCount; index += 1) {
    const progress = (index / (segmentCount - 1)) * (stops.length - 1);
    const stopIndex = Math.min(Math.floor(progress), stops.length - 2);
    const blend = progress - stopIndex;
    const start = stops[stopIndex];
    const end = stops[stopIndex + 1];
    const color = start.map((channel, channelIndex) =>
      Math.round(channel + (end[channelIndex] - channel) * blend),
    ) as unknown as RGB;

    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect((width * index) / segmentCount, y, width / segmentCount + 0.08, height, "F");
  }
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

  drawGradientBand(doc, 0, 37, [reportCardNavy, reportCardPurple, reportCardMagenta]);
  doc.setFillColor(255, 255, 255);
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

  drawGradientBand(doc, 37, 1.4, accentStops);
}
