import { Check, Clock, User, X, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export type AttendanceSession = "morning" | "afternoon" | "evening";
export type MarkableStatus = "present" | "absent" | "late";

interface AttendanceDateStatus {
  isSchoolDay: boolean;
  reason?: string | null;
  sessionLabel?: string | null;
}

export interface AttendanceRegisterPanelProps {
  classes: { id: number; name: string }[];
  selectedClassId: number | null;
  onClassChange: (classId: number) => void;
  date: string;
  onDateChange: (date: string) => void;
  session: AttendanceSession;
  onSessionChange: (session: AttendanceSession) => void;
  dateStatus: AttendanceDateStatus;
  /** Learners in the selected class, each with the status shown in the register (draft first, then saved). */
  rows: { student: { id: number; name: string }; status: string }[];
  offlineDraftCount: number;
  anyMarked: boolean;
  bulkSaving: boolean;
  statusSaving: boolean;
  onMarkStatus: (studentId: number, status: MarkableStatus) => void | Promise<void>;
  onMarkAllPresent: () => void | Promise<void>;
  onShareToParents: () => void | Promise<void>;
  onExportPdf: () => void;
}

const selectClass = "px-4 py-2 rounded-lg border border-border bg-background text-foreground";

// Tailwind needs the full class names written out, so each option lists its own.
const STATUS_BUTTONS: { status: MarkableStatus; Icon: LucideIcon; active: string; hover: string }[] = [
  { status: "present", Icon: Check, active: "bg-green-500 text-white", hover: "hover:bg-green-100" },
  { status: "absent", Icon: X, active: "bg-destructive text-white", hover: "hover:bg-red-100" },
  { status: "late", Icon: Clock, active: "bg-amber-500 text-white", hover: "hover:bg-amber-100" },
];

const AttendanceRegisterPanel = ({
  classes, selectedClassId, onClassChange, date, onDateChange, session, onSessionChange, dateStatus, rows,
  offlineDraftCount, anyMarked, bulkSaving, statusSaving, onMarkStatus, onMarkAllPresent, onShareToParents, onExportPdf,
}: AttendanceRegisterPanelProps) => {
  const count = (status: string) => rows.filter((row) => row.status === status).length;
  const disabledForDate = !dateStatus.isSchoolDay;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="font-heading text-xl font-bold text-foreground">Attendance</h2>
        <div className="flex gap-3">
          <select value={selectedClassId || ""} onChange={(e) => onClassChange(Number(e.target.value))} className={selectClass}>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input type="date" value={date} onChange={(e) => onDateChange(e.target.value)} aria-label="Attendance date" className={selectClass} />
          <select value={session} onChange={(event) => onSessionChange(event.target.value as AttendanceSession)} aria-label="Attendance session" className={selectClass}>
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
            <option value="evening">Evening</option>
          </select>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-secondary/30 flex items-center justify-between">
          <div>
            <h3 className="font-medium text-foreground">{classes.find((c) => c.id === selectedClassId)?.name || "Select Class"} - Attendance</h3>
            <p className="text-sm text-muted-foreground">{new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">
              {offlineDraftCount ? `${offlineDraftCount} offline draft${offlineDraftCount === 1 ? "" : "s"} saved on this device.` : "Register changes save immediately."}
            </p>
            <Button size="sm" onClick={() => void onMarkAllPresent()} disabled={disabledForDate || !rows.length || bulkSaving}>
              {bulkSaving ? "Saving…" : "Mark all present"}
            </Button>
          </div>
          <div className="flex gap-4 text-sm">
            <span className="text-green-600">Present: {count("present")}</span>
            <span className="text-red-500">Absent: {count("absent")}</span>
            <span className="text-amber-600">Late: {count("late")}</span>
            <span className="text-muted-foreground">Unmarked: {count("unmarked")}</span>
          </div>
        </div>
        {disabledForDate && (
          <p role="status" className="border-b border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            {dateStatus.reason} Attendance controls are disabled for this date.
          </p>
        )}
        {!disabledForDate && dateStatus.sessionLabel && (
          <p className="border-b border-border px-4 py-2 text-xs text-muted-foreground">{dateStatus.sessionLabel}</p>
        )}
        <table className="w-full">
          <thead className="bg-secondary/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Student</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-foreground">Status</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-foreground">Overall %</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ student, status }) => (
              <tr key={student.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm text-foreground">{student.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center gap-2">
                    <span className="min-w-20 self-center text-center text-xs text-muted-foreground">
                      {status === "unmarked" ? "Not marked" : status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                    {STATUS_BUTTONS.map(({ status: option, Icon, active, hover }) => (
                      <button
                        key={option}
                        onClick={() => void onMarkStatus(student.id, option)}
                        disabled={disabledForDate || statusSaving}
                        aria-label={`Mark ${student.name} ${option}`}
                        className={`p-1.5 rounded-lg transition-colors ${status === option ? active : `bg-secondary text-muted-foreground ${hover}`}`}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-sm font-medium text-muted-foreground">-</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-4 border-t border-border flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={() => void onShareToParents()} disabled={disabledForDate || !anyMarked}>Share PDF to WhatsApp</Button>
          <Button variant="gold" onClick={onExportPdf} disabled={disabledForDate || !anyMarked}>Download Attendance PDF</Button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceRegisterPanel;
