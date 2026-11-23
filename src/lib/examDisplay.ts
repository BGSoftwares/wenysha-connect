import type { Exam, ExamReportType } from "@/lib/hooks";

const END_OF_TERM_NUMBER: Partial<Record<ExamReportType, number>> = {
  end_of_1st_term: 1,
  end_of_2nd_term: 2,
  end_of_3rd_term: 3,
};

export const formatLocalDateTime = (date: Date) => date.toLocaleString(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export const buildExamName = (
  reportType: ExamReportType,
  year: string,
  term: string,
  createdAt = new Date(),
) => {
  const termNumber = END_OF_TERM_NUMBER[reportType];
  if (termNumber) return `End of Term ${termNumber} ${year}`;

  const label = reportType === "monthly_report_card" ? "End of Month" : "Fortnightly Test";
  return `${year} ${label} · ${formatLocalDateTime(createdAt)}`;
};

/** Exam name as shown everywhere: "End of Term 3 2026" for term exams, the exam's own name otherwise. */
export const getExamDisplayName = (exam: Pick<Exam, "name" | "report_type" | "term" | "year">) => {
  const termNumber = END_OF_TERM_NUMBER[exam.report_type];
  return termNumber ? `End of Term ${termNumber} ${exam.year}` : exam.name;
};

/** Joins label parts, skipping any part the earlier text already says (so "End of Term 3 2026" is not followed by "Term 3 2026"). */
export const joinDistinct = (parts: string[]) =>
  parts.filter(Boolean).reduce((text, part) => (text.toLowerCase().includes(part.toLowerCase()) ? text : text ? `${text} · ${part}` : part), "");
