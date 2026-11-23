import type { Exam, ExamReportType } from "@/lib/hooks";

export const formatLocalDateTime = (date: Date) => date.toLocaleString(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const PLAIN_NAMES: Record<ExamReportType, string> = {
  end_of_1st_term: "End of Term 1",
  end_of_2nd_term: "End of Term 2",
  end_of_3rd_term: "End of Term 3",
  monthly_report_card: "End of Month",
  fortnightly_tests: "Fortnightly Test",
};

/** Exam titles are plain: "End of Term 3", "End of Month", "Fortnightly Test". Term and year show beside them. */
export const buildExamName = (reportType: ExamReportType) => PLAIN_NAMES[reportType];

const TERM_REPORT_TYPES: ExamReportType[] = ["end_of_1st_term", "end_of_2nd_term", "end_of_3rd_term"];

/** End-of-term exams always show the standard title; others show the name they were given. */
export const getExamDisplayName = (exam: Pick<Exam, "name" | "report_type">) =>
  TERM_REPORT_TYPES.includes(exam.report_type) ? PLAIN_NAMES[exam.report_type] : exam.name;

/** Name plus when it was sat, without saying the term twice: "End of Term 3 · 2026" or "End of Month · Term 3 2026". */
export const getExamFullLabel = (exam: Pick<Exam, "name" | "report_type" | "term" | "year">) =>
  TERM_REPORT_TYPES.includes(exam.report_type)
    ? `${getExamDisplayName(exam)} · ${exam.year}`
    : `${getExamDisplayName(exam)} · ${exam.term} ${exam.year}`;
