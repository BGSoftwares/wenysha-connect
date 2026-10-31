import type { Exam } from "@/lib/hooks";

export interface SchoolTermCalendar {
  year: number;
  term: number;
  startDate: string;
  endDate: string;
  publicHolidays: string[];
  sourceLabel: string;
}

export interface ReportSchoolDays extends SchoolTermCalendar {
  throughDate: string;
  totalDays: number;
  isOfficialTerm: boolean;
}

export const ZIMBABWE_2026_PUBLIC_HOLIDAYS = [
  { date: "2026-01-01", name: "New Year's Day" },
  { date: "2026-02-21", name: "National Youth Day" },
  { date: "2026-04-03", name: "Good Friday" },
  { date: "2026-04-04", name: "Easter Saturday" },
  { date: "2026-04-05", name: "Easter Sunday" },
  { date: "2026-04-06", name: "Easter Monday" },
  { date: "2026-04-18", name: "Independence Day" },
  { date: "2026-05-01", name: "Workers' Day" },
  { date: "2026-05-25", name: "Africa Day" },
  { date: "2026-08-10", name: "Heroes Day" },
  { date: "2026-08-11", name: "Defence Forces National Day" },
  { date: "2026-12-22", name: "National Unity Day" },
  { date: "2026-12-25", name: "Christmas Day" },
  { date: "2026-12-26", name: "Boxing Day" },
] as const;

const holidayDates = ZIMBABWE_2026_PUBLIC_HOLIDAYS.map((holiday) => holiday.date);

export const ZIMBABWE_2026_TERMS: SchoolTermCalendar[] = [
  { year: 2026, term: 1, startDate: "2026-01-13", endDate: "2026-04-01", publicHolidays: holidayDates.filter((date) => date >= "2026-01-13" && date <= "2026-04-01"), sourceLabel: "Zimbabwe 2026 school calendar" },
  { year: 2026, term: 2, startDate: "2026-05-12", endDate: "2026-08-06", publicHolidays: holidayDates.filter((date) => date >= "2026-05-12" && date <= "2026-08-06"), sourceLabel: "Zimbabwe 2026 school calendar" },
  { year: 2026, term: 3, startDate: "2026-09-08", endDate: "2026-12-03", publicHolidays: holidayDates.filter((date) => date >= "2026-09-08" && date <= "2026-12-03"), sourceLabel: "Zimbabwe 2026 school calendar" },
];

const REPORT_TYPE_TERM: Record<string, number> = {
  end_of_1st_term: 1,
  end_of_2nd_term: 2,
  end_of_3rd_term: 3,
};

export const formatLocalDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getTermNumber = (term: string, reportType?: string) => {
  if (reportType && REPORT_TYPE_TERM[reportType]) return REPORT_TYPE_TERM[reportType];
  const value = term.trim().toLowerCase();
  const namedTerm = value.match(/\b(first|second|third)\b/);
  if (namedTerm) return ({ first: 1, second: 2, third: 3 } as const)[namedTerm[1] as "first" | "second" | "third"];
  const numberedTerm = value.match(/\b([1-3])(?:st|nd|rd)?\b/);
  return numberedTerm ? Number(numberedTerm[1]) : null;
};

export const getZimbabweSchoolTerm = (year: string, term: string, reportType?: string) => {
  const termNumber = getTermNumber(term, reportType);
  if (Number(year) !== 2026 || !termNumber) return null;
  return ZIMBABWE_2026_TERMS.find((period) => period.term === termNumber) ?? null;
};

const getLocalDateFromKey = (dateKey: string) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const isWeekday = (dateKey: string) => {
  const day = getLocalDateFromKey(dateKey).getDay();
  return day !== 0 && day !== 6;
};

export interface SchoolDateStatus {
  isSchoolDay: boolean;
  sessionLabel?: string;
  reason?: string;
}

export const getSchoolDateStatus = (dateKey: string): SchoolDateStatus => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return { isSchoolDay: false, reason: "Choose a valid attendance date." };
  }
  const parsedDate = getLocalDateFromKey(dateKey);
  if (Number.isNaN(parsedDate.getTime()) || formatLocalDateKey(parsedDate) !== dateKey) {
    return { isSchoolDay: false, reason: "Choose a valid attendance date." };
  }
  const day = parsedDate.getDay();
  if (day === 0 || day === 6) return { isSchoolDay: false, reason: "School attendance cannot be marked on weekends." };

  if (dateKey.startsWith("2026-")) {
    const holiday = ZIMBABWE_2026_PUBLIC_HOLIDAYS.find((item) => item.date === dateKey);
    if (holiday) return { isSchoolDay: false, reason: `${holiday.name} is a public holiday.` };
    const session = ZIMBABWE_2026_TERMS.find((term) => dateKey >= term.startDate && dateKey <= term.endDate);
    if (!session) return { isSchoolDay: false, reason: "This date falls outside the published 2026 school sessions." };
    return { isSchoolDay: true, sessionLabel: `Term ${session.term} · ${session.startDate} to ${session.endDate}` };
  }

  return { isSchoolDay: true, sessionLabel: "Weekday; school session dates are not configured for this year." };
};

export const isScheduledSchoolDay = (dateKey: string, period: SchoolTermCalendar) =>
  dateKey >= period.startDate &&
  dateKey <= period.endDate &&
  isWeekday(dateKey) &&
  !period.publicHolidays.includes(dateKey);

const countSchoolDays = (startDate: string, endDate: string, holidays: string[]) => {
  const period: SchoolTermCalendar = {
    year: Number(startDate.slice(0, 4)),
    term: 0,
    startDate,
    endDate,
    publicHolidays: holidays,
    sourceLabel: "Report period",
  };
  let count = 0;
  for (let date = getLocalDateFromKey(startDate); formatLocalDateKey(date) <= endDate; date.setDate(date.getDate() + 1)) {
    if (isScheduledSchoolDay(formatLocalDateKey(date), period)) count += 1;
  }
  return count;
};

export const getReportSchoolDays = (exam: Exam, issuedAt = new Date()): ReportSchoolDays => {
  const officialTerm = getZimbabweSchoolTerm(exam.year, exam.term, exam.report_type);
  const period: SchoolTermCalendar = officialTerm ?? {
    year: Number(exam.year),
    term: getTermNumber(exam.term, exam.report_type) ?? 0,
    startDate: exam.start_date,
    endDate: exam.end_date,
    publicHolidays: [],
    sourceLabel: "Exam dates",
  };
  const today = formatLocalDateKey(issuedAt);
  const isEndOfTermReport = !!REPORT_TYPE_TERM[exam.report_type];
  const throughDate = !isEndOfTermReport && period.year === issuedAt.getFullYear() && today < period.endDate
    ? today
    : period.endDate;
  const boundedEnd = throughDate < period.startDate ? period.startDate : throughDate;

  return {
    ...period,
    throughDate,
    totalDays: throughDate < period.startDate
      ? 0
      : countSchoolDays(period.startDate, boundedEnd, period.publicHolidays),
    isOfficialTerm: !!officialTerm,
  };
};
