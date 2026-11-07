import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, FileSpreadsheet, Loader2, LockKeyhole, Printer, UnlockKeyhole } from "lucide-react";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { EXAM_REPORT_TYPES, useAcademicYears, useAttendanceRecords, useAttendanceReportSnapshots, useExamMarks, useExams, useRegenerateAttendanceSnapshot, useReportCardReviews, useSchoolTerms, useStudents, useSubjects, useUpdateExam, useUpdateReportCardReview, type Exam, type ExamMark, type ReportCardReview, type SchoolClass, type Student } from "@/lib/hooks";
import { calculateGrade } from "@/lib/grading";
import { getErrorMessage } from "@/lib/api";
import { formatLocalDateTime, getExamDisplayName } from "@/lib/examDisplay";
import { getReportAttendance, mapAttendanceSnapshot, type ReportAttendanceSummary } from "@/lib/reportAttendance";
import { toast } from "sonner";
import { getPrincipalComment, PRINCIPAL_COMMENT_LIBRARY } from "@/lib/reportComments";
import ReportCardSection from "@/components/student/ReportCardSection";
import {
  getLocalSchoolPeriod,
  getReportTermOptions,
  getReportTypeForTerm,
  getReportYearOptions,
  getSchoolTermForDate,
  getTermForReportType,
  useLocalSchoolPeriod,
} from "@/lib/reportPeriod";

type ReportViewMode = "class" | "subject";
type ExportFormat = "pdf" | "csv";

interface StudentReport {
  student: Student;
  marks: ExamMark[];
  average: number;
  attendance: ReportAttendanceSummary;
  attendanceSnapshotId?: number;
  review?: ReportCardReview;
}

const getReportTypeLabel = (exam: Exam) => EXAM_REPORT_TYPES.find((type) => type.value === exam.report_type)?.label ?? "Report card";
const getReportHeading = (exam: Exam) => exam.report_type === "monthly_report_card"
  ? "End-of-month Examination Report Card"
  : exam.report_type === "fortnightly_tests"
    ? "Fortnightly Test Report Card"
    : "End-of-term Report Card";
const getIssueStamp = (exam: Exam) => {
  const now = new Date();
  const date = now.toLocaleDateString("en-GB");
  return exam.report_type === "monthly_report_card" || exam.report_type === "fortnightly_tests"
    ? formatLocalDateTime(now)
    : date;
};
const getExamLabel = (exam: Exam) => `${getReportTypeLabel(exam)} · ${getExamDisplayName(exam)} · ${exam.term} ${exam.year}`;
const safeFilePart = (value: string) => value.trim().replace(/[^a-z0-9-_]+/gi, "_").replace(/^_+|_+$/g, "") || "Report";
const csvCell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;

const AdminReportCardsSection = ({ classes }: { classes: SchoolClass[] }) => {
  const { data: students = [], isLoading: loadingStudents, error: studentsError } = useStudents();
  const { data: exams = [], isLoading: loadingExams, error: examsError } = useExams();
  const { data: attendanceRecords = [] } = useAttendanceRecords();
  const { data: subjects = [], isLoading: loadingSubjects } = useSubjects();
  const localCalendarPeriod = useLocalSchoolPeriod();
  const { data: academicYears = [] } = useAcademicYears();
  const currentAcademicYear = academicYears.find(year => year.name.trim() === localCalendarPeriod.year);
  const { data: currentSchoolTerms = [] } = useSchoolTerms(
    currentAcademicYear ? { academic_year: currentAcademicYear.id } : undefined,
  );
  const localPeriod = {
    ...localCalendarPeriod,
    term: getSchoolTermForDate(currentSchoolTerms, localCalendarPeriod.date, localCalendarPeriod.term),
  };
  const currentLocalYear = localPeriod.year;
  const currentLocalTerm = localPeriod.term;
  const [selectedYear, setSelectedYear] = useState(() => getLocalSchoolPeriod().year);
  const [selectedTerm, setSelectedTerm] = useState(() => getLocalSchoolPeriod().term);
  const [selectedReportType, setSelectedReportType] = useState<Exam["report_type"]>(
    () => getReportTypeForTerm(getLocalSchoolPeriod().term),
  );
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ReportViewMode>("class");
  const [showOnlyMissingTeacherComments, setShowOnlyMissingTeacherComments] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("pdf");
  const [isExporting, setIsExporting] = useState(false);
  const [printStudentIds, setPrintStudentIds] = useState<number[]>([]);
  const [principalCommentDrafts, setPrincipalCommentDrafts] = useState<Record<number, string>>({});
  const updateExam = useUpdateExam();
  const regenerateSnapshot = useRegenerateAttendanceSnapshot();
  const updateReportReview = useUpdateReportCardReview();
  const previousLocalPeriod = useRef(localPeriod);

  const reportExams = useMemo(
    () => exams.slice().sort((a, b) => b.start_date.localeCompare(a.start_date)),
    [exams],
  );
  useEffect(() => {
    const previousPeriod = previousLocalPeriod.current;
    if (previousPeriod.year !== currentLocalYear) {
      setSelectedYear(current => current === previousPeriod.year ? currentLocalYear : current);
    }
    if (previousPeriod.term !== currentLocalTerm) {
      setSelectedTerm(current => current === previousPeriod.term ? currentLocalTerm : current);
      setSelectedReportType(current => (
        current === getReportTypeForTerm(previousPeriod.term)
          ? getReportTypeForTerm(currentLocalTerm)
          : current
      ));
    }
    previousLocalPeriod.current = { ...previousPeriod, year: currentLocalYear, term: currentLocalTerm };
  }, [currentLocalYear, currentLocalTerm]);
  const yearOptions = getReportYearOptions(reportExams, localPeriod.year);
  const termOptions = getReportTermOptions(reportExams, selectedYear);
  const visibleExams = reportExams.filter(exam => (
    exam.year.trim() === selectedYear
    && exam.term.trim().toLowerCase() === selectedTerm.trim().toLowerCase()
    && exam.report_type === selectedReportType
  ));
  const selectedExam = visibleExams.find((exam) => exam.id === selectedExamId) ?? visibleExams[0];
  const { data: attendanceSnapshots = [] } = useAttendanceReportSnapshots(selectedExam?.id);
  const { data: marks = [], isLoading: loadingMarks, error: marksError } = useExamMarks({ exam: selectedExam?.id });
  const { data: reportReviews = [], isLoading: loadingReportReviews, error: reportReviewsError } = useReportCardReviews(selectedExam?.id);
  const classOptions = classes;
  const defaultClassId = classOptions.find((schoolClass) => selectedExam?.classes.includes(schoolClass.id))?.id
    ?? classOptions[0]?.id
    ?? null;
  const activeClassId = classOptions.some((schoolClass) => schoolClass.id === selectedClassId)
    ? selectedClassId
    : defaultClassId;
  const subjectOptions = subjects.filter((subject) => selectedExam?.subjects.includes(subject.id));
  const activeSubjectId = subjectOptions.some((subject) => subject.id === selectedSubjectId)
    ? selectedSubjectId
    : subjectOptions[0]?.id ?? null;

  const reports = useMemo<StudentReport[]>(() => {
    const snapshotByStudent = new Map(attendanceSnapshots.map((snapshot) => [snapshot.student, snapshot]));
    const reviewsByStudent = new Map(reportReviews.map((review) => [review.student, review]));
    const marksByStudent = new Map<number, ExamMark[]>();
    const classStudentIds = new Set(students
      .filter((student) => Number(student.school_class) === activeClassId)
      .map((student) => student.id));
    marks.filter((mark) => (
      classStudentIds.has(mark.student)
      && (viewMode === "class" || Number(mark.subject) === activeSubjectId)
    )).forEach((mark) => {
      const studentMarks = marksByStudent.get(mark.student) ?? [];
      studentMarks.push(mark);
      marksByStudent.set(mark.student, studentMarks);
    });

    return students
      .filter((student) => Number(student.school_class) === activeClassId && marksByStudent.has(student.id))
      .map((student) => {
        const studentMarks = (marksByStudent.get(student.id) ?? []).sort((a, b) => a.subject_name.localeCompare(b.subject_name));
        const percentages = studentMarks.map((mark) => mark.total_marks > 0 ? (Number(mark.scored) / mark.total_marks) * 100 : 0);
        const snapshot = snapshotByStudent.get(student.id);
        return {
          student,
          marks: studentMarks,
          average: percentages.length ? percentages.reduce((sum, percentage) => sum + percentage, 0) / percentages.length : 0,
          attendance: snapshot && !snapshot.is_out_of_date && snapshot.summary.total_school_days > 0
            ? mapAttendanceSnapshot(snapshot.summary, snapshot.is_out_of_date)
            : selectedExam
              ? {
                ...getReportAttendance(selectedExam, student.id, attendanceRecords),
                isOutOfDate: Boolean(snapshot?.is_out_of_date),
              }
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
            },
          attendanceSnapshotId: snapshot?.id,
          review: reviewsByStudent.get(student.id),
        };
      })
      .sort((a, b) => a.student.name.localeCompare(b.student.name));
  }, [activeClassId, activeSubjectId, attendanceRecords, attendanceSnapshots, marks, reportReviews, selectedExam, students, viewMode]);

  const analysis = useMemo(() => {
    const grades = new Map<string, number>();
    ["A", "B", "C", "D", "E", "U"].forEach((grade) => grades.set(grade, 0));
    const subjectTotals = new Map<number, { name: string; total: number; count: number }>();
    reports.forEach((report) => {
      const grade = calculateGrade(report.average).grade;
      grades.set(grade, (grades.get(grade) ?? 0) + 1);
      report.marks.forEach((mark) => {
        const entry = subjectTotals.get(mark.subject) ?? { name: mark.subject_name, total: 0, count: 0 };
        entry.total += mark.total_marks > 0 ? (Number(mark.scored) / mark.total_marks) * 100 : 0;
        entry.count += 1;
        subjectTotals.set(mark.subject, entry);
      });
    });
    const averages = reports.map((report) => report.average);
    const passCount = averages.filter((average) => average >= 40).length;
    const topScorer = reports.reduce<StudentReport | null>(
      (top, report) => !top || report.average > top.average ? report : top,
      null,
    );
    return {
      grades: Array.from(grades, ([grade, learners]) => ({ grade, learners })),
      subjectAverages: Array.from(subjectTotals, ([subject, result]) => ({
        subject: result.name,
        average: result.count ? Number((result.total / result.count).toFixed(1)) : 0,
        id: subject,
      })).sort((a, b) => a.subject.localeCompare(b.subject)),
      average: averages.length ? averages.reduce((sum, average) => sum + average, 0) / averages.length : 0,
      passRate: averages.length ? (passCount / averages.length) * 100 : 0,
      topScorer,
      gradedLearners: averages.length,
    };
  }, [reports]);
  const missingTeacherCommentCount = reports.filter(
    report => !report.review?.class_teacher_comment.trim(),
  ).length;
  const savedUnsubmittedTeacherCommentCount = reports.filter(
    report => Boolean(report.review?.class_teacher_comment.trim()) && !report.review?.class_teacher_submitted_at,
  ).length;
  const displayedReports = showOnlyMissingTeacherComments
    ? reports.filter(report => !report.review?.class_teacher_comment.trim())
    : reports;

  const togglePublication = async () => {
    if (!selectedExam) return;
    const publish = !selectedExam.results_published;
    if (publish && !window.confirm("Unlock and publish these verified report cards to the student portal?")) return;
    if (publish && reportReviews.length > 0) {
      const reviewsByStudent = new Map(reportReviews.map(review => [review.student, review]));
      const learnersAwaitingReview = Array.from(new Set(marks.map(mark => mark.student))).filter(studentId => {
        const review = reviewsByStudent.get(studentId);
        return !review?.class_teacher_submitted_at || !review.principal_comment.trim();
      });
      if (learnersAwaitingReview.length > 0) {
        toast.error(`${learnersAwaitingReview.length} marked learner report(s) still need class-teacher submission and principal comments.`);
        return;
      }
    }
    try {
      await updateExam.mutateAsync({
        id: selectedExam.id,
        data: {
          results_published: publish,
          ...(publish ? { status: "completed" as const } : {}),
        },
      });
      toast.success(publish ? "Report cards unlocked for students" : "Report cards locked from students");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const startPrint = (studentIds: number[]) => {
    if (!studentIds.length) {
      toast.error("There are no student results to print for this exam.");
      return;
    }
    setPrintStudentIds(studentIds);
    document.body.classList.add("printing-admin-report-cards");
    const cleanup = () => {
      document.body.classList.remove("printing-admin-report-cards");
      setPrintStudentIds([]);
    };
    window.addEventListener("afterprint", cleanup, { once: true });
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => window.print()));
  };

  const downloadCsv = () => {
    if (!selectedExam || reports.length === 0) return;
    const headers = ["Report Type", "Student", "Student ID", "Class", "Term", "Year", "Examination", "Subject", "Score", "Out of", "Percentage", "Grade", "Teacher Subject Comment", "Class Teacher Comment", "Principal Comment", "Attendance marked days", "Present", "Unexcused absent", "Excused", "Late", "Sick bay", "Suspended", "Absent dates"];
    const rows = reports.flatMap((report) => report.marks.map((mark) => {
      const percentage = mark.total_marks > 0 ? (Number(mark.scored) / mark.total_marks) * 100 : 0;
      const className = report.student.class_name || classes.find((schoolClass) => schoolClass.id === report.student.school_class)?.name || "";
      return [getReportTypeLabel(selectedExam), report.student.name, report.student.student_id, className, selectedExam.term, selectedExam.year, getExamDisplayName(selectedExam), mark.subject_name, mark.scored, mark.total_marks, `${percentage.toFixed(1)}%`, calculateGrade(percentage).grade, mark.comment || "", report.review?.class_teacher_comment || "", report.review?.principal_comment || "", report.attendance.totalDays, report.attendance.present, report.attendance.absent, report.attendance.excused, report.attendance.late, report.attendance.sickBay, report.attendance.suspended, report.attendance.absentDates.join(", ")];
    }));
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    const subjectLabel = viewMode === "class"
      ? "All_Subjects"
      : subjectOptions.find((subject) => subject.id === activeSubjectId)?.name ?? "Subject";
    anchor.download = `${safeFilePart(selectedExam.term)}_${selectedExam.year}_${safeFilePart(classOptions.find((schoolClass) => schoolClass.id === activeClassId)?.name ?? "Class")}_${safeFilePart(subjectLabel)}_Report_Cards.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const downloadPdf = () => {
    if (!selectedExam || reports.length === 0) return;
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const left = 14;
    const right = pageWidth - 14;

    reports.forEach((report, reportIndex) => {
      if (reportIndex > 0) pdf.addPage();
      pdf.setTextColor(20, 35, 79);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(17);
      pdf.text("ABLE GOD COLLEGE", pageWidth / 2, 18, { align: "center" });
      pdf.setFontSize(12);
      pdf.text(getReportHeading(selectedExam).toUpperCase(), pageWidth / 2, 26, { align: "center" });
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.text(`${getReportTypeLabel(selectedExam)} · ${getExamDisplayName(selectedExam)}`, pageWidth / 2, 32, { align: "center", maxWidth: right - left });
      pdf.setDrawColor(185, 30, 100);
      pdf.line(left, 35, right, 35);

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Student: ${report.student.name}`, left, 44);
      pdf.text(`Student ID: ${report.student.student_id || "—"}`, left, 51);
      pdf.text(`Class: ${report.student.class_name || classes.find((schoolClass) => schoolClass.id === report.student.school_class)?.name || "—"}`, left, 58);
      pdf.text(`Term: ${selectedExam.term} ${selectedExam.year}`, right, 44, { align: "right" });
      pdf.text(`Exam: ${getExamDisplayName(selectedExam)}`, right, 51, { align: "right" });
      pdf.text(`Subjects: ${report.marks.length}`, right, 58, { align: "right" });

      let y = 66;
      pdf.setFillColor(20, 43, 86);
      pdf.rect(left, y, right - left, 8, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.text("Subject", left + 2, y + 5.5);
      pdf.text("Score", 86, y + 5.5, { align: "right" });
      pdf.text("Out of", 105, y + 5.5, { align: "right" });
      pdf.text("Percent", 128, y + 5.5, { align: "right" });
      pdf.text("Grade", 147, y + 5.5, { align: "right" });
      pdf.text("Comment", 154, y + 5.5);
      y += 8;

      const rowHeight = Math.min(8, Math.max(5.5, (pageHeight - y - 70) / Math.max(report.marks.length, 1)));
      pdf.setTextColor(30, 35, 55);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      report.marks.forEach((mark, index) => {
        const percentage = mark.total_marks > 0 ? (Number(mark.scored) / mark.total_marks) * 100 : 0;
        if (index % 2 === 1) {
          pdf.setFillColor(246, 242, 247);
          pdf.rect(left, y, right - left, rowHeight, "F");
        }
        pdf.text(pdf.splitTextToSize(mark.subject_name, 40)[0], left + 2, y + rowHeight * 0.7);
        pdf.text(String(mark.scored), 86, y + rowHeight * 0.7, { align: "right" });
        pdf.text(String(mark.total_marks), 105, y + rowHeight * 0.7, { align: "right" });
        pdf.text(`${percentage.toFixed(1)}%`, 128, y + rowHeight * 0.7, { align: "right" });
        pdf.text(calculateGrade(percentage).grade, 147, y + rowHeight * 0.7, { align: "right" });
        pdf.setFontSize(7);
        pdf.text(
          pdf.splitTextToSize(mark.comment?.trim() || calculateGrade(percentage).meaning, right - 156)[0],
          154,
          y + rowHeight * 0.7,
        );
        pdf.setFontSize(9);
        y += rowHeight;
      });

      y += 12;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(20, 35, 79);
      pdf.text(`Average: ${report.average.toFixed(1)}%`, left, y);
      pdf.text(`Overall grade: ${calculateGrade(report.average).grade}`, right, y, { align: "right" });
      y += 10;
      const attendanceLines = pdf.splitTextToSize(
        `Attendance through ${report.attendance.throughDate}: ${report.attendance.totalDays} marked days · ${report.attendance.present} present · ${report.attendance.absent} unexcused absent · ${report.attendance.excused} excused · ${report.attendance.late} late · ${report.attendance.unrecorded} unmarked of ${report.attendance.schoolDays} scheduled school days`,
        right - left,
      );
      pdf.setFontSize(8);
      pdf.text(attendanceLines, left, y);
      y += attendanceLines.length * 4 + 2;
      const absentDatesText = `Absent dates: ${report.attendance.absentDates.length ? report.attendance.absentDates.join(", ") : "none recorded"}`;
      const absentDateLines = pdf.splitTextToSize(absentDatesText, right - left);
      pdf.text(absentDateLines, left, y);
      y += absentDateLines.length * 4 + 4;
      const reportComments = [
        ...(report.review?.class_teacher_comment ? [[report.review.class_teacher_comment, "Class Teacher's comment"] as const] : []),
        ...(report.review?.principal_comment ? [[report.review.principal_comment, "Principal comment"] as const] : []),
      ];
      if (reportComments.length) {
        pdf.setFontSize(9);
        reportComments.forEach(([text, label]) => {
          const lines = pdf.splitTextToSize(`${label}: ${text}`, right - left);
          if (y + lines.length * 4 >= pageHeight - 20) {
            pdf.addPage();
            y = 18;
          }
          pdf.setFont("helvetica", "normal");
          pdf.text(lines, left, y);
          y += lines.length * 4 + 2;
        });
      }
      pdf.setFontSize(9);
      pdf.setTextColor(110, 110, 120);
      pdf.text(
        `Issued ${getIssueStamp(selectedExam)} · ${selectedExam.results_published ? "Available in the student portal" : "Not yet released to the student portal"}`,
        left,
        pageHeight - 12,
      );
    });

    const subjectLabel = viewMode === "class"
      ? "All_Subjects"
      : subjectOptions.find((subject) => subject.id === activeSubjectId)?.name ?? "Subject";
    pdf.save(`${safeFilePart(selectedExam.term)}_${selectedExam.year}_${safeFilePart(classOptions.find((schoolClass) => schoolClass.id === activeClassId)?.name ?? "Class")}_${safeFilePart(subjectLabel)}_Report_Cards.pdf`);
  };

  const generateReport = async () => {
    if (!selectedExam || reports.length === 0) return;
    setIsExporting(true);
    try {
      if (exportFormat === "csv") downloadCsv();
      else if (typeof window.print === "function") startPrint(reports.map((report) => report.student.id));
      else downloadPdf();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not generate the report.");
    } finally {
      setIsExporting(false);
    }
  };

  const printedReports = reports
    .filter((report) => printStudentIds.includes(report.student.id))
    .map((report) => {
      const studentMarks = marks
        .filter((mark) => mark.student === report.student.id)
        .sort((first, second) => first.subject_name.localeCompare(second.subject_name));
      const percentages = studentMarks.map((mark) => (
        mark.total_marks > 0 ? (Number(mark.scored) / mark.total_marks) * 100 : 0
      ));
      return {
        ...report,
        marks: studentMarks,
        average: percentages.length
          ? percentages.reduce((sum, percentage) => sum + percentage, 0) / percentages.length
          : 0,
      };
    });

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-5 shadow-elegant sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Results are delivered through the student portal</p>
            <h2 className="mt-1 font-heading text-2xl font-bold text-foreground">Report Cards</h2>
            <p className="mt-1 text-sm text-muted-foreground">Review marks for one class and subject at a time. Teacher submissions are grouped by their exam, class, and subject.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Report card type"
              value={selectedReportType}
              onChange={(event) => {
                const nextType = event.target.value as Exam["report_type"];
                setSelectedReportType(nextType);
                const impliedTerm = getTermForReportType(nextType);
                if (impliedTerm) setSelectedTerm(impliedTerm);
                setSelectedExamId(null);
                setSelectedClassId(null);
              }}
              className="min-h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            >
              {EXAM_REPORT_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
            </select>
            <select
              aria-label="Report card year"
              value={selectedYear}
              onChange={(event) => {
                setSelectedYear(event.target.value);
                setSelectedExamId(null);
                setSelectedClassId(null);
              }}
              className="min-h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            >
              {yearOptions.map(({ year, isFuture }) => (
                <option key={year} value={year} disabled={isFuture}>
                  {year}{isFuture ? " (not available yet)" : ""}
                </option>
              ))}
            </select>
            <select
              aria-label="Report card term"
              value={selectedTerm}
              onChange={(event) => {
                const nextTerm = event.target.value;
                setSelectedTerm(nextTerm);
                if (getTermForReportType(selectedReportType)) {
                  setSelectedReportType(getReportTypeForTerm(nextTerm));
                }
                setSelectedExamId(null);
                setSelectedClassId(null);
              }}
              className="min-h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            >
              {termOptions.map(term => <option key={term} value={term}>{term}</option>)}
            </select>
            <select
              aria-label="Report card examination"
              value={selectedExam?.id ?? ""}
              onChange={(event) => {
                setSelectedExamId(Number(event.target.value));
                setSelectedClassId(null);
              }}
              disabled={visibleExams.length === 0}
              className="min-h-10 max-w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground disabled:opacity-60"
            >
              {visibleExams.length === 0 && <option value="">No reports for this selection</option>}
              {visibleExams.map((exam) => <option key={exam.id} value={exam.id}>{getExamLabel(exam)}</option>)}
            </select>
            <select
              aria-label="Report card class"
              value={activeClassId ?? ""}
              onChange={(event) => setSelectedClassId(event.target.value ? Number(event.target.value) : null)}
              disabled={!selectedExam || classOptions.length === 0}
              className="min-h-10 max-w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground disabled:opacity-60"
            >
              {classOptions.length === 0 && <option value="">No classes</option>}
              {classOptions.map((schoolClass) => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>)}
            </select>
            {viewMode === "subject" && (
              <select
                aria-label="Report card subject"
                value={activeSubjectId ?? ""}
                onChange={(event) => setSelectedSubjectId(event.target.value ? Number(event.target.value) : null)}
                disabled={!selectedExam || subjectOptions.length === 0}
                className="min-h-10 max-w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground disabled:opacity-60"
              >
                {subjectOptions.length === 0 && <option value="">No subjects</option>}
                {subjectOptions.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
              </select>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Report card view mode">
            <Button size="sm" variant={viewMode === "class" ? "default" : "outline"} onClick={() => setViewMode("class")}>
              View by Class
            </Button>
            <Button size="sm" variant={viewMode === "subject" ? "default" : "outline"} onClick={() => setViewMode("subject")}>
              View by Subject
            </Button>
          </div>
          {selectedExam && (
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${selectedExam.results_published ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}`}>
                {selectedExam.results_published
                  ? "Unlocked · visible to students"
                  : `Locked · ${selectedExam.status === "completed" ? "verified, ready to publish" : `exam ${selectedExam.status}; unlock will complete it`}`}
              </span>
              <Button
                size="sm"
                variant={selectedExam.results_published ? "outline" : "gold"}
                onClick={() => void togglePublication()}
                disabled={marks.length === 0 || loadingMarks || loadingReportReviews || updateExam.isPending}
              >
                {selectedExam.results_published
                  ? <LockKeyhole className="mr-2 h-4 w-4" />
                  : <UnlockKeyhole className="mr-2 h-4 w-4" />}
                {selectedExam.results_published ? "Lock Report Cards" : "Unlock & Publish"}
              </Button>
            </div>
          )}
          <label htmlFor="report-export-format" className="text-sm font-medium text-foreground">Generate report as</label>
          <select
            id="report-export-format"
            value={exportFormat}
            onChange={(event) => setExportFormat(event.target.value as ExportFormat)}
            className="min-h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
          >
            <option value="pdf">PDF</option>
            <option value="csv">CSV</option>
          </select>
          <Button variant="gold" onClick={generateReport} disabled={!selectedExam || reports.length === 0 || loadingMarks || isExporting}>
            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : exportFormat === "csv" ? <FileSpreadsheet className="mr-2 h-4 w-4" /> : <Download className="mr-2 h-4 w-4" />}
            {exportFormat === "pdf" ? "Print / Save PDF" : "Generate CSV"}
          </Button>
          <Button variant="outline" onClick={() => startPrint(reports.map((report) => report.student.id))} disabled={reports.length === 0 || loadingMarks}>
            <Printer className="mr-2 h-4 w-4" /> Print All ({reports.length})
          </Button>
          <span className="ml-auto text-sm text-muted-foreground">
            {viewMode === "class" ? "All subjects" : "Selected subject"} · {reports.length} learner{reports.length === 1 ? "" : "s"}
          </span>
        </div>
      </section>

      {reports.length > 0 && (
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-elegant">
            <h3 className="font-semibold text-foreground">Class performance</h3>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-secondary/40 p-3">
                <p className="text-xs text-muted-foreground">Class average</p>
                <p className="text-lg font-bold">{analysis.average.toFixed(1)}%</p>
              </div>
              <div className="rounded-lg bg-secondary/40 p-3">
                <p className="text-xs text-muted-foreground">Pass rate (≥ 40%)</p>
                <p className="text-lg font-bold">{analysis.passRate.toFixed(0)}%</p>
              </div>
              <div className="rounded-lg bg-secondary/40 p-3">
                <p className="text-xs text-muted-foreground">Top scorer</p>
                <p className="truncate text-sm font-bold">{analysis.topScorer?.student.name ?? "—"}</p>
              </div>
              <div className="rounded-lg bg-secondary/40 p-3">
                <p className="text-xs text-muted-foreground">Graded learners</p>
                <p className="text-lg font-bold">{analysis.gradedLearners}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-elegant">
            <h3 className="font-semibold text-foreground">Grade distribution</h3>
            <div className="mt-3 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analysis.grades}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="grade" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="learners" name="Learners" fill="#b3126a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {analysis.grades.map(({ grade, learners }) => (
                <span key={grade}>{grade}: {learners} ({((learners / analysis.gradedLearners) * 100).toFixed(0)}%)</span>
              ))}
            </div>
          </div>
          {viewMode === "class" && (
            <div className="rounded-2xl border border-border bg-card p-5 shadow-elegant lg:col-span-2">
              <h3 className="font-semibold text-foreground">Subject average comparison</h3>
              <div className="mt-3 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analysis.subjectAverages} layout="vertical" margin={{ left: 16, right: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} unit="%" />
                    <YAxis type="category" dataKey="subject" width={120} />
                    <Tooltip formatter={(value) => [`${value}%`, "Average"]} />
                    <Bar dataKey="average" name="Average" fill="#17234d" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </section>
      )}

      <section className="rounded-2xl border border-border bg-card p-5 shadow-elegant sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold text-foreground">
              {selectedExam
                ? `${getExamLabel(selectedExam)} · ${classOptions.find((schoolClass) => schoolClass.id === activeClassId)?.name ?? "Select class"}${viewMode === "subject" ? ` · ${subjectOptions.find((subject) => subject.id === activeSubjectId)?.name ?? "Select subject"}` : " · All subjects"}`
                : "Report cards by class and subject"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {viewMode === "class" ? "Full student report cards across all exam subjects." : "Student results for the selected subject."}
              {" "}Printed learner reports start on separate pages.
            </p>
          </div>
        </div>

        {(loadingStudents || loadingExams || loadingMarks || loadingSubjects || loadingReportReviews) ? (
          <div className="flex items-center justify-center gap-3 py-12 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Loading published report cards…</div>
        ) : (studentsError || examsError || marksError || reportReviewsError) ? (
          <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">Could not load report cards: {getErrorMessage(studentsError || examsError || marksError || reportReviewsError)}</div>
        ) : !selectedExam ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">There are no completed exams yet. Complete and approve an exam to publish results to student portals.</div>
        ) : reports.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">No marks have been recorded for this class and subject yet.</div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background p-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${missingTeacherCommentCount ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"}`}>
                  {missingTeacherCommentCount} missing teacher comment{missingTeacherCommentCount === 1 ? "" : "s"}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${savedUnsubmittedTeacherCommentCount ? "bg-amber-100 text-amber-900" : "bg-secondary text-muted-foreground"}`}>
                  {savedUnsubmittedTeacherCommentCount} saved, not submitted
                </span>
              </div>
              <Button
                size="sm"
                variant={showOnlyMissingTeacherComments ? "default" : "outline"}
                aria-pressed={showOnlyMissingTeacherComments}
                onClick={() => setShowOnlyMissingTeacherComments(current => !current)}
              >
                {showOnlyMissingTeacherComments ? "Show all report cards" : `Show missing comments (${missingTeacherCommentCount})`}
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-border p-3">
              <p className="text-sm text-muted-foreground">
                Add a principal&apos;s comment to each report now, or wait for class-teacher comments. Principal comments can be saved before or after class reports are submitted.
              </p>
              <Button
                size="sm"
                variant="outline"
                disabled={reports.length === 0}
                onClick={() => setPrincipalCommentDrafts(current => ({
                  ...current,
                  ...Object.fromEntries(reports.map(report => [
                    report.student.id,
                    getPrincipalComment(report.average),
                  ])),
                }))}
              >
                Fill built-in comments
              </Button>
            </div>
            {displayedReports.length === 0 ? (
              <div role="status" className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
                Every report card in this view has a class-teacher comment.
              </div>
            ) : displayedReports.map((report) => (
              <article key={report.student.id} className="flex flex-col gap-3 rounded-xl border border-border bg-secondary/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{report.student.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{report.student.student_id || "No student ID"} · {report.student.class_name || classes.find((schoolClass) => schoolClass.id === report.student.school_class)?.name || "Class not set"} · Average {report.average.toFixed(1)}%</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {selectedExam.results_published ? "Available in the student portal" : "Locked from the student portal"}
                    {report.attendance.isOutOfDate ? " · Attendance snapshot needs regeneration" : ""}
                  </p>
                  <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                    !report.review?.class_teacher_comment.trim()
                      ? "bg-rose-100 text-rose-800"
                      : report.review?.class_teacher_submitted_at
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-900"
                  }`}>
                    {!report.review?.class_teacher_comment.trim()
                      ? "Teacher comment missing"
                      : report.review?.class_teacher_submitted_at
                        ? "Teacher comment submitted"
                        : "Comment saved · awaiting submission"}
                  </span>
                  {report.review?.class_teacher_comment && (
                    <p className="mt-2 text-sm"><span className="font-medium">Class teacher:</span> {report.review.class_teacher_comment}</p>
                  )}
                  <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(12rem,0.65fr)_minmax(18rem,1fr)]">
                    <select
                      aria-label={`Built-in principal comment for ${report.student.name}`}
                      value={principalCommentDrafts[report.student.id] ?? report.review?.principal_comment ?? ""}
                      onChange={(event) => setPrincipalCommentDrafts(current => ({
                        ...current,
                        [report.student.id]: event.target.value,
                      }))}
                      className="min-h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground disabled:opacity-60"
                    >
                      <option value="">Choose built-in principal comment</option>
                      {PRINCIPAL_COMMENT_LIBRARY.map((template) => (
                        <option key={template.label} value={template.text}>{template.label}</option>
                      ))}
                    </select>
                    <textarea
                      aria-label={`Principal comment for ${report.student.name}`}
                      value={principalCommentDrafts[report.student.id] ?? report.review?.principal_comment ?? ""}
                      onChange={(event) => setPrincipalCommentDrafts(current => ({
                        ...current,
                        [report.student.id]: event.target.value,
                      }))}
                      placeholder="Principal's overall comment"
                      maxLength={2000}
                      className="min-h-20 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground disabled:opacity-60"
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {report.review?.principal_reviewed_at
                        ? "Principal comment saved"
                        : report.review?.class_teacher_submitted_at
                          ? "Class report submitted · principal comment not saved"
                          : "Principal comment can be saved before class-teacher submission"}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updateReportReview.isPending}
                      onClick={async () => {
                        try {
                          await updateReportReview.mutateAsync({
                            exam: selectedExam.id,
                            student: report.student.id,
                            principal_comment: principalCommentDrafts[report.student.id] ?? report.review?.principal_comment ?? "",
                          });
                          toast.success(`Principal comment saved for ${report.student.name}`);
                        } catch (error) {
                          toast.error(getErrorMessage(error));
                        }
                      }}
                    >
                      Save principal comment
                    </Button>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {report.attendance.isOutOfDate && report.attendanceSnapshotId && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={regenerateSnapshot.isPending}
                      onClick={async () => {
                        try {
                          if (report.attendanceSnapshotId === undefined) return;
                          await regenerateSnapshot.mutateAsync(report.attendanceSnapshotId);
                          toast.success(`Attendance refreshed for ${report.student.name}`);
                        } catch (error) {
                          toast.error(getErrorMessage(error));
                        }
                      }}
                    >
                      {regenerateSnapshot.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Regenerate attendance
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => startPrint([report.student.id])}>
                    <Printer className="mr-2 h-4 w-4" /> Print this student
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {printStudentIds.length > 0 && createPortal(
        <div id="admin-report-print-root" aria-hidden="true" className="admin-report-print-root">
          {printedReports.map((report) => (
            <div className="admin-report-print-card" key={report.student.id}>
            <ReportCardSection
              key={report.student.id}
              studentId={report.student.id}
              adminPrintReport={{
                student: {
                  ...report.student,
                  class_name: report.student.class_name || classes.find((schoolClass) => schoolClass.id === report.student.school_class)?.name || "—",
                },
                exam: selectedExam!,
                marks: report.marks,
                attendance: report.attendance,
                review: report.review,
              }}
            />
            </div>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
};

export default AdminReportCardsSection;
