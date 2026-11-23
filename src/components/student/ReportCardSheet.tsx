import type { ReactNode } from "react";
import { calculateGrade } from "@/lib/grading";
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
  /** Date the report was issued, already formatted. */
  issuedDate: string;
  /** Optional period such as "October 2026" (monthly reports). */
  periodLabel?: string;
  learnerName: string;
  className: string;
  examination: string;
  isProvisional: boolean;
  results: SheetResult[];
  averagePercentage: number;
  passed: number;
  sat: number;
  /** "Position in 3B1 & 3B2": one overall position across every class at the level, or the class alone. */
  positionLabel: string;
  position: PositionState;
  rankingFailed: boolean;
  teacherComment: string;
  principalComment: string;
  /** When the class teacher / principal commented (ISO date-time), printed beside their signature. */
  teacherCommentDate: string | null;
  principalCommentDate: string | null;
  teacherName?: string | null;
  principalName?: string | null;
  teacherSignatureUrl: string | null;
  principalSignatureUrl: string | null;
  /** Day the next term opens (ISO date), entered by the class teacher. */
  nextTermBegins: string | null;
  attendance: ReportAttendanceSummary;
  termAttendance: TermAttendance[];
  termAttendanceYear?: string;
  showYearToDate: boolean;
}

const percentageOf = ({ marks, scored, absent }: SheetResult) => (!absent && marks > 0 ? (scored / marks) * 100 : 0);
const clamp = (value: number) => Math.min(100, Math.max(0, value));

const positionText = (state: PositionState) => {
  if (state.status === "provisional") return "Provisional (set when the examination is finalized)";
  if (state.status === "loading") return "Calculating…";
  if (state.position == null || state.total == null) return "Not available";
  return `${state.position} out of ${state.total}`;
};

const longDate = (value: string | null) => {
  if (!value) return "";
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
};

/** A comment, then the commenter's signature image (when uploaded), their name and the day they commented. */
const SignedComment = ({
  title, text, name, role, signatureUrl, date,
}: { title: string; text: string; name?: string | null; role: string; signatureUrl: string | null; date: string | null }) => (
  <div className="break-inside-avoid">
    <p className="font-heading text-sm font-bold text-primary">{title}</p>
    <p className="mt-1 min-h-10 border-b border-primary/25 pb-2 text-sm leading-relaxed text-foreground/90">{text}</p>
    <div className="mt-2 grid grid-cols-[1fr_auto] items-end gap-6">
      <div>
        <div className="flex h-14 items-end print:h-11">
          {signatureUrl && <img src={signatureUrl} alt={`${role} signature`} className="max-h-full max-w-[11rem] object-contain" />}
        </div>
        <p className="border-t border-foreground/50 pt-1 text-xs text-muted-foreground">{name ? `${role} · ${name}` : role}</p>
      </div>
      <div className="min-w-32">
        <p className="flex h-14 items-end pb-1 text-sm font-medium text-foreground print:h-11">{longDate(date)}</p>
        <p className="border-t border-foreground/50 pt-1 text-xs text-muted-foreground">Date commented</p>
      </div>
    </div>
  </div>
);

const ATTENDANCE_SEGMENTS = [
  { key: "present", label: "Present", color: "bg-emerald-500" },
  { key: "late", label: "Late", color: "bg-amber-400" },
  { key: "excused", label: "Excused", color: "bg-sky-400" },
  { key: "absent", label: "Unexcused", color: "bg-rose-500" },
] as const;

/** One labelled row of the learner details list, separated by a hairline like a printed form. */
const Detail = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="grid grid-cols-[10.5rem_1fr] gap-x-3 border-b border-border py-2 text-sm print:py-1">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="min-w-0 break-words font-medium text-foreground">{children}</dd>
  </div>
);

const Corner = ({ className }: { className: string }) => (
  <span aria-hidden="true" className={`pointer-events-none absolute h-5 w-5 border-gold ${className}`} />
);

const ReportCardSheet = (props: ReportCardSheetProps) => {
  const {
    heading, issuedDate, periodLabel, learnerName, className, examination, isProvisional, results, averagePercentage, passed, sat,
    positionLabel, position, rankingFailed, teacherComment, principalComment, teacherCommentDate, principalCommentDate,
    teacherName, principalName, teacherSignatureUrl, principalSignatureUrl, nextTermBegins, attendance, termAttendance,
    termAttendanceYear, showYearToDate,
  } = props;
  const averageGrade = calculateGrade(averagePercentage);
  const attendanceTotal = Math.max(attendance.present + attendance.late + attendance.excused + attendance.absent, 0);
  const nextTerm = longDate(nextTermBegins);

  return (
    // The outer rule, a hairline gold rule inside it and four gold corners frame the page like a certificate.
    // Printing scales the sheet down slightly so a full card (with term attendance) stays on one A4 page.
    <div className="bg-primary p-1.5 print:[zoom:0.78] print:p-1">
      <div className="relative border border-gold bg-card px-5 pb-6 pt-6 sm:px-9 print:px-4 print:pb-2 print:pt-2">
        <Corner className="left-1 top-1 border-l-2 border-t-2" />
        <Corner className="right-1 top-1 border-r-2 border-t-2" />
        <Corner className="bottom-1 left-1 border-b-2 border-l-2" />
        <Corner className="bottom-1 right-1 border-b-2 border-r-2" />
        <img
          src={logo}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.045]"
        />

        <div className="relative">
          <h1 className="text-center font-heading text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">Student Online Report Card</h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            {heading}{periodLabel ? ` · ${periodLabel}` : ""}
          </p>
          <div className="mt-3 flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-primary/40" />
            <span className="h-2 w-2 rotate-45 bg-gold" />
            <span className="h-px flex-1 bg-primary/40" />
          </div>

          <div className="mt-5 grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] print:mt-3 print:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] print:gap-4">
            <dl className="border-t border-border">
              <div className="border-b border-border py-2 print:py-1">
                <dt className="sr-only">Learner</dt>
                <dd className="font-heading text-xl font-extrabold text-foreground">{learnerName}</dd>
              </div>
              <Detail label="Class">{className}</Detail>
              <Detail label="Examination">{examination}</Detail>
              <Detail label={positionLabel}>{positionText(position)}</Detail>
              <Detail label="Passed">{passed} out of {sat}</Detail>
              <Detail label="Average">
                {averagePercentage.toFixed(1)}% · Grade {averageGrade.grade} ({averageGrade.meaning})
              </Detail>
              <Detail label="Next term begins">{nextTerm || <span className="font-normal text-muted-foreground">To be announced</span>}</Detail>
              {isProvisional && (
                <div className="py-2">
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">Provisional results</span>
                </div>
              )}
            </dl>

            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-end print:flex-row print:items-start print:justify-end">
              <img src={logo} alt="Able God College crest" className="h-28 w-28 shrink-0 object-contain print:h-24 print:w-24" />
              <address className="text-center text-sm not-italic leading-relaxed text-foreground sm:text-right print:text-right">
                <p className="font-heading text-base font-extrabold text-primary">{schoolContact.name}</p>
                <p className="font-heading text-xs italic text-muted-foreground">B&apos;Ezrat Hashem</p>
                {schoolContact.phones.map((phone) => (
                  <p key={phone.label}>Phone: {phone.label}</p>
                ))}
                <p>{schoolContact.address}</p>
              </address>
            </div>
          </div>
          {rankingFailed && <p role="alert" className="mt-3 text-xs text-red-700">Positions could not be calculated. Please try again later.</p>}

          <div className="mt-5 overflow-x-auto print:mt-3">
            <table className="w-full min-w-[620px] border-collapse border border-primary/40 text-sm print:text-xs">
              <caption className="sr-only">Subject results</caption>
              <thead>
                <tr className="border-b-2 border-primary bg-secondary/70">
                  {["Subject", "Marks", "Scored", "Perc (%)", "Grade", "Comment"].map((title) => (
                    <th key={title} scope="col" className="border border-border px-3 py-2.5 text-left font-bold text-primary print:py-1.5">{title}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => {
                  const percentage = percentageOf(result);
                  const info = calculateGrade(percentage);
                  return (
                    <tr key={`${result.subject}-${index}`} className="even:bg-secondary/25">
                      <th scope="row" className="border border-border px-3 py-2.5 text-left font-normal text-foreground print:py-1.5">{result.subject}</th>
                      <td className="border border-border px-3 py-2.5 tabular-nums print:py-1.5">{result.marks}</td>
                      <td className="border border-border px-3 py-2.5 tabular-nums print:py-1.5">{result.absent ? "ABS" : result.scored.toFixed(2)}</td>
                      <td className="border border-border px-3 py-2.5 tabular-nums print:py-1.5">{result.absent ? "—" : `${percentage.toFixed(2)}%`}</td>
                      <td className="border border-border px-3 py-2.5 print:py-1.5">
                        {result.absent ? "—" : <span className={`inline-flex min-w-6 justify-center rounded px-1.5 text-xs font-bold ${info.bgColor} ${info.color}`}>{info.grade}</span>}
                      </td>
                      <td className="border border-border px-3 py-2.5 print:py-1.5">{result.comment || (result.absent ? "Did not sit this paper" : info.meaning)}</td>
                    </tr>
                  );
                })}
                {results.length === 0 && (
                  <tr><td colSpan={6} className="border border-border px-3 py-8 text-center text-muted-foreground">No records found for this term.</td></tr>
                )}
              </tbody>
              {results.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-primary bg-secondary/70 font-bold">
                    <th scope="row" className="border border-border px-3 py-2.5 text-left text-primary print:py-1.5">Average</th>
                    <td className="border border-border px-3 py-2.5">—</td>
                    <td className="border border-border px-3 py-2.5 tabular-nums print:py-1.5">{averagePercentage.toFixed(2)}</td>
                    <td className="border border-border px-3 py-2.5 tabular-nums print:py-1.5">{averagePercentage.toFixed(2)}%</td>
                    <td className="border border-border px-3 py-2.5 print:py-1.5">
                      <span className={`inline-flex min-w-6 justify-center rounded px-1.5 text-xs font-bold ${averageGrade.bgColor} ${averageGrade.color}`}>{averageGrade.grade}</span>
                    </td>
                    <td className="border border-border px-3 py-2.5 print:py-1.5">{averageGrade.meaning}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] print:mt-3 print:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] print:gap-4">
            <div className="space-y-5 print:space-y-2">
              <SignedComment
                title="Class teacher's comment"
                text={teacherComment}
                role="Class teacher"
                name={teacherName}
                signatureUrl={teacherSignatureUrl}
                date={teacherCommentDate}
              />
              <SignedComment
                title="Head's comment"
                text={principalComment || "Awaiting principal review."}
                role="Principal"
                name={principalName}
                signatureUrl={principalSignatureUrl}
                date={principalCommentDate}
              />
            </div>

            <section aria-label="Attendance" className="self-start rounded-lg border border-primary/30 bg-card/80 px-4 py-3">
              <p className="font-heading text-sm font-bold text-primary">{attendance.calendarLabel}</p>
              <p className="text-xs text-muted-foreground">
                Through {attendance.throughDate || "report period"} · {attendance.totalDays} marked of {attendance.schoolDays} school days
              </p>
              <div
                className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-muted"
                role="img"
                aria-label={`${attendance.present} present, ${attendance.late} late, ${attendance.excused} excused, ${attendance.absent} unexcused absent`}
              >
                {attendanceTotal > 0 && ATTENDANCE_SEGMENTS.map((segment) => (
                  <div key={segment.key} className={segment.color} style={{ width: `${(attendance[segment.key] / attendanceTotal) * 100}%` }} />
                ))}
              </div>
              <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                {ATTENDANCE_SEGMENTS.map((segment) => (
                  <li key={segment.key} className="flex items-center gap-1.5">
                    <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-sm ${segment.color}`} />
                    <span className="text-muted-foreground">{segment.label}</span>
                    <span className="ml-auto font-bold tabular-nums text-foreground">{attendance[segment.key]}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-muted-foreground">
                {attendance.unrecorded} unmarked · {attendance.sickBay} sick bay · {attendance.suspended} suspended
              </p>
              <p className="text-[11px] text-muted-foreground">
                Unexcused absence dates: {attendance.absentDates.length ? attendance.absentDates.join(", ") : "None recorded"}
              </p>

              {termAttendance.length > 0 && (
                <div className="mt-3 border-t border-border pt-2">
                  <p className="text-xs font-semibold text-foreground">Attendance by term{termAttendanceYear ? ` · ${termAttendanceYear}` : ""}</p>
                  <ul className="mt-1.5 space-y-1.5">
                    {termAttendance
                      .slice()
                      .sort((first, second) => first.term_name.localeCompare(second.term_name, undefined, { numeric: true }))
                      .map((summary) => (
                        <li key={summary.id} className="text-[11px] text-muted-foreground">
                          <div className="flex justify-between gap-2">
                            <span className="font-semibold text-foreground">{summary.term_name}</span>
                            <span className="font-bold tabular-nums text-foreground">{Number(summary.attendance_percentage).toFixed(1)}%</span>
                          </div>
                          <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${clamp(Number(summary.attendance_percentage))}%` }} />
                          </div>
                          <p className="mt-0.5">{summary.days_present} present · {summary.days_absent} absent · {summary.total_school_days} school days{summary.is_out_of_date ? " · needs refresh" : ""}</p>
                        </li>
                      ))}
                  </ul>
                  {showYearToDate && (
                    <p className="mt-2 text-[11px] font-semibold text-foreground">
                      Year to date: {termAttendance.reduce((total, summary) => total + summary.days_present + summary.days_late, 0)} present/late days from {termAttendance.reduce((total, summary) => total + summary.total_school_days, 0)} scheduled school days.
                    </p>
                  )}
                </div>
              )}
            </section>
          </div>

          <p className="mt-6 border-t border-primary/30 pt-3 text-center text-sm text-muted-foreground print:mt-3 print:pt-2 print:text-xs">
            This report is electronically generated · Issued {issuedDate}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReportCardSheet;
