import { useEffect, useRef, useState } from "react";
import { Download, Printer, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api";
import logo from "/able-god-college-logo.png";
import { schoolContact } from "@/lib/schoolContact";
import { calculateGrade } from "@/lib/grading";
import { exportReportCardPdf } from "@/lib/pdfExport";
import { EXAM_REPORT_TYPES, useAcademicYears, useAttendanceRecords, useAttendanceReportSnapshot, useAttendanceTermSummaries, useExamMarks, useExamRanking, useExams, useInvoices, useReportCardReviews, useSchoolTerms, useStudentProfile, type Exam, type ExamMark, type ExamReportType, type ReportCardReview, type Student } from "@/lib/hooks";
import { formatMoney, type FinanceCurrency } from "@/lib/finance";
import { getTeacherComment } from "@/lib/reportComments";
import { formatLocalDateTime, getExamDisplayName } from "@/lib/examDisplay";
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
  comment: string;
}

export interface ReportCardSectionProps {
  studentId: number;
  adminPrintReport?: {
    student: Student;
    exam: Exam;
    marks: ExamMark[];
    attendance: ReportAttendanceSummary;
    review?: ReportCardReview;
  };
}

const getPercentage = ({ marks, scored }: SubjectResult) =>
  marks > 0 ? (scored / marks) * 100 : 0;

const formatPosition = (position: number | null | undefined, total: number | null | undefined) => {
  if (position == null || total == null) return "Not available";
  const suffix = position % 100 >= 11 && position % 100 <= 13
    ? "th"
    : ({ 1: "st", 2: "nd", 3: "rd" }[position % 10] || "th");
  return `${position}${suffix} of ${total}`;
};

const ReportCardSection = ({ studentId, adminPrintReport }: ReportCardSectionProps) => {
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
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const reportCardRef = useRef<HTMLDivElement>(null);
  const previousLocalPeriod = useRef(localPeriod);

  const { data: profile } = useStudentProfile(!adminPrintReport);
  const { data: invoices = [] } = useInvoices({ student: studentId }, !adminPrintReport);
  const { data: allMarks = [], isLoading: isLoadingMarks } = useExamMarks({ student: studentId }, !adminPrintReport);
  const { data: attendanceRecords = [] } = useAttendanceRecords({ student: studentId }, !adminPrintReport);
  const { data: exams = [], isLoading: isLoadingExams } = useExams(undefined, {
    refetchInterval: 5000,
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
  const selectedTypeLabel = EXAM_REPORT_TYPES.find(type => type.value === activeReportType)?.label ?? "Report card";
  const reportHeading = activeReportType === "monthly_report_card"
    ? "End-of-month Examination Report Card"
    : activeReportType === "fortnightly_tests"
      ? "Fortnightly Test Report Card"
      : "End-of-term Report Card";
  const reportPeriod = activeReportType === "monthly_report_card"
    ? issueMonthYear
    : selectedExam ? `${selectedExam.term} ${selectedExam.year}` : "";
  const isReportProvisional = !!selectedExam && (selectedExam.status !== "completed" || !selectedExam.results_published);
  const selectedTerm = selectedExam
    ? `${isReportProvisional ? "PROVISIONAL · " : ""}${selectedTypeLabel} · ${getExamDisplayName(selectedExam)} · ${selectedExam.term} ${selectedExam.year}`
    : "No examination selected";
  const marks = adminPrintReport?.marks ?? allMarks.filter(mark => mark.exam === selectedExam?.id);
  const { data: ranking, isLoading: isLoadingRanking, isError: isRankingError } =
    useExamRanking(isReportProvisional ? undefined : selectedExam?.id, studentId);

  const results: SubjectResult[] = marks.map(m => ({
    subject: m.subject_name,
    marks: m.total_marks,
    scored: Number(m.scored),
    comment: m.comment?.trim() ?? "",
  })).sort((first, second) => first.subject.localeCompare(second.subject));

  const handleDownloadPdf = async () => {
    setIsExporting(true);
    try {
      if (!selectedExam) return;
      const generatedAt = new Date();
      const generatedMonthYear = generatedAt.toLocaleDateString(undefined, { month: "long", year: "numeric" });
      await exportReportCardPdf({
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
        totalSubjects: results.length,
        classPosition: isReportProvisional ? "Provisional" : formatPosition(ranking?.class_position, ranking?.class_total),
        levelPosition: isReportProvisional ? "Provisional" : formatPosition(ranking?.level_position, ranking?.level_total),
        teacherComment,
        principalComment,
        attendance: publishedAttendance,
        results: results.map(result => ({
          ...result,
          percentage: getPercentage(result),
          grade: calculateGrade(getPercentage(result)).grade,
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
    return results.filter(result => getPercentage(result) >= 40).length;
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

  const averagePercentage = results.length
    ? results.reduce((sum, result) => sum + getPercentage(result), 0) / results.length
    : 0;

  const teacherComment = reportReview?.class_teacher_comment || getTeacherComment(averagePercentage);
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
            This student portal is currently restricted because the account has an outstanding balance of {outstandingBalanceLabel}. Results and report cards are hidden until the balance is cleared.
          </p>
          <p className="text-sm text-muted-foreground">Please contact the school accounts office to clear the balance.</p>
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
                {getExamDisplayName(exam)} · {exam.term} {exam.year}
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
            Teacher-saved marks appear here as soon as the administrator completes and unlocks the report. This page checks for updates every 5 seconds.
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
        className={`report-card-content mx-auto w-full max-w-5xl overflow-hidden rounded-lg border border-[#ead9e3] bg-[#fffafd] text-[#172044] shadow-sm print:max-w-none print:rounded-none print:border-0 print:shadow-none${adminPrintReport ? " admin-print-report-card" : ""}`}
      >
        <header className="text-white">
          <div className="flex flex-col gap-4 bg-gradient-to-r from-[#10244f] via-[#34245f] to-[#b31669] px-5 py-4 sm:flex-row sm:items-center">
            <img
              src={logo}
              alt="Able God College crest"
              className="h-16 w-16 shrink-0 rounded-xl bg-white p-1.5 object-contain"
            />
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <p className="font-serif text-2xl font-bold tracking-wide">Able God College</p>
              <p className="mt-0.5 text-[9px] uppercase tracking-[0.3em] text-white/75">B&apos;Ezrat Hashem</p>
            </div>
            <div className="text-center text-[10px] leading-relaxed text-white/90 sm:text-right">
              <p className="mb-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/65">Contact</p>
              <p>{schoolContact.phones.map((phone) => phone.label).join(" / ")}</p>
              <p>{schoolContact.address}</p>
            </div>
          </div>
          <div className="h-1 bg-gradient-to-r from-[#ed3c91] via-[#d82179] to-[#f0c86c]" />
        </header>

        <div className="px-4 pb-4 pt-3 sm:px-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h1 className="font-serif text-base font-bold tracking-wide text-[#14234f] sm:text-lg">
              {reportHeading.toUpperCase()}
            </h1>
            <p className="text-[10px] text-[#747386]">
              {activeReportType === "monthly_report_card" ? `${issueMonthYear} · ` : ""}Issued {issuedDate}
            </p>
          </div>

          <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(105px,0.43fr)_minmax(82px,0.32fr)]">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl border border-[#eadde5] bg-white p-3">
              <div className="col-span-2 min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8d8490]">Learner</p>
                <p className="truncate font-serif text-base font-bold text-[#17244c]">{adminPrintReport?.student.name || profile?.name || "Student"}</p>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8d8490]">Class</p>
                <p className="truncate text-xs font-semibold text-[#17244c]">{adminPrintReport?.student.class_name || profile?.class_name || "—"}</p>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8d8490]">Examination</p>
                <p className="truncate text-xs font-semibold text-[#17244c]">{selectedTerm}</p>
              </div>
            </div>

            <div className="flex flex-col justify-center rounded-xl bg-gradient-to-br from-[#10244f] to-[#a91667] p-3 text-white">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/75">Average</p>
              <p className="mt-0.5 font-serif text-2xl font-bold leading-none">{averagePercentage.toFixed(2)}%</p>
              <p className="mt-1 text-[9px] text-white/85">Overall grade {calculateGrade(averagePercentage).grade}</p>
            </div>

            <div className="flex flex-row items-center justify-between rounded-xl border border-[#eadde5] bg-white p-3 sm:flex-col sm:items-start sm:justify-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8d8490]">Passed</p>
              <p className="font-serif text-2xl font-bold leading-none text-[#17244c]">{countPassed()} / {results.length}</p>
              <p className="text-[9px] text-[#777484]">subjects</p>
            </div>
          </div>

          <div className="mb-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-[#eadde5] bg-white px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7e7888]">Class position</p>
              <p className="mt-0.5 font-serif text-lg font-bold leading-tight text-[#17244c]">
                {isReportProvisional ? "Provisional" : (isLoadingRanking ? "Calculating…" : formatPosition(ranking?.class_position, ranking?.class_total))}
              </p>
              <p className="text-[9px] text-[#777484]">
                {isReportProvisional ? "Computed when exam is finalized" : "Based on this examination"}
              </p>
            </div>
            <div className="rounded-xl border border-[#edcfdf] bg-[#fff3f8] px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7e7888]">
                {ranking?.level_name ? `${ranking.level_name} level position` : "Overall level position"}
              </p>
              <p className="mt-0.5 font-serif text-lg font-bold leading-tight text-[#17244c]">
                {isReportProvisional ? "Provisional" : (isLoadingRanking ? "Calculating…" : formatPosition(ranking?.level_position, ranking?.level_total))}
              </p>
              <p className="text-[9px] text-[#777484]">
                {isReportProvisional ? "Computed when exam is finalized" : "Across sections at the same level"}
              </p>
            </div>
          </div>
          {isRankingError && (
            <p role="alert" className="mb-3 text-xs text-red-700">
              Positions could not be calculated. Please try again later.
            </p>
          )}

          <div className="overflow-x-auto rounded-lg border border-[#eadde5]">
            <table className="w-full min-w-[620px] table-fixed border-collapse text-[11px]">
              <colgroup>
                <col className="w-[25%]" />
                <col className="w-[10%]" />
                <col className="w-[11%]" />
                <col className="w-[22%]" />
                <col className="w-[10%]" />
                <col className="w-[22%]" />
              </colgroup>
              <thead className="bg-[#14234f] text-white">
                <tr>
                  {["Subject", "Out of", "Score", "Percentage", "Grade", "Comment"].map((heading, index) => (
                    <th
                      key={heading}
                      className={`px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] ${index === 0 || index === 5 ? "text-left" : "text-center"}`}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eadde5]">
                {results.map((result, index) => {
                  const percentage = getPercentage(result);
                  const gradeInfo = calculateGrade(percentage);
                  return (
                    <tr key={`${result.subject}-${index}`} className={index % 2 === 0 ? "bg-white" : "bg-[#fff3f8]"}>
                      <td className="px-2 py-1.5 font-semibold text-[#202849]">{result.subject}</td>
                      <td className="px-2 py-1.5 text-center text-[#777484]">{result.marks}</td>
                      <td className="px-2 py-1.5 text-center font-semibold text-[#202849]">{result.scored.toFixed(2)}</td>
                      <td className="px-2 py-1.5">
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 min-w-8 flex-1 overflow-hidden rounded-full bg-[#eee8ed]">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#182858] to-[#e33388]"
                              style={{ width: `${Math.min(Math.max(percentage, 0), 100)}%` }}
                            />
                          </div>
                          <span className="w-12 shrink-0 text-right text-[10px] text-[#777484]">{percentage.toFixed(2)}%</span>
                        </div>
                      </td>
                      <td className="px-2 py-1.5 text-center">
                          <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold ${gradeInfo.bgColor} ${gradeInfo.color}`}>
                          {gradeInfo.grade}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-[#777484]" title={result.comment || undefined}>
                        {result.comment || gradeInfo.meaning}
                      </td>
                    </tr>
                  );
                })}
                {results.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-[#777484]">No records found for this term.</td>
                  </tr>
                )}
              </tbody>
              {results.length > 0 && (
                <tfoot className="border-t border-[#e9c9d9] bg-[#fdeaf3]">
                  <tr>
                    <td className="px-2 py-2 font-bold text-[#17244c]">Average</td>
                    <td className="px-2 py-2 text-center text-[#777484]">—</td>
                    <td className="px-2 py-2 text-center font-bold text-[#17244c]">{averagePercentage.toFixed(2)}</td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 min-w-8 flex-1 overflow-hidden rounded-full bg-white">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#182858] to-[#e33388]"
                            style={{ width: `${Math.min(Math.max(averagePercentage, 0), 100)}%` }}
                          />
                        </div>
                        <span className="w-12 shrink-0 text-right text-[10px] font-semibold text-[#17244c]">{averagePercentage.toFixed(2)}%</span>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold ${calculateGrade(averagePercentage).bgColor} ${calculateGrade(averagePercentage).color}`}>
                        {calculateGrade(averagePercentage).grade}
                      </span>
                    </td>
                    <td className="px-2 py-2 font-medium text-[#777484]">{calculateGrade(averagePercentage).meaning}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-[#eadde5] bg-white px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7e7888]">
                Class Teacher&apos;s comment
              </p>
              <p className="mt-1 text-[10px] italic leading-relaxed text-[#454255]">{teacherComment}</p>
            </div>
            <div className="rounded-xl border border-[#edcfdf] bg-[#fff3f8] px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7e7888]">Principal&apos;s overall comment</p>
              <p className="mt-1 text-[10px] italic leading-relaxed text-[#454255]">{principalComment || "Awaiting principal review."}</p>
            </div>
          </div>
          <div className="mt-2 rounded-xl border border-[#eadde5] bg-white px-3 py-2">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#85808e]">{publishedAttendance.calendarLabel} through {publishedAttendance.throughDate || "report period"}</p>
                <p className="mt-0.5 text-xs font-bold text-[#17244c]">{publishedAttendance.totalDays} marked days · {publishedAttendance.present} present · {publishedAttendance.absent} unexcused absent · {publishedAttendance.excused} excused · {publishedAttendance.late} late</p>
                <p className="mt-0.5 text-[9px] text-[#777484]">
                  {publishedAttendance.schoolDays} scheduled school days in the report period · {publishedAttendance.unrecorded} unmarked · {publishedAttendance.sickBay} sick bay · {publishedAttendance.suspended} suspended
                </p>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-[#e6e9e8]">
                  <div className="h-full rounded-full bg-[#17874f]" style={{ width: `${publishedAttendance.schoolDays ? Math.min(100, ((publishedAttendance.present + publishedAttendance.late) / publishedAttendance.schoolDays) * 100) : 0}%` }} />
                </div>
                <p className="mt-1 text-[9px] text-[#777484]">
                  Unexcused absence dates: {publishedAttendance.absentDates.length ? publishedAttendance.absentDates.join(", ") : "None recorded"}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 sm:min-w-[270px]">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#85808e]">Unexcused</p>
                  <p className="mt-0.5 text-xs font-bold text-[#17244c]">{publishedAttendance.absent} days</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#85808e]">Excused</p>
                  <p className="mt-0.5 text-xs font-bold text-[#17244c]">{publishedAttendance.excused} days</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#85808e]">Late</p>
                  <p className="mt-0.5 text-xs font-bold text-[#17244c]">{publishedAttendance.late} days</p>
                </div>
              </div>
            </div>
          </div>
          {attendanceSummaries.length > 0 && (
            <section aria-label="Term attendance comparison" className="mt-2 rounded-xl border border-[#eadde5] bg-white px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#85808e]">Attendance by term · {selectedExam?.year}</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {attendanceSummaries
                  .slice()
                  .sort((first, second) => first.term_name.localeCompare(second.term_name, undefined, { numeric: true }))
                  .map(summary => (
                    <div key={summary.id} className="text-[9px] text-[#777484]">
                      <div className="flex justify-between gap-2">
                        <span className="font-semibold text-[#17244c]">{summary.term_name}</span>
                        <span>{Number(summary.attendance_percentage).toFixed(1)}%</span>
                      </div>
                      <div className="mt-1 h-1 overflow-hidden rounded-full bg-[#e6e9e8]">
                        <div className="h-full rounded-full bg-[#b31669]" style={{ width: `${Math.min(100, Math.max(0, Number(summary.attendance_percentage)))}%` }} />
                      </div>
                      <p className="mt-1">{summary.days_present} present · {summary.days_absent} absent · {summary.total_school_days} school days{summary.is_out_of_date ? " · needs refresh" : ""}</p>
                    </div>
                  ))}
              </div>
              {selectedExam?.term.toLowerCase().includes("term 3") && (
                <p className="mt-2 text-[9px] font-semibold text-[#17244c]">
                  Year to date: {attendanceSummaries.reduce((total, summary) => total + summary.days_present + summary.days_late, 0)} present/late days from {attendanceSummaries.reduce((total, summary) => total + summary.total_school_days, 0)} scheduled school days.
                </p>
              )}
            </section>
          )}

          <div className="mt-4 grid grid-cols-2 gap-8 px-3">
            <div className="border-t border-[#a8a1ad] pt-1 text-[9px] uppercase tracking-[0.12em] text-[#777484]">Class teacher</div>
            <div className="border-t border-[#a8a1ad] pt-1 text-[9px] uppercase tracking-[0.12em] text-[#777484]">Principal</div>
          </div>

          <footer className="mt-3 flex flex-wrap items-center justify-between gap-1 text-[9px] text-[#898391]">
            <p>This report is electronically generated.</p>
            <p><span className="font-semibold text-[#17244c]">Able God College</span> · {schoolContact.address}</p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default ReportCardSection;
