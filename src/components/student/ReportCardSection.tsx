import { useEffect, useRef, useState } from "react";
import { Download, Printer, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api";
import ReportCardSheet from "./ReportCardSheet";
import { calculateGrade } from "@/lib/grading";
import { exportReportCardPdf } from "@/lib/pdfExport";
import { EXAM_REPORT_TYPES, useAcademicYears, useAttendanceRecords, useAttendanceReportSnapshot, useAttendanceTermSummaries, useExamMarks, useExamRanking, useExams, useInvoices, useReportCardReviews, useSchoolTerms, useStudentProfile, type Exam, type ExamMark, type ExamReportType, type ReportCardReview, type Student } from "@/lib/hooks";
import { formatMoney, type FinanceCurrency } from "@/lib/finance";
import { formatLocalDateTime, getExamDisplayName, getExamFullLabel } from "@/lib/examDisplay";
import { getReportAttendance, mapAttendanceSnapshot, type ReportAttendanceSummary } from "@/lib/reportAttendance";
import {
  getLocalSchoolPeriod,
  getReportTermOptions,
  getReportTypeForTerm,
  getReportYearOptions,
  getSchoolTermForDate,
  getTermForReportType,
  useLocalSchoolPeriod,
} from "@/lib/reportPeriod";

interface SubjectResult {
  subject: string;
  marks: number;
  scored: number;
  absent: boolean;
  comment: string;
}

export interface ReportCardSectionProps {
  studentId: number;
  /** A parent views a child's card: use that child's record, and offer a way to pay when fees are outstanding. */
  student?: Student;
  onPayFees?: () => void;
  adminPrintReport?: {
    student: Student;
    exam: Exam;
    marks: ExamMark[];
    attendance: ReportAttendanceSummary;
    review?: ReportCardReview;
  };
}

const getPercentage = ({ marks, scored, absent }: SubjectResult) =>
  !absent && marks > 0 ? (scored / marks) * 100 : 0;

/** "3B1", "3B1 & 3B2", "3A1, 3A2 & 3A3". */
const joinClassNames = (names: string[]) =>
  names.length > 1 ? `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}` : names[0] ?? "";

const formatPosition = (position: number | null | undefined, total: number | null | undefined) => {
  if (position == null || total == null) return "Not available";
  const suffix = position % 100 >= 11 && position % 100 <= 13
    ? "th"
    : ({ 1: "st", 2: "nd", 3: "rd" }[position % 10] || "th");
  return `${position}${suffix} of ${total}`;
};

const ReportCardSection = ({ studentId, adminPrintReport, student: studentOverride, onPayFees }: ReportCardSectionProps) => {
  const localCalendarPeriod = useLocalSchoolPeriod();
  const { data: academicYears = [] } = useAcademicYears(!adminPrintReport);
  const currentAcademicYear = academicYears.find(year => year.name.trim() === localCalendarPeriod.year);
  const { data: currentSchoolTerms = [] } = useSchoolTerms(
    currentAcademicYear ? { academic_year: currentAcademicYear.id } : undefined,
    !adminPrintReport,
  );
  const localPeriod = {
    ...localCalendarPeriod,
    term: getSchoolTermForDate(currentSchoolTerms, localCalendarPeriod.date, localCalendarPeriod.term),
  };
  const currentLocalYear = localPeriod.year;
  const currentLocalTerm = localPeriod.term;
  const [selectedYear, setSelectedYear] = useState(() => getLocalSchoolPeriod().year);
  const [selectedAcademicTerm, setSelectedAcademicTerm] = useState(() => getLocalSchoolPeriod().term);
  const [selectedReportType, setSelectedReportType] = useState<ExamReportType>(
    () => getReportTypeForTerm(getLocalSchoolPeriod().term),
  );
  // A scanned report-card QR code opens the portal with ?exam=<id> so the right report is selected.
  const [selectedExamId, setSelectedExamId] = useState<number | null>(() => Number(new URLSearchParams(window.location.search).get("exam")) || null);
  const [isExporting, setIsExporting] = useState(false);
  const reportCardRef = useRef<HTMLDivElement>(null);
  const previousLocalPeriod = useRef(localPeriod);

  const { data: ownProfile } = useStudentProfile(!adminPrintReport && !studentOverride);
  const profile = studentOverride ?? ownProfile;
  const { data: invoices = [] } = useInvoices({ student: studentId }, !adminPrintReport);
  const { data: allMarks = [], isLoading: isLoadingMarks } = useExamMarks({ student: studentId }, !adminPrintReport);
  const { data: attendanceRecords = [] } = useAttendanceRecords({ student: studentId }, !adminPrintReport);
  const { data: exams = [], isLoading: isLoadingExams } = useExams(undefined, {
    refetchInterval: 60000,
    enabled: !adminPrintReport,
  });
  const availableExams = exams
    .filter(exam => allMarks.some(mark => mark.exam === exam.id))
    .sort((first, second) => second.start_date.localeCompare(first.start_date));
  useEffect(() => {
    const previousPeriod = previousLocalPeriod.current;
    if (previousPeriod.year !== currentLocalYear) {
      setSelectedYear(current => current === previousPeriod.year ? currentLocalYear : current);
    }
    if (previousPeriod.term !== currentLocalTerm) {
      setSelectedAcademicTerm(current => current === previousPeriod.term ? currentLocalTerm : current);
      setSelectedReportType(current => (
        current === getReportTypeForTerm(previousPeriod.term)
          ? getReportTypeForTerm(currentLocalTerm)
          : current
      ));
    }
    previousLocalPeriod.current = { ...previousPeriod, year: currentLocalYear, term: currentLocalTerm };
  }, [currentLocalYear, currentLocalTerm]);
  const yearOptions = getReportYearOptions(availableExams, localPeriod.year);
  const termOptions = getReportTermOptions(availableExams, selectedYear);
  const activeReportType = adminPrintReport?.exam.report_type ?? selectedReportType;
  const visibleExams = availableExams.filter(exam => (
    exam.year.trim() === selectedYear
    && exam.term.trim().toLowerCase() === selectedAcademicTerm.trim().toLowerCase()
    && exam.report_type === activeReportType
  ));
  const selectedExam = adminPrintReport?.exam ?? visibleExams.find(exam => exam.id === selectedExamId) ?? visibleExams[0];
  const { data: reportReviews = [], error: reportReviewsError } = useReportCardReviews(selectedExam?.id, studentId, !adminPrintReport);
  const reportReview = adminPrintReport?.review ?? reportReviews.find(review => review.student === studentId);
  const { data: attendanceSnapshot } = useAttendanceReportSnapshot(selectedExam?.id, studentId, !adminPrintReport);
  const { data: attendanceSummaries = [] } = useAttendanceTermSummaries({
    student: studentId,
    year: selectedExam?.year,
  });
  const issuedAt = new Date();
  const issuedDate = selectedExam?.report_type === "monthly_report_card" || selectedExam?.report_type === "fortnightly_tests"
    ? formatLocalDateTime(issuedAt)
    : issuedAt.toLocaleDateString("en-GB");
  const issueMonthYear = issuedAt.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const reportHeading = activeReportType === "monthly_report_card"
    ? "End-of-month Examination Report Card"
    : activeReportType === "fortnightly_tests"
      ? "Fortnightly Test Report Card"
      : "End-of-term Report Card";
  const reportPeriod = activeReportType === "monthly_report_card"
    ? issueMonthYear
    : selectedExam ? `${selectedExam.term} ${selectedExam.year}` : "";
  const isReportProvisional = !!selectedExam && (selectedExam.status !== "completed" || !selectedExam.results_published);
  const qrUrl = selectedExam ? `${window.location.origin}/student?open=report-card&exam=${selectedExam.id}&student=${studentId}` : null;
  const selectedTerm = selectedExam ? getExamDisplayName(selectedExam) : "No examination selected";
  const marks = adminPrintReport?.marks ?? allMarks.filter(mark => mark.exam === selectedExam?.id);
  const { data: ranking, isLoading: isLoadingRanking, isError: isRankingError } =
    useExamRanking(isReportProvisional ? undefined : selectedExam?.id, studentId);

  const results: SubjectResult[] = marks.map(m => ({
    subject: m.subject_name,
    marks: m.total_marks,
    scored: Number(m.scored),
    absent: Boolean(m.absent),
    comment: m.comment?.trim() ?? "",
  })).sort((first, second) => first.subject.localeCompare(second.subject));

  const satResults = results.filter(result => !result.absent);

  const handleDownloadPdf = async () => {
    setIsExporting(true);
    try {
      if (!selectedExam) return;
      const generatedAt = new Date();
      const generatedMonthYear = generatedAt.toLocaleDateString(undefined, { month: "long", year: "numeric" });
      await exportReportCardPdf({
        qrUrl: qrUrl ?? undefined,
        studentName: profile?.name || "Student",
        studentId: profile?.student_id || "",
        className: profile?.class_name || "—",
        examName: getExamDisplayName(selectedExam),
        termLabel: `${isReportProvisional ? "Provisional · " : ""}${EXAM_REPORT_TYPES.find(type => type.value === selectedExam.report_type)?.label ?? "Report card"} · ${selectedExam.term} ${selectedExam.year}`,
        reportHeading,
        reportPeriod: selectedExam.report_type === "monthly_report_card" ? generatedMonthYear : `${selectedExam.term} ${selectedExam.year}`,
        issuedDate: selectedExam.report_type === "monthly_report_card" || selectedExam.report_type === "fortnightly_tests"
          ? formatLocalDateTime(generatedAt)
          : generatedAt.toLocaleDateString("en-GB"),
        average: averagePercentage,
        overallGrade: calculateGrade(averagePercentage).grade,
        passed: countPassed(),
        totalSubjects: satResults.length,
        classPosition: isReportProvisional ? "Provisional" : formatPosition(overallPosition.position, overallPosition.total),
        levelPosition: isReportProvisional ? "Provisional" : formatPosition(ranking?.level_position, ranking?.level_total),
        positionLabel: `Position in ${positionClasses}`,
        teacherComment,
        principalComment,
        attendance: publishedAttendance,
        results: results.map(result => ({
          ...result,
          percentage: getPercentage(result),
          grade: result.absent ? "—" : calculateGrade(getPercentage(result)).grade,
        })),
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    document.body.classList.add("printing-report-card");
    window.addEventListener("afterprint", () => {
      document.body.classList.remove("printing-report-card");
    }, { once: true });
    window.print();
  };

  const handleShareWhatsApp = () => {
    const message = `Hello, your report card for ${profile?.name || "student"} is ready. Please log in to the school portal to download the PDF report card.`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const countPassed = () => {
    return satResults.filter(result => getPercentage(result) >= 40).length;
  };

  const outstandingBalances = invoices.reduce<Record<string, number>>((totals, invoice) => {
    totals[invoice.currency] = (totals[invoice.currency] || 0) + Math.max(0, Number(invoice.amount) - Number(invoice.paid));
    return totals;
  }, {});
  const outstandingBalanceLabel = Object.entries(outstandingBalances)
    .filter(([, balance]) => balance > 0)
    .map(([currency, balance]) => formatMoney(balance, currency as FinanceCurrency))
    .join(" · ");
  const resultsBlocked = !adminPrintReport && Object.values(outstandingBalances).some(balance => balance > 0);

  // Papers the learner did not sit are shown as ABS and are left out of the average, never counted as 0.
  const averagePercentage = satResults.length
    ? satResults.reduce((sum, result) => sum + getPercentage(result), 0) / satResults.length
    : 0;

  // One overall position: across every class at the same level when there are several (3B1 and 3B2),
  // otherwise the class's own position (4B1), which is the same thing.
  const levelClassNames = ranking?.level_classes ?? [];
  const sharesLevel = levelClassNames.length > 1;
  const className = adminPrintReport?.student.class_name || profile?.class_name || "—";
  const positionClasses = sharesLevel ? joinClassNames(levelClassNames) : className;
  const overallPosition = sharesLevel
    ? { position: ranking?.level_position, total: ranking?.level_total }
    : { position: ranking?.class_position, total: ranking?.class_total };
  const teacherComment = reportReview?.class_teacher_comment?.trim() || "Awaiting the class teacher's comment.";
  const principalComment = reportReview?.principal_comment || "";
  const attendance = adminPrintReport?.attendance ?? (selectedExam
    ? getReportAttendance(selectedExam, studentId, attendanceRecords, issuedAt)
    : {
      totalDays: 0,
      schoolDays: 0,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      sickBay: 0,
      suspended: 0,
      unrecorded: 0,
      absentDates: [],
      throughDate: "",
      calendarLabel: "Report-period attendance",
      isOutOfDate: false,
    });
  const snapshotNeedsRefresh = Boolean(
    attendanceSnapshot && (
      attendanceSnapshot.is_out_of_date ||
      (attendanceSnapshot.summary.total_school_days === 0 && attendance.schoolDays > 0)
    ),
  );
  const publishedAttendance = adminPrintReport
    ? adminPrintReport.attendance
    : attendanceSnapshot && !snapshotNeedsRefresh
    ? mapAttendanceSnapshot(attendanceSnapshot.summary, attendanceSnapshot.is_out_of_date)
    : { ...attendance, isOutOfDate: snapshotNeedsRefresh };

  if (resultsBlocked) {
    return (
      <div className="flex items-center justify-center min-h-[280px]">
        <div className="max-w-xl w-full bg-card border border-amber-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <Calendar className="h-8 w-8" />
          </div>
          <h3 className="font-heading text-2xl font-bold text-foreground mb-2">Results Locked</h3>
          <p className="text-muted-foreground mb-4">
            {studentOverride ? `The report card for ${studentOverride.name} is held back` : "This student portal is currently restricted"} because the account has an outstanding balance of {outstandingBalanceLabel}. Results and report cards are hidden until the balance is cleared.
          </p>
          {onPayFees ? (
            <Button variant="gold" size="lg" className="rounded-xl px-8" onClick={onPayFees}>Pay now</Button>
          ) : (
            <p className="text-sm text-muted-foreground">Please contact the school accounts office to clear the balance.</p>
          )}
        </div>
      </div>
    );
  }

  if (!adminPrintReport && (isLoadingMarks || isLoadingExams)) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Generating report card...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="report-card-controls flex flex-col justify-between gap-4 sm:flex-row sm:items-center print:hidden">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">Report Card</h2>
          <p className="text-muted-foreground text-sm">View your academic performance</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={activeReportType}
            onChange={(event) => {
              const nextType = event.target.value as ExamReportType;
              setSelectedReportType(nextType);
              const impliedTerm = getTermForReportType(nextType);
              if (impliedTerm) setSelectedAcademicTerm(impliedTerm);
              setSelectedExamId(null);
            }}
            className="px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
            aria-label="Report card type"
          >
            {EXAM_REPORT_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
          </select>
          <select
            value={selectedYear}
            onChange={(event) => {
              setSelectedYear(event.target.value);
              setSelectedExamId(null);
            }}
            className="px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
            aria-label="Report card year"
          >
            {yearOptions.map(({ year, isFuture }) => (
              <option key={year} value={year} disabled={isFuture}>
                {year}{isFuture ? " (not available yet)" : ""}
              </option>
            ))}
          </select>
          <select
            value={selectedAcademicTerm}
            onChange={(event) => {
              const nextTerm = event.target.value;
              setSelectedAcademicTerm(nextTerm);
              if (getTermForReportType(selectedReportType)) {
                setSelectedReportType(getReportTypeForTerm(nextTerm));
              }
              setSelectedExamId(null);
            }}
            className="px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
            aria-label="Report card term"
          >
            {termOptions.map(term => <option key={term} value={term}>{term}</option>)}
          </select>
          <select
            value={selectedExam?.id ?? ""}
            onChange={(e) => setSelectedExamId(Number(e.target.value))}
            className="px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
            aria-label="Report card examination"
            disabled={visibleExams.length === 0}
          >
            {visibleExams.length === 0 && <option value="">No exam results</option>}
            {visibleExams.map(exam => (
              <option key={exam.id} value={exam.id}>
                {getExamFullLabel(exam)}
              </option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={handleShareWhatsApp}>
            Share on WhatsApp
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} disabled={!selectedExam || results.length === 0}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="gold" size="sm" onClick={handleDownloadPdf} disabled={isExporting || !selectedExam || results.length === 0}>
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {isExporting ? "Exporting..." : "Download PDF"}
          </Button>
        </div>
      </div>

      {(!selectedExam || results.length === 0) && (
        <div role="status" className="rounded-xl border border-dashed border-border bg-card p-6 text-center">
          <p className="font-semibold text-foreground">
            {isLoadingMarks || isLoadingExams
              ? "Checking for unlocked report results…"
              : "No results are available yet for this report."}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Teacher-saved marks appear here as soon as the administrator completes and unlocks the report. This page checks for updates every minute.
          </p>
        </div>
      )}
      {reportReviewsError && selectedExam && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Could not load this report&apos;s teacher and principal comments: {getErrorMessage(reportReviewsError)}
        </p>
      )}

      {selectedExam && results.length > 0 && isReportProvisional && (
        <div role="status" className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <span className="font-semibold">Provisional results.</span> Your teacher&apos;s saved marks are shown here and will refresh automatically. The final report is available after the school completes and publishes it.
        </div>
      )}

      <div
        id={adminPrintReport ? undefined : "report-card-content"}
        ref={reportCardRef}
        className={`report-card-content mx-auto w-full max-w-5xl overflow-hidden rounded-lg border border-border bg-card text-foreground shadow-elegant print:max-w-none print:rounded-none print:border-0 print:shadow-none${adminPrintReport ? " admin-print-report-card" : ""}`}
      >
        <ReportCardSheet
          qrUrl={qrUrl}
          heading={reportHeading}
          issuedDate={issuedDate}
          periodLabel={reportPeriod}
          learnerName={adminPrintReport?.student.name || profile?.name || "Student"}
          className={className}
          examination={selectedTerm}
          isProvisional={isReportProvisional}
          results={results}
          averagePercentage={averagePercentage}
          passed={countPassed()}
          sat={satResults.length}
          positionLabel={`Position in ${positionClasses}`}
          position={isReportProvisional ? { status: "provisional" } : isLoadingRanking ? { status: "loading" } : { status: "ready", ...overallPosition }}
          rankingFailed={isRankingError}
          teacherComment={teacherComment}
          principalComment={principalComment}
          teacherCommentDate={reportReview?.class_teacher_submitted_at ?? null}
          teacherName={reportReview?.class_teacher_name}
          principalName={reportReview?.principal_name}
          principalCommentDate={reportReview?.principal_reviewed_at ?? null}
          nextTermBegins={reportReview?.next_term_begins ?? null}
          teacherSignatureUrl={reportReview?.class_teacher_signature_url ?? null}
          principalSignatureUrl={reportReview?.principal_signature_url ?? null}
          attendance={publishedAttendance}
          termAttendance={attendanceSummaries}
          termAttendanceYear={selectedExam?.year}
          showYearToDate={Boolean(selectedExam?.term.toLowerCase().includes("term 3"))}
        />
      </div>
    </div>
  );
};

export default ReportCardSection;
