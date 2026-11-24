import { useEffect, useState, type ReactNode } from "react";
import { calculateGrade } from "@/lib/grading";
import type { ReportAttendanceSummary } from "@/lib/reportAttendance";
import { schoolContact } from "@/lib/schoolContact";
import logo from "/able-god-college-logo.png";
import { QrCode } from "@/components/QrCode";

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
  /** Period shown under the title, e.g. "Term 3 2026" or "October 2026". */
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
  /** Link to this report in the student's portal account; printed as a QR code. */
  qrUrl?: string | null;
  /** Day the next term opens (ISO date), entered by the class teacher. */
  nextTermBegins: string | null;
  attendance: ReportAttendanceSummary;
  termAttendance: TermAttendance[];
  termAttendanceYear?: string;
  showYearToDate: boolean;
}

const percentageOf = ({ marks, scored, absent }: SheetResult) => (!absent && marks > 0 ? (scored / marks) * 100 : 0);
const clamp = (value: number) => Math.min(100, Math.max(0, value));

const longDate = (value: string | null) => {
  if (!value) return "";
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
};

/** A comment, then the commenter's signature image (when uploaded), their name and the day they commented. */
const SignedComment = ({
  title, text, name, role, signatureUrl, date,
}: { title: string; text: string; name?: string | null; role: string; signatureUrl: string | null; date: string | null }) => (
  <div className="break-inside-avoid border-l-4 border-accent bg-secondary/40 px-4 py-3 print:py-2">
    <p className="font-heading text-base font-bold text-primary">{title}</p>
    <p className="mt-1 min-h-10 pb-2 text-sm leading-relaxed text-foreground/90">{text}</p>
    <div className="grid grid-cols-[minmax(0,1fr)] items-end gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-6 print:grid-cols-[minmax(0,1fr)_auto] print:gap-6">
      <div>
        <div className="flex h-14 items-end print:h-11">
          {signatureUrl && <img src={signatureUrl} alt={`${role} signature`} className="max-h-full max-w-[11rem] object-contain" />}
        </div>
        <p className="border-t border-foreground/50 pt-1 text-xs text-muted-foreground">{name ? `${role} · ${name}` : role}</p>
      </div>
      <div className="min-w-32">
        <p className="flex h-14 items-end pb-1 text-sm font-semibold text-foreground print:h-11">{longDate(date)}</p>
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

const CHIP_BY_GRADE: Record<string, string> = {
  A: "bg-emerald-600", B: "bg-blue-600", C: "bg-cyan-700", D: "bg-amber-500", E: "bg-orange-600", U: "bg-red-600",
};
const GradeChip = ({ grade }: { grade: string }) => (
  <span className={`inline-flex min-w-7 justify-center rounded px-1.5 py-0.5 text-xs font-bold text-white ${CHIP_BY_GRADE[grade] ?? "bg-primary"}`}>{grade}</span>
);

const ordinalSuffix = (n: number) =>
  n % 100 >= 11 && n % 100 <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] || "th";

const RING_BY_GRADE: Record<string, string> = {
  A: "text-emerald-400", B: "text-sky-400", C: "text-cyan-300", D: "text-amber-300", E: "text-orange-400", U: "text-red-400",
};

/** The average as a ring that fills once when the card opens, with the overall grade at its centre. */
const AverageRing = ({ value, grade }: { value: number; grade: string }) => {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(value));
    return () => cancelAnimationFrame(frame);
  }, [value]);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="relative mx-auto h-36 w-36 shrink-0 print:h-28 print:w-28" role="img" aria-label={`Average ${value.toFixed(1)} percent, overall grade ${grade}`}>
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={radius} fill="none" strokeWidth="9" className="stroke-white/15" />
        <circle
          cx="60" cy="60" r={radius} fill="none" strokeWidth="9" strokeLinecap="round" stroke="currentColor"
          className={`${RING_BY_GRADE[grade] ?? "text-accent"} transition-[stroke-dashoffset] duration-1000 ease-out motion-reduce:transition-none`}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamp(shown) / 100)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-heading text-3xl font-extrabold leading-none tabular-nums">{value.toFixed(1)}<span className="text-base font-bold">%</span></span>
        <span className="mt-1 text-xs font-semibold text-white/80">Grade {grade}</span>
      </div>
    </div>
  );
};

const PositionStat = ({ label, state }: { label: string; state: PositionState }) => {
  let value: ReactNode;
  if (state.status === "provisional") value = <span className="font-heading text-lg font-bold">Provisional</span>;
  else if (state.status === "loading") value = <span className="font-heading text-lg font-bold">Calculating…</span>;
  else if (state.position == null || state.total == null) value = <span className="font-heading text-lg font-bold">Not available</span>;
  else {
    value = (
      <span className="font-heading tabular-nums">
        <span className="text-4xl font-extrabold leading-none">{state.position}</span>
        <sup className="text-sm font-bold">{ordinalSuffix(state.position)}</sup>
        <span className="ml-2 text-sm font-medium text-white/75">out of {state.total}</span>
      </span>
    );
  }
  return (
    <div className="rounded-lg bg-white/10 px-3 py-2.5 ring-1 ring-white/15">
      <p className="text-xs text-white/75">{label}</p>
      <p className="mt-1 leading-none">{value}</p>
    </div>
  );
};

const Corner = ({ className }: { className: string }) => (
  <span aria-hidden="true" className={`pointer-events-none absolute z-10 h-5 w-5 border-gold ${className}`} />
);

const ReportCardSheet = (props: ReportCardSheetProps) => {
  const {
    heading, issuedDate, periodLabel, learnerName, className, examination, isProvisional, results, averagePercentage, passed, sat,
    positionLabel, position, rankingFailed, teacherComment, principalComment, teacherCommentDate, principalCommentDate,
    teacherName, principalName, teacherSignatureUrl, principalSignatureUrl, qrUrl, nextTermBegins, attendance, termAttendance,
    termAttendanceYear, showYearToDate,
  } = props;
  const averageGrade = calculateGrade(averagePercentage);
  const attendanceTotal = Math.max(attendance.present + attendance.late + attendance.excused + attendance.absent, 0);
  const nextTerm = longDate(nextTermBegins);

  // The period alone ("Term 3 2026") sits under the title; the examination row names the exam.
  const subtitle = periodLabel || heading;
  const sortedTerms = termAttendance
    .slice()
    .sort((first, second) => first.term_name.localeCompare(second.term_name, undefined, { numeric: true }));

  return (
    // A navy outer rule, a hairline gold rule inside it and four gold corners frame the page like a certificate.
    // Printing scales the sheet down slightly so a full card (with term attendance) stays on one A4 page.
    <div className="bg-primary p-1.5 [print-color-adjust:exact] print:[zoom:0.8] print:p-1 [-webkit-print-color-adjust:exact]">
      <div className="relative overflow-hidden border border-gold bg-card">
        <Corner className="left-1 top-1 border-l-2 border-t-2" />
        <Corner className="right-1 top-1 border-r-2 border-t-2" />
        <Corner className="bottom-1 left-1 border-b-2 border-l-2" />
        <Corner className="bottom-1 right-1 border-b-2 border-r-2" />
        <img
          src={logo}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[55%] h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.045]"
        />

        <header className="relative border-b-4 border-gold bg-primary px-5 py-5 text-white sm:px-9 print:px-4 print:py-3">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: "repeating-linear-gradient(135deg, #fff 0 1px, transparent 1px 12px)" }}
          />
          <div className="relative grid items-center gap-4 md:grid-cols-[auto_1fr_auto] print:grid-cols-[auto_1fr_auto] print:gap-4">
            <img src={logo} alt="Able God College crest" className="mx-auto h-24 w-24 shrink-0 rounded-full bg-white object-contain p-1.5 ring-2 ring-gold print:h-20 print:w-20 md:mx-0" />
            <div className="text-center md:text-left print:text-left">
              <h1 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">Student Online Report Card</h1>
              <p className="mt-1 text-sm font-semibold text-gold">{subtitle}</p>
              <div className="mt-2 flex items-center gap-2" aria-hidden="true">
                <span className="h-px w-10 bg-gold/70" />
                <span className="h-1.5 w-1.5 rotate-45 bg-gold" />
                <span className="h-px flex-1 bg-white/25" />
              </div>
            </div>
            <address className="text-center text-xs not-italic leading-relaxed text-white/85 md:text-right print:text-right">
              <p className="font-heading text-base font-extrabold text-white">{schoolContact.name}</p>
              <p className="font-heading italic text-gold">B&apos;Ezrat Hashem</p>
              {schoolContact.phones.map((phone) => (
                <p key={phone.label}>Phone: {phone.label}</p>
              ))}
              <p>{schoolContact.address}</p>
            </address>
          </div>
        </header>

        <div className="relative px-5 pb-6 pt-5 sm:px-9 print:px-4 print:pb-2 print:pt-3">
          <div className="grid grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] print:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] print:gap-4">
            <dl className="border-t-2 border-primary">
              <div className="border-b border-border py-2 print:py-1">
                <dt className="sr-only">Learner</dt>
                <dd className="font-heading text-2xl font-extrabold text-primary">{learnerName}</dd>
              </div>
              <Detail label="Class">{className}</Detail>
              <Detail label="Examination">{examination}</Detail>
              <Detail label="Next term begins">{nextTerm || <span className="font-normal text-muted-foreground">To be announced</span>}</Detail>
              {isProvisional && (
                <div className="py-2">
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">Provisional results</span>
                </div>
              )}
            </dl>

            <div className="grid grid-cols-[auto_1fr] items-center gap-4 rounded-lg bg-primary p-4 text-white shadow-sm ring-1 ring-gold/60 print:p-3">
              <AverageRing value={averagePercentage} grade={averageGrade.grade} />
              <div className="space-y-2">
                <PositionStat label={positionLabel} state={position} />
                <div className="rounded-lg bg-white/10 px-3 py-2 ring-1 ring-white/15">
                  <p className="text-xs text-white/75">Subjects passed</p>
                  <p className="mt-1 font-heading leading-none tabular-nums"><span className="text-2xl font-extrabold">{passed}</span><span className="ml-1.5 text-sm font-medium text-white/75">out of {sat}</span></p>
                </div>
              </div>
            </div>
          </div>
          {rankingFailed && <p role="alert" className="mt-3 text-xs text-red-700">Positions could not be calculated. Please try again later.</p>}

          <div className="mt-5 overflow-x-auto print:mt-3">
            <table className="w-full min-w-[620px] border-collapse border border-primary/50 text-sm print:text-xs">
              <caption className="sr-only">Subject results</caption>
              <thead>
                <tr className="bg-primary text-white">
                  {["Subject", "Marks", "Scored", "Perc (%)", "Grade", "Comment"].map((title) => (
                    <th key={title} scope="col" className="border border-white/20 px-3 py-2.5 text-left font-bold print:py-1.5">{title}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => {
                  const percentage = percentageOf(result);
                  const info = calculateGrade(percentage);
                  return (
                    <tr key={`${result.subject}-${index}`} className="even:bg-primary/[0.06]">
                      <th scope="row" className="border border-border px-3 py-2.5 text-left font-semibold text-foreground print:py-1.5">{result.subject}</th>
                      <td className="border border-border px-3 py-2.5 tabular-nums print:py-1.5">{result.marks}</td>
                      <td className="border border-border px-3 py-2.5 tabular-nums print:py-1.5">{result.absent ? "ABS" : result.scored.toFixed(2)}</td>
                      <td className="border border-border px-3 py-2.5 print:py-1.5">
                        {result.absent ? "—" : (
                          <div className="flex items-center gap-2">
                            <span className="w-16 tabular-nums">{percentage.toFixed(2)}%</span>
                            <span aria-hidden="true" className="h-1.5 w-12 overflow-hidden rounded-full bg-primary/15">
                              <span className="block h-full rounded-full bg-gold" style={{ width: `${clamp(percentage)}%` }} />
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="border border-border px-3 py-2.5 print:py-1.5">{result.absent ? "—" : <GradeChip grade={info.grade} />}</td>
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
                  <tr className="border-t-4 border-double border-primary bg-gold/20 font-bold">
                    <th scope="row" className="border border-border px-3 py-2.5 text-left text-primary print:py-1.5">Average</th>
                    <td className="border border-border px-3 py-2.5">—</td>
                    <td className="border border-border px-3 py-2.5 tabular-nums print:py-1.5">{averagePercentage.toFixed(2)}</td>
                    <td className="border border-border px-3 py-2.5 tabular-nums print:py-1.5">{averagePercentage.toFixed(2)}%</td>
                    <td className="border border-border px-3 py-2.5 print:py-1.5"><GradeChip grade={averageGrade.grade} /></td>
                    <td className="border border-border px-3 py-2.5 print:py-1.5">{averageGrade.meaning}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] print:mt-3 print:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] print:gap-4">
            <div className="space-y-4 print:space-y-2">
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

            <section aria-label="Attendance" className="self-start overflow-hidden rounded-lg border border-primary/40 bg-card/80">
              <div className="bg-primary px-4 py-2 text-white">
                <p className="font-heading text-sm font-bold">{attendance.calendarLabel}</p>
                <p className="text-xs text-white/75">
                  Through {attendance.throughDate || "report period"} · {attendance.totalDays} marked of {attendance.schoolDays} school days
                </p>
              </div>
              <div className="px-4 py-3 print:py-2">
                <div
                  className="flex h-2.5 overflow-hidden rounded-full bg-muted"
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

                {sortedTerms.length > 0 && (
                  <div className="mt-3 border-t border-border pt-2">
                    <p className="text-xs font-semibold text-primary">Attendance by term{termAttendanceYear ? ` · ${termAttendanceYear}` : ""}</p>
                    <ul className="mt-1.5 space-y-1.5">
                      {sortedTerms.map((summary) => (
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
              </div>
            </section>
          </div>

          <div className="mt-5 flex items-center gap-3 print:mt-3" aria-hidden="true">
            <span className="h-px flex-1 bg-primary/40" />
            <span className="h-2 w-2 rotate-45 bg-gold" />
            <span className="h-px flex-1 bg-primary/40" />
          </div>
          <div className="mt-3 flex items-center justify-center gap-4 print:mt-2">
            {qrUrl && (
              <QrCode value={qrUrl} label="QR code linking to this report in the student's portal account" className="h-24 w-24 shrink-0 rounded border border-primary/30 print:h-20 print:w-20" />
            )}
            <p className="text-center text-sm text-muted-foreground print:text-xs">
              This report is electronically generated · Issued {issuedDate}
              {qrUrl && <span className="mt-0.5 block text-xs">Scan the code to open this report in the student&apos;s portal account.</span>}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportCardSheet;
