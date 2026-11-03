import { useEffect, useState } from "react";
import type { Exam, ExamReportType, SchoolTerm } from "@/lib/hooks";

export interface LocalSchoolPeriod {
  year: string;
  term: string;
  date: string;
}

export interface ReportYearOption {
  year: string;
  isFuture: boolean;
}

export const getLocalSchoolPeriod = (date = new Date()): LocalSchoolPeriod => {
  const month = date.getMonth();
  const term = month < 4 ? 1 : month < 8 ? 2 : 3;
  const localDate = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
  return {
    year: String(date.getFullYear()),
    term: `Term ${term}`,
    date: localDate,
  };
};

export const useLocalSchoolPeriod = () => {
  const [period, setPeriod] = useState(getLocalSchoolPeriod);

  useEffect(() => {
    const refreshPeriod = () => {
      const nextPeriod = getLocalSchoolPeriod();
      setPeriod(current => (
        current.year === nextPeriod.year && current.term === nextPeriod.term && current.date === nextPeriod.date
          ? current
          : nextPeriod
      ));
    };
    const intervalId = window.setInterval(refreshPeriod, 60_000);
    window.addEventListener("focus", refreshPeriod);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshPeriod);
    };
  }, []);

  return period;
};

export const getSchoolTermForDate = (
  terms: Array<Pick<SchoolTerm, "name" | "start_date" | "end_date">>,
  date: string,
  fallbackTerm: string,
) => terms.find(term => term.start_date <= date && date <= term.end_date)?.name ?? fallbackTerm;

export const getReportYearOptions = (
  exams: Array<Pick<Exam, "year">>,
  currentYear: string,
): ReportYearOption[] => {
  const currentYearNumber = Number(currentYear);
  const examYears = exams
    .map(exam => Number(exam.year.trim()))
    .filter(year => Number.isInteger(year) && year > 0);
  const firstYear = Math.min(currentYearNumber - 5, ...examYears);
  const lastYear = currentYearNumber + 5;

  return Array.from({ length: lastYear - firstYear + 1 }, (_, index) => {
    const year = String(lastYear - index);
    return { year, isFuture: Number(year) > currentYearNumber };
  });
};

export const getTermForReportType = (reportType: ExamReportType): string | null => {
  switch (reportType) {
    case "end_of_1st_term":
      return "Term 1";
    case "end_of_2nd_term":
      return "Term 2";
    case "end_of_3rd_term":
      return "Term 3";
    default:
      return null;
  }
};

export const getReportTypeForTerm = (term: string): ExamReportType => {
  const normalizedTerm = term.trim().toLowerCase();
  if (/\b(first|1st|1)\b/.test(normalizedTerm)) return "end_of_1st_term";
  if (/\b(second|2nd|2)\b/.test(normalizedTerm)) return "end_of_2nd_term";
  return "end_of_3rd_term";
};

export const getReportTermOptions = (exams: Exam[], year: string): string[] => {
  const terms = exams
    .filter(exam => exam.year.trim() === year)
    .map(exam => exam.term.trim())
    .filter(Boolean);
  const uniqueTerms = new Map<string, string>();
  ["Term 1", "Term 2", "Term 3", ...terms].forEach(term => {
    const normalized = term.toLowerCase();
    if (!uniqueTerms.has(normalized)) uniqueTerms.set(normalized, term);
  });

  return Array.from(uniqueTerms.values()).sort((first, second) => {
    const termNumber = (value: string) => {
      const match = value.match(/\b(1|2|3|first|second|third|1st|2nd|3rd)\b/i)?.[1]?.toLowerCase();
      return match ? ({ first: 1, "1st": 1, second: 2, "2nd": 2, third: 3, "3rd": 3 }[match] ?? Number(match)) : 4;
    };
    return termNumber(first) - termNumber(second) || first.localeCompare(second);
  });
};
