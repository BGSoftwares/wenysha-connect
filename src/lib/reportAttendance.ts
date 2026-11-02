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
  const statusByDate = new Map<string, Set<AttendanceRecord["status"]>>();
  attendance.forEach(record => {
    const statuses = statusByDate.get(record.date) ?? new Set<AttendanceRecord["status"]>();
    statuses.add(record.status);
    statusByDate.set(record.date, statuses);
  });
  const dailyStatuses = Array.from(statusByDate.values(), statuses => (
    statuses.has("present") ? "present"
      : statuses.has("late") ? "late"
        : statuses.has("excused") ? "excused"
          : statuses.has("sick_bay") ? "sick_bay"
            : statuses.has("suspended") ? "suspended"
              : "absent"
  ));
  const absentDates = Array.from(statusByDate)
    .filter(([, statuses]) => !statuses.has("present") && !statuses.has("late") &&
      !statuses.has("excused") && !statuses.has("sick_bay") && !statuses.has("suspended"))
    .map(([date]) => date)
    .sort();
  const totalDays = dailyStatuses.length;

  return {
    totalDays,
    schoolDays: period.totalDays,
    present: dailyStatuses.filter(status => status === "present").length,
    absent: absentDates.length,
    late: dailyStatuses.filter(status => status === "late").length,
    excused: dailyStatuses.filter(status => status === "excused").length,
    sickBay: dailyStatuses.filter(status => status === "sick_bay").length,
    suspended: dailyStatuses.filter(status => status === "suspended").length,
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
