import { useMemo } from "react";
import { StatsCharts, EventsCalendar, type CalendarEvent } from "@/components/dashboard/DashboardExtras";
import { useDashboardSummary } from "@/lib/hooks";

/** Admin dashboard charts and events, fed by /auth/dashboard/summary/ (real records only). */
const AdminDashboardCharts = () => {
  const { data, isLoading, error } = useDashboardSummary();

  const attendance = useMemo(() => (data?.attendance_trend ?? []).map((p) => ({ m: p.month, v: p.rate })), [data]);
  const performance = useMemo(() => (data?.marks_by_subject ?? []).map((p) => ({ s: p.subject, v: p.average })), [data]);
  const events = useMemo<CalendarEvent[]>(
    () => (data?.events ?? []).map((e) => ({ title: e.title, date: new Date(`${e.date}T00:00:00`) })),
    [data],
  );

  return (
    <>
      {error && (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Charts and events could not be loaded. Refresh the page to try again.
        </p>
      )}
      <StatsCharts attendanceData={attendance} performanceData={performance} loading={isLoading} />
      <EventsCalendar events={events} loading={isLoading} />
    </>
  );
};

export default AdminDashboardCharts;
