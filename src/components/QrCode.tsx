import { useMemo } from "react";
import { qrMatrix } from "@/lib/qrCode";

interface QrCodeProps {
  value: string;
  className?: string;
  label?: string;
}

/** A scannable QR code drawn as one SVG path, so it stays sharp when printed. */
export const QrCode = ({ value, className, label = "QR code" }: QrCodeProps) => {
  const matrix = useMemo(() => qrMatrix(value), [value]);
  if (!matrix) return null;
  const quietZone = 2;
  const size = matrix.length + quietZone * 2;
  const path = matrix
    .flatMap((row, r) => row.map((dark, c) => (dark ? `M${c + quietZone} ${r + quietZone}h1v1h-1z` : "")))
    .join("");
  return (
    <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label} className={className} shapeRendering="crispEdges">
      <rect width={size} height={size} fill="#fff" />
      <path d={path} fill="#0b1b3a" />
    </svg>
  );
};
