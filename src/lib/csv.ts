/** Serialize rows as spreadsheet-safe CSV, quoting every cell consistently. */
export const toCsv = (headers: string[], rows: Array<Array<string | number>>): string => {
  const escapeCell = (value: string | number) => {
    const text = String(value);
    const safeText = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
    return `"${safeText.replaceAll('"', '""')}"`;
  };

  return [headers, ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n');
};
