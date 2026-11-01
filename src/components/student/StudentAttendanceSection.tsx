import { CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAttendanceTermSummaries, type AttendanceRecord } from "@/lib/hooks";

const statusClass: Record<AttendanceRecord["status"], string> = {
  present: "bg-green-100 text-green-800",
  absent: "bg-red-100 text-red-800",
  late: "bg-amber-100 text-amber-800",
  excused: "bg-blue-100 text-blue-800",
  sick_bay: "bg-purple-100 text-purple-800",
  suspended: "bg-secondary text-muted-foreground",
};

const StudentAttendanceSection = ({ studentId, records }: { studentId: number; records: AttendanceRecord[] }) => {
  const { data: summaries = [], isLoading, error } = useAttendanceTermSummaries({ student: studentId });
  const sortedRecords = records.slice().sort((first, second) => second.date.localeCompare(first.date));

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5" />Attendance by term</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {summaries.map(summary => (
            <article key={summary.id} className="rounded-xl border border-border p-4">
              <div className="flex justify-between gap-2 text-sm font-semibold">
                <span>{summary.academic_year} · {summary.term_name}</span>
                <span>{Number(summary.attendance_percentage).toFixed(1)}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Number(summary.attendance_percentage))}%` }} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {summary.days_present} present · {summary.days_absent} absent · {summary.days_excused} excused · {summary.days_late} late
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{summary.total_school_days} scheduled school days</p>
              {summary.is_out_of_date && <p className="mt-1 text-xs font-medium text-amber-700">Summary needs recalculation by school staff.</p>}
            </article>
          ))}
          {!isLoading && summaries.length === 0 && <p className="text-sm text-muted-foreground">Term summaries will appear once the register has been marked.</p>}
          {error && <p role="alert" className="text-sm text-destructive">Attendance summaries could not be loaded.</p>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Attendance calendar and history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2 text-xs">
            {Object.entries(statusClass).map(([status, style]) => <Badge key={status} className={style}>{status.replaceAll("_", " ")}</Badge>)}
          </div>
          <div className="max-h-[34rem] space-y-2 overflow-auto">
            {sortedRecords.map(record => (
              <div key={record.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
                <div>
                  <p className="font-medium">{new Date(`${record.date}T12:00:00`).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "short", day: "numeric" })}</p>
                  <p className="text-xs text-muted-foreground">{record.session} session{record.excuse_reason ? ` · ${record.excuse_reason.replaceAll("_", " ")}` : ""}{record.excuse_note ? ` · ${record.excuse_note}` : ""}</p>
                </div>
                <Badge className={statusClass[record.status]}>{record.status.replaceAll("_", " ")}</Badge>
              </div>
            ))}
            {sortedRecords.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Your attendance history is not available yet.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentAttendanceSection;
