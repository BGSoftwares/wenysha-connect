import { useEffect, useState } from "react";
import { calculateGrade, formatScore } from "@/lib/grading";
import type { ReportAttendanceSummary } from "@/lib/reportAttendance";
import { schoolContact } from "@/lib/schoolContact";
import logo from "/able-god-college-logo.png";

export interface SheetResult {
  subject: string;
  marks: number;
  scored: number;
  absent: boolean;
  comment: string;
}

export type PositionState =
  | { status: "provisional" }
  | { status: "loading" }
  | { status: "ready"; position: number | null | undefined; total: number | null | undefined };

export interface TermAttendance {
  id: number | string;
  term_name: string;
  attendance_percentage: number | string;
  days_present: number;
  days_late: number;
  days_absent: number;
  total_school_days: number;
  is_out_of_date?: boolean;
}

export interface ReportCardSheetProps {
  heading: string;
  /** "Issued 22/11/2026", already formatted. */
  issuedLine: string;
  learnerName: string;
  className: string;
  examination: string;
  isProvisional: boolean;
  results: SheetResult[];
  averagePercentage: number;
  passed: number;
  sat: number;
  classPosition: PositionState;
  levelPosition: PositionState;
  levelName?: string | null;
  rankingFailed: boolean;
  teacherComment: string;
  principalComment: string;
  attendance: ReportAttendanceSummary;
  termAttendance: TermAttendance[];
  termAttendanceYear?: string;
  showYearToDate: boolean;
}

const percentageOf = ({ marks, scored, absent }: SheetResult) => (!absent && marks > 0 ? (scored / marks) * 100 : 0);
const clamp = (value: number) => Math.min(100, Math.max(0, value));

/** Bar colour for each grade, so a column of bars reads as a quick profile of strengths. */
const BAR_BY_GRADE: Record<string, string> = {
  A: "bg-emerald-500",
  B: "bg-blue-500",
  C: "bg-cyan-500",
  D: "bg-amber-500",
  E: "bg-orange-500",
  U: "bg-red-500",
};
const RING_BY_GRADE: Record<string, string> = {
  A: "text-emerald-400",
  B: "text-blue-400",
  C: "text-cyan-400",
  D: "text-amber-400",
  E: "text-orange-400",
  U: "text-red-400",
};

const ordinalSuffix = (n: number) =>
  n % 100 >= 11 && n % 100 <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] || "th";

/** The learner's average as a ring that fills once when the card opens, with the overall grade at its centre. */
const AverageRing = ({ value }: { value: number }) => {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(value));
    return () => cancelAnimationFrame(frame);
  }, [value]);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const grade = calculateGrade(value).grade;
  return (
    <div className="relative mx-auto h-36 w-36 shrink-0 print:h-28 print:w-28" role="img" aria-label={`Average ${value.toFixed(1)} percent, overall grade ${grade}`}>
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={radius} fill="none" strokeWidth="9" className="stroke-white/15" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          stroke="currentColor"
          className={`${RING_BY_GRADE[grade] ?? "text-accent"} transition-[stroke-dashoffset] duration-1000 ease-out motion-reduce:transition-none`}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamp(shown) / 100)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-heading text-3xl font-extrabold leading-none tabular-nums">{value.toFixed(1)}<span className="text-base font-bold">%</span></span>
        <span className="mt-1 text-[11px] font-medium text-white/75">Grade {grade}</span>
      </div>
    </div>
  );
};

const PositionTile = ({ label, state, note }: { label: string; state: PositionState; note: string }) => {
  let body: JSX.Element;
  if (state.status === "provisional") body = <span className="font-heading text-lg font-bold text-foreground/70">Provisional</span>;
  else if (state.status === "loading") body = <span className="font-heading text-lg font-bold text-foreground/60">Calculating…</span>;
  else if (state.position == null || state.total == null) body = <span className="font-heading text-lg font-bold text-foreground/60">Not available</span>;
  else {
    body = (
      <span className="font-heading tabular-nums">
        <span className="text-3xl font-extrabold leading-none text-primary">{state.position}</span>
        <sup className="text-xs font-bold text-primary">{ordinalSuffix(state.position)}</sup>
        <span className="ml-1.5 text-xs font-medium text-muted-foreground">of {state.total}</span>
      </span>
    );
  }
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2.5">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 leading-none">{body}</p>
      <p className="mt-1.5 text-[10px] text-muted-foreground">{state.status === "provisional" ? "Computed when the exam is finalized" : note}</p>
    </div>
  );
};

const ATTENDANCE_SEGMENTS = [
  { key: "present", label: "Present", color: "bg-emerald-500" },
  { key: "late", label: "Late", color: "bg-amber-400" },
  { key: "excused", label: "Excused", color: "bg-sky-400" },
  { key: "absent", label: "Unexcused", color: "bg-rose-500" },
] as const;

const ReportCardSheet = (props: ReportCardSheetProps) => {
  const {
    heading, issuedLine, learnerName, className, examination, isProvisional, results, averagePercentage, passed, sat,
    classPosition, levelPosition, levelName, rankingFailed, teacherComment, principalComment, attendance, termAttendance,
    termAttendanceYear, showYearToDate,
  } = props;
  const averageGrade = calculateGrade(averagePercentage);
  const attendanceTotal = Math.max(attendance.present + attendance.late + attendance.excused + attendance.absent, 0);

  return (
    // Printing scales the sheet down slightly so a full card (with term attendance) stays on one A4 page.
    <div className="print:[zoom:0.74]">
      <header className="relative overflow-hidden bg-primary text-primary-foreground">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "repeating-linear-gradient(135deg, #fff 0 1px, transparent 1px 11px)" }}
        />
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-accent/40 blur-3xl" />
        <div className="relative flex flex-col items-center gap-4 px-6 py-6 sm:flex-row print:flex-row print:py-4">
          <img src={logo} alt="Able God College crest" className="h-[72px] w-[72px] shrink-0 rounded-full bg-white p-2 object-contain ring-4 ring-accent/80" />
          <div className="min-w-0 flex-1 text-center sm:text-left print:text-left">
            <p className="font-heading text-3xl font-extrabold leading-tight tracking-tight">Able God College</p>
            <p className="mt-0.5 font-heading text-sm italic text-primary-foreground/80">B&apos;Ezrat Hashem</p>
          </div>
          <div className="text-center text-[11px] leading-relaxed text-primary-foreground/85 sm:text-right print:text-right">
            <p>{schoolContact.phones.map((phone) => phone.label).join(" / ")}</p>
            <p>{schoolContact.address}</p>
          </div>
        </div>
        <div className="h-1.5 bg-gradient-to-r from-accent via-gold to-accent" />
      </header>

      <div className="px-4 pb-5 pt-5 sm:px-7 print:pb-3 print:pt-3">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h1 className="font-heading text-xl font-extrabold tracking-tight text-primary sm:text-2xl">{heading}</h1>
          <p className="text-xs text-muted-foreground">{issuedLine}</p>
        </div>

        <section aria-label="Learner summary" className="grid gap-3 md:grid-cols-[minmax(0,1.25fr)_auto_minmax(0,1fr)] print:grid-cols-[minmax(0,1.25fr)_auto_minmax(0,1fr)]">
          <div className="flex flex-col justify-center rounded-xl bg-secondary/60 p-4">
            <p className="text-[11px] font-medium text-muted-foreground">Learner</p>
            <p className="break-words font-heading text-2xl font-extrabold leading-tight text-foreground">{learnerName}</p>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
              <dt className="text-muted-foreground">Class</dt>
              <dd className="font-semibold text-foreground">{className}</dd>
              <dt className="text-muted-foreground">Examination</dt>
              <dd className="font-semibold text-foreground">{examination}</dd>
            </dl>
            {isProvisional && (
              <p className="mt-3 w-fit rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900">Provisional results</p>
            )}
          </div>

          <div className="rounded-xl bg-primary p-4 text-primary-foreground md:px-6">
            <AverageRing value={averagePercentage} />
            <p className="mt-2 text-center text-[11px] text-white/75">{averageGrade.meaning}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-1 print:grid-cols-1">
            <PositionTile label="Class position" state={classPosition} note="Based on this examination" />
            <PositionTile
              label={levelName ? `${levelName} level position` : "Overall level position"}
              state={levelPosition}
              note="Across sections at the same level"
            />
            <div className="col-span-2 flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2.5 md:col-span-1 print:col-span-1">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">Subjects passed</p>
                <p className="mt-1 font-heading text-3xl font-extrabold leading-none tabular-nums text-primary">
                  {passed}<span className="text-base font-bold text-muted-foreground"> / {sat}</span>
                </p>
              </div>
              <div className="h-10 w-10 rounded-full" style={{ background: `conic-gradient(hsl(var(--accent)) ${sat ? (passed / sat) * 360 : 0}deg, hsl(var(--muted)) 0)` }} aria-hidden="true">
                <div className="m-1.5 h-7 w-7 rounded-full bg-card" />
              </div>
            </div>
          </div>
        </section>
        {rankingFailed && (
          <p role="alert" className="mt-3 text-xs text-red-700">Positions could not be calculated. Please try again later.</p>
        )}

        <div className="mt-4 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[640px] border-collapse text-xs">
            <caption className="sr-only">Subject results</caption>
            <thead className="bg-primary text-primary-foreground">
              <tr>
                {["Subject", "Out of", "Score", "Percentage", "Grade", "Comment"].map((title, index) => (
                  <th
                    key={title}
                    scope="col"
                    className={`px-3 py-2.5 text-[11px] font-semibold ${index === 0 || index === 5 ? "text-left" : "text-center"} ${index === 3 ? "w-[24%]" : ""}`}
                  >
                    {title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((result, index) => {
                const percentage = percentageOf(result);
                const info = calculateGrade(percentage);
                return (
                  <tr key={`${result.subject}-${index}`} className="border-t border-border/70 odd:bg-card even:bg-secondary/40">
                    <th scope="row" className="px-3 py-2 text-left font-semibold text-foreground print:py-1">{result.subject}</th>
                    <td className="px-3 py-2 print:py-1 text-center tabular-nums text-muted-foreground">{result.marks}</td>
                    <td className="px-3 py-2 print:py-1 text-center font-bold tabular-nums text-foreground">{result.absent ? "ABS" : formatScore(result.scored)}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 min-w-8 flex-1 overflow-hidden rounded-full bg-muted"
                          style={result.absent ? { backgroundImage: "repeating-linear-gradient(135deg, hsl(var(--border)) 0 3px, transparent 3px 6px)" } : undefined}
                        >
                          {!result.absent && (
                            <div className={`h-full rounded-full ${BAR_BY_GRADE[info.grade] ?? "bg-accent"}`} style={{ width: `${clamp(percentage)}%` }} />
                          )}
                        </div>
                        <span className="w-12 shrink-0 text-right tabular-nums text-muted-foreground">{result.absent ? "—" : `${percentage.toFixed(1)}%`}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 print:py-1 text-center">
                      <span className={`inline-flex h-6 min-w-6 items-center justify-center rounded-md px-1.5 text-[11px] font-extrabold ${result.absent ? "bg-muted text-muted-foreground" : `${info.bgColor} ${info.color}`}`}>
                        {result.absent ? "—" : info.grade}
                      </span>
                    </td>
                    <td className="px-3 py-2 print:py-1 text-muted-foreground" title={result.comment || undefined}>
                      {result.comment || (result.absent ? "Did not sit this paper" : info.meaning)}
                    </td>
                  </tr>
                );
              })}
              {results.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">No records found for this term.</td>
                </tr>
              )}
            </tbody>
            {results.length > 0 && (
              <tfoot className="border-t-2 border-primary/30 bg-secondary/70">
                <tr>
                  <th scope="row" className="px-3 py-2.5 text-left font-extrabold text-primary">Average</th>
                  <td className="px-3 py-2.5 text-center text-muted-foreground">—</td>
                  <td className="px-3 py-2.5 text-center font-extrabold tabular-nums text-primary">{averagePercentage.toFixed(2)}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-2 min-w-8 flex-1 overflow-hidden rounded-full bg-card">
                        <div className={`h-full rounded-full ${BAR_BY_GRADE[averageGrade.grade] ?? "bg-accent"}`} style={{ width: `${clamp(averagePercentage)}%` }} />
                      </div>
                      <span className="w-12 shrink-0 text-right font-bold tabular-nums text-primary">{averagePercentage.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`inline-flex h-6 min-w-6 items-center justify-center rounded-md px-1.5 text-[11px] font-extrabold ${averageGrade.bgColor} ${averageGrade.color}`}>{averageGrade.grade}</span>
                  </td>
                  <td className="px-3 py-2.5 font-semibold text-primary">{averageGrade.meaning}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 print:grid-cols-2">
          {[
            { title: "Class teacher's comment", text: teacherComment },
            { title: "Principal's overall comment", text: principalComment || "Awaiting principal review." },
          ].map((note) => (
            <figure key={note.title} className="relative overflow-hidden rounded-xl border border-border bg-card px-4 pb-3 pt-4">
              <span aria-hidden="true" className="pointer-events-none absolute -top-3 left-2 font-heading text-6xl font-extrabold leading-none text-accent/20">“</span>
              <figcaption className="relative text-[11px] font-semibold text-primary">{note.title}</figcaption>
              <blockquote className="relative mt-1.5 text-xs leading-relaxed text-foreground/85">{note.text}</blockquote>
            </figure>
          ))}
        </div>

        <section aria-label="Attendance" className="mt-3 rounded-xl border border-border bg-card px-4 py-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
            <p className="text-[11px] font-semibold text-primary">
              {attendance.calendarLabel} through {attendance.throughDate || "report period"}
            </p>
            <p className="text-[11px] text-muted-foreground">{attendance.totalDays} marked days of {attendance.schoolDays} scheduled school days</p>
          </div>
          <div
            className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-muted"
            role="img"
            aria-label={`${attendance.present} present, ${attendance.late} late, ${attendance.excused} excused, ${attendance.absent} unexcused absent`}
          >
            {attendanceTotal > 0 && ATTENDANCE_SEGMENTS.map((segment) => (
              <div key={segment.key} className={segment.color} style={{ width: `${(attendance[segment.key] / attendanceTotal) * 100}%` }} />
            ))}
          </div>
          <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4 print:grid-cols-4">
            {ATTENDANCE_SEGMENTS.map((segment) => (
              <li key={segment.key} className="flex items-center gap-1.5">
                <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-sm ${segment.color}`} />
                <span className="text-muted-foreground">{segment.label}</span>
                <span className="ml-auto font-bold tabular-nums text-foreground sm:ml-1">{attendance[segment.key]}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[10px] text-muted-foreground">
            {attendance.unrecorded} unmarked · {attendance.sickBay} sick bay · {attendance.suspended} suspended · Unexcused absence dates: {attendance.absentDates.length ? attendance.absentDates.join(", ") : "None recorded"}
          </p>
        </section>

        {termAttendance.length > 0 && (
          <section aria-label="Term attendance comparison" className="mt-3 rounded-xl border border-border bg-card px-4 py-3">
            <p className="text-[11px] font-semibold text-primary">Attendance by term{termAttendanceYear ? ` · ${termAttendanceYear}` : ""}</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-3 print:grid-cols-3">
              {termAttendance
                .slice()
                .sort((first, second) => first.term_name.localeCompare(second.term_name, undefined, { numeric: true }))
                .map((summary) => (
                  <div key={summary.id} className="text-[10px] text-muted-foreground">
                    <div className="flex justify-between gap-2">
                      <span className="font-semibold text-foreground">{summary.term_name}</span>
                      <span className="font-bold tabular-nums text-foreground">{Number(summary.attendance_percentage).toFixed(1)}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${clamp(Number(summary.attendance_percentage))}%` }} />
                    </div>
                    <p className="mt-1">{summary.days_present} present · {summary.days_absent} absent · {summary.total_school_days} school days{summary.is_out_of_date ? " · needs refresh" : ""}</p>
                  </div>
                ))}
            </div>
            {showYearToDate && (
              <p className="mt-2 text-[10px] font-semibold text-foreground">
                Year to date: {termAttendance.reduce((total, summary) => total + summary.days_present + summary.days_late, 0)} present/late days from {termAttendance.reduce((total, summary) => total + summary.total_school_days, 0)} scheduled school days.
              </p>
            )}
          </section>
        )}

        <div className="mt-8 grid grid-cols-2 gap-10 px-2 print:mt-5">
          {["Class teacher", "Principal"].map((role) => (
            <div key={role} className="border-t-2 border-primary/40 pt-1 text-[11px] font-medium text-muted-foreground">{role}</div>
          ))}
        </div>

        <footer className="mt-4 print:mt-2 flex flex-wrap items-center justify-between gap-1 border-t border-border pt-2 text-[10px] text-muted-foreground">
          <p>This report is electronically generated.</p>
          <p><span className="font-semibold text-foreground">Able God College</span> · {schoolContact.address}</p>
        </footer>
      </div>
    </div>
  );
};

export default ReportCardSheet;
