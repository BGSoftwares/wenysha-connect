import type { AttendanceRecord, Exam } from "@/lib/hooks";
import { formatLocalDateKey, getReportSchoolDays } from "@/lib/zimbabweSchoolCalendar";

export interface ReportAttendanceSummary {
  totalDays: number;
  schoolDays: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  sickBay: number;
  suspended: number;
  unrecorded: number;
  absentDates: string[];
  throughDate: string;
  calendarLabel: string;
  isOutOfDate: boolean;
}

export const getReportAttendance = (
  exam: Exam,
  studentId: number,
  records: AttendanceRecord[],
  issuedAt = new Date(),
): ReportAttendanceSummary => {
  const parsedPublicationDate = exam.results_published_at
    ? new Date(exam.results_published_at)
    : null;
  const throughDate = parsedPublicationDate && !Number.isNaN(parsedPublicationDate.getTime())
    ? formatLocalDateKey(parsedPublicationDate)
    : exam.end_date;
  const period = getReportSchoolDays(exam, issuedAt, throughDate);
  const attendance = records.filter(record =>
    record.student === studentId &&
    record.date >= period.startDate &&
    record.date <= period.throughDate,
  );
  const absentDates = attendance
    .filter(record => record.status === "absent")
    .map(record => record.date)
    .sort();
  const totalDays = attendance.length;

  return {
    totalDays,
    schoolDays: period.totalDays,
    present: attendance.filter(record => record.status === "present").length,
    absent: absentDates.length,
    late: attendance.filter(record => record.status === "late").length,
    excused: attendance.filter(record => record.status === "excused").length,
    sickBay: attendance.filter(record => record.status === "sick_bay").length,
    suspended: attendance.filter(record => record.status === "suspended").length,
    unrecorded: Math.max(0, period.totalDays - totalDays),
    absentDates,
    throughDate: period.throughDate,
    calendarLabel: period.isOfficialTerm ? "Term attendance" : "Report-period attendance",
    isOutOfDate: false,
  };
};

export const mapAttendanceSnapshot = (
  summary: {
    total_school_days: number;
    marked_days: number;
    days_present: number;
    days_absent: number;
    days_late: number;
    days_excused: number;
    days_sick_bay: number;
    days_suspended: number;
    absent_dates: string[];
    through_date: string;
    is_out_of_date: boolean;
  },
  snapshotIsOutOfDate = summary.is_out_of_date,
): ReportAttendanceSummary => ({
  totalDays: summary.marked_days,
  schoolDays: summary.total_school_days,
  present: summary.days_present,
  absent: summary.days_absent,
  late: summary.days_late,
  excused: summary.days_excused,
  sickBay: summary.days_sick_bay,
  suspended: summary.days_suspended,
  unrecorded: Math.max(0, summary.total_school_days - summary.marked_days),
  absentDates: summary.absent_dates,
  throughDate: summary.through_date,
  calendarLabel: "Term attendance",
  isOutOfDate: snapshotIsOutOfDate,
});
