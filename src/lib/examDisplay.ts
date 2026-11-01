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
  if (termNumber) return `${year} End of Term ${termNumber} exam`;

  const label = reportType === "monthly_report_card" ? "End of Month" : "Fortnightly Test";
  return `${year} ${label} · ${formatLocalDateTime(createdAt)}`;
};

export const getExamDisplayName = (exam: Pick<Exam, "name" | "report_type" | "term" | "year">) => {
  const termNumber = END_OF_TERM_NUMBER[exam.report_type];
  return termNumber
    ? `${exam.year} End of Term ${termNumber} exam`
    : exam.name;
};
