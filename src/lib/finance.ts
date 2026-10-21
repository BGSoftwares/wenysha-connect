export type FinanceCurrency = "USD" | "ZWG";

export const FINANCE_CURRENCIES: { value: FinanceCurrency; label: string }[] = [
  { value: "USD", label: "US Dollar (USD)" },
  { value: "ZWG", label: "Zimbabwe Gold (ZiG)" },
];

export function formatMoney(value: number | string, currency: FinanceCurrency = "USD"): string {
  const amount = Number(value);
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const formatted = new Intl.NumberFormat("en-ZW", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeAmount);
  return `${currency === "USD" ? "US$" : "ZiG"} ${formatted}`;
}

export function formatSchoolDate(value: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-ZW", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Harare",
    ...options,
  }).format(date);
}

export function schoolDateInput(value: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Africa/Harare",
  }).formatToParts(value);
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value || "00";
  return `${part("year")}-${part("month")}-${part("day")}`;
}
