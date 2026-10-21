import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Download, FileSpreadsheet, Loader2, Printer } from "lucide-react";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { useExamMarks, useExams, useStudents, type Exam, type ExamMark, type SchoolClass, type Student } from "@/lib/hooks";
import { calculateGrade } from "@/lib/grading";
import { getErrorMessage } from "@/lib/api";
import { toast } from "sonner";

type ReportCategory = "current" | "past";
type ExportFormat = "pdf" | "csv";

interface StudentReport {
  student: Student;
  marks: ExamMark[];
  average: number;
}

const getPeriodKey = (exam: Exam) => `${exam.year.trim()}-${exam.term.trim().toLowerCase()}`;
const getExamLabel = (exam: Exam) => `${exam.name} · ${exam.term} ${exam.year}`;
const safeFilePart = (value: string) => value.trim().replace(/[^a-z0-9-_]+/gi, "_").replace(/^_+|_+$/g, "") || "Report";
const csvCell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;

const AdminReportCard = ({ report, exam, className }: { report: StudentReport; exam: Exam; className: string }) => (
  <article className="admin-report-page">
    <header className="admin-report-header">
      <div>
        <p className="admin-report-school">ABLE GOD COLLEGE</p>
        <h2>Student Report Card</h2>
      </div>
      <span className="admin-report-badge">Student Portal Copy</span>
    </header>

    <section className="admin-report-meta">
      <div><span>Student</span><strong>{report.student.name}</strong></div>
      <div><span>Student ID</span><strong>{report.student.student_id || "—"}</strong></div>
      <div><span>Class</span><strong>{className}</strong></div>
      <div><span>Term</span><strong>{exam.term} {exam.year}</strong></div>
      <div className="admin-report-exam"><span>Examination</span><strong>{exam.name}</strong></div>
    </section>

    <table className="admin-report-table">
      <thead>
        <tr><th>Subject</th><th>Score</th><th>Out of</th><th>Percentage</th><th>Grade</th></tr>
      </thead>
      <tbody>
        {report.marks.map((mark) => {
          const percentage = mark.total_marks > 0 ? (Number(mark.scored) / mark.total_marks) * 100 : 0;
          return (
            <tr key={mark.id}>
              <td>{mark.subject_name}</td>
              <td>{mark.scored}</td>
              <td>{mark.total_marks}</td>
              <td>{percentage.toFixed(1)}%</td>
              <td>{calculateGrade(percentage).grade}</td>
            </tr>
          );
        })}
      </tbody>
    </table>

    <div className="admin-report-summary">
      <span>Average</span>
      <strong>{report.average.toFixed(1)}%</strong>
      <span>Overall grade</span>
      <strong>{calculateGrade(report.average).grade}</strong>
    </div>
    {report.marks.some((mark) => mark.comment?.trim()) && (
      <section className="admin-report-comments">
        <h3>Teacher comments</h3>
        {report.marks.filter((mark) => mark.comment?.trim()).map((mark) => (
          <p key={mark.id}><strong>{mark.subject_name}:</strong> {mark.comment}</p>
        ))}
      </section>
    )}
    <footer className="admin-report-footer">Generated from the school portal · {new Date().toLocaleDateString("en-GB")}</footer>
  </article>
);

const AdminReportCardsSection = ({ classes }: { classes: SchoolClass[] }) => {
  const { data: students = [], isLoading: loadingStudents, error: studentsError } = useStudents();
  const { data: exams = [], isLoading: loadingExams, error: examsError } = useExams();
  const [category, setCategory] = useState<ReportCategory>("current");
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("pdf");
  const [isExporting, setIsExporting] = useState(false);
  const [printStudentIds, setPrintStudentIds] = useState<number[]>([]);

  // A completed exam is the approval and publication boundary: learners can view its results in their portal.
  const publishedExams = useMemo(
    () => exams.filter((exam) => exam.status === "completed").sort((a, b) => b.start_date.localeCompare(a.start_date)),
    [exams],
  );
  const currentPeriodKey = publishedExams[0] ? getPeriodKey(publishedExams[0]) : null;
  const visibleExams = publishedExams.filter((exam) => {
    const isCurrent = getPeriodKey(exam) === currentPeriodKey;
    return category === "current" ? isCurrent : !isCurrent;
  });
  const selectedExam = visibleExams.find((exam) => exam.id === selectedExamId) ?? visibleExams[0];
  const { data: marks = [], isLoading: loadingMarks, error: marksError } = useExamMarks({ exam: selectedExam?.id });

  const reports = useMemo<StudentReport[]>(() => {
    const marksByStudent = new Map<number, ExamMark[]>();
    marks.forEach((mark) => {
      const studentMarks = marksByStudent.get(mark.student) ?? [];
      studentMarks.push(mark);
      marksByStudent.set(mark.student, studentMarks);
    });

    return students
      .filter((student) => marksByStudent.has(student.id))
      .map((student) => {
        const studentMarks = (marksByStudent.get(student.id) ?? []).sort((a, b) => a.subject_name.localeCompare(b.subject_name));
        const percentages = studentMarks.map((mark) => mark.total_marks > 0 ? (Number(mark.scored) / mark.total_marks) * 100 : 0);
        return {
          student,
          marks: studentMarks,
          average: percentages.length ? percentages.reduce((sum, percentage) => sum + percentage, 0) / percentages.length : 0,
        };
      })
      .sort((a, b) => a.student.name.localeCompare(b.student.name));
  }, [marks, students]);

  const changeCategory = (nextCategory: ReportCategory) => {
    setCategory(nextCategory);
    const nextExam = publishedExams.find((exam) => nextCategory === "current"
      ? getPeriodKey(exam) === currentPeriodKey
      : getPeriodKey(exam) !== currentPeriodKey);
    setSelectedExamId(nextExam?.id ?? null);
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
    const headers = ["Student", "Student ID", "Class", "Term", "Year", "Examination", "Subject", "Score", "Out of", "Percentage", "Grade", "Teacher Comment"];
    const rows = reports.flatMap((report) => report.marks.map((mark) => {
      const percentage = mark.total_marks > 0 ? (Number(mark.scored) / mark.total_marks) * 100 : 0;
      const className = report.student.class_name || classes.find((schoolClass) => schoolClass.id === report.student.school_class)?.name || "";
      return [report.student.name, report.student.student_id, className, selectedExam.term, selectedExam.year, selectedExam.name, mark.subject_name, mark.scored, mark.total_marks, `${percentage.toFixed(1)}%`, calculateGrade(percentage).grade, mark.comment || ""];
    }));
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${safeFilePart(selectedExam.term)}_${selectedExam.year}_Report_Cards.csv`;
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
      pdf.text("STUDENT REPORT CARD", pageWidth / 2, 26, { align: "center" });
      pdf.setDrawColor(185, 30, 100);
      pdf.line(left, 31, right, 31);

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Student: ${report.student.name}`, left, 40);
      pdf.text(`Student ID: ${report.student.student_id || "—"}`, left, 47);
      pdf.text(`Class: ${report.student.class_name || classes.find((schoolClass) => schoolClass.id === report.student.school_class)?.name || "—"}`, left, 54);
      pdf.text(`Term: ${selectedExam.term} ${selectedExam.year}`, right, 40, { align: "right" });
      pdf.text(`Examination: ${selectedExam.name}`, right, 47, { align: "right" });

      let y = 65;
      pdf.setFillColor(20, 43, 86);
      pdf.rect(left, y, right - left, 8, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.text("Subject", left + 2, y + 5.5);
      pdf.text("Score", 107, y + 5.5, { align: "right" });
      pdf.text("Out of", 127, y + 5.5, { align: "right" });
      pdf.text("Percent", 153, y + 5.5, { align: "right" });
      pdf.text("Grade", right - 2, y + 5.5, { align: "right" });
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
        pdf.text(pdf.splitTextToSize(mark.subject_name, 72)[0], left + 2, y + rowHeight * 0.7);
        pdf.text(String(mark.scored), 107, y + rowHeight * 0.7, { align: "right" });
        pdf.text(String(mark.total_marks), 127, y + rowHeight * 0.7, { align: "right" });
        pdf.text(`${percentage.toFixed(1)}%`, 153, y + rowHeight * 0.7, { align: "right" });
        pdf.text(calculateGrade(percentage).grade, right - 2, y + rowHeight * 0.7, { align: "right" });
        y += rowHeight;
      });

      y += 12;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(20, 35, 79);
      pdf.text(`Average: ${report.average.toFixed(1)}%`, left, y);
      pdf.text(`Overall grade: ${calculateGrade(report.average).grade}`, right, y, { align: "right" });
      y += 10;
      const comments = report.marks.filter((mark) => mark.comment?.trim());
      if (comments.length && y < pageHeight - 30) {
        pdf.setFontSize(9);
        pdf.text("Teacher comments", left, y);
        y += 5;
        pdf.setFont("helvetica", "normal");
        comments.slice(0, 4).forEach((mark) => {
          const comment = pdf.splitTextToSize(`${mark.subject_name}: ${mark.comment}`, right - left);
          if (y + comment.length * 4 < pageHeight - 20) {
            pdf.text(comment, left, y);
            y += comment.length * 4 + 2;
          }
        });
      }
      pdf.setFontSize(9);
      pdf.setTextColor(110, 110, 120);
      pdf.text(`Generated ${new Date().toLocaleDateString("en-GB")} · Available in the student portal`, left, pageHeight - 12);
    });

    pdf.save(`${safeFilePart(selectedExam.term)}_${selectedExam.year}_Report_Cards.pdf`);
  };

  const generateReport = async () => {
    if (!selectedExam || reports.length === 0) return;
    setIsExporting(true);
    try {
      if (exportFormat === "csv") downloadCsv();
      else downloadPdf();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not generate the report.");
    } finally {
      setIsExporting(false);
    }
  };

  const printedReports = reports.filter((report) => printStudentIds.includes(report.student.id));

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-5 shadow-elegant sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Results are delivered through the student portal</p>
            <h2 className="mt-1 font-heading text-2xl font-bold text-foreground">Report Cards</h2>
            <p className="mt-1 text-sm text-muted-foreground">Only completed exams appear here. Completing an exam publishes its approved results to student dashboards.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Report card term category"
              value={category}
              onChange={(event) => changeCategory(event.target.value as ReportCategory)}
              className="min-h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="current">Current Term</option>
              <option value="past">Past Report Cards</option>
            </select>
            <select
              aria-label="Report card examination"
              value={selectedExam?.id ?? ""}
              onChange={(event) => setSelectedExamId(Number(event.target.value))}
              disabled={visibleExams.length === 0}
              className="min-h-10 max-w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground disabled:opacity-60"
            >
              {visibleExams.length === 0 && <option value="">No reports in this category</option>}
              {visibleExams.map((exam) => <option key={exam.id} value={exam.id}>{getExamLabel(exam)}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4">
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
            Generate {exportFormat.toUpperCase()}
          </Button>
          <Button variant="outline" onClick={() => startPrint(reports.map((report) => report.student.id))} disabled={reports.length === 0 || loadingMarks}>
            <Printer className="mr-2 h-4 w-4" /> Print All ({reports.length})
          </Button>
          <span className="ml-auto text-sm text-muted-foreground">Portal published · {reports.length} student{reports.length === 1 ? "" : "s"}</span>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-elegant sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold text-foreground">{selectedExam ? getExamLabel(selectedExam) : "Published report cards"}</h3>
            <p className="mt-1 text-sm text-muted-foreground">Each printed report card starts on a separate page.</p>
          </div>
        </div>

        {(loadingStudents || loadingExams || loadingMarks) ? (
          <div className="flex items-center justify-center gap-3 py-12 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Loading published report cards…</div>
        ) : (studentsError || examsError || marksError) ? (
          <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">Could not load report cards: {getErrorMessage(studentsError || examsError || marksError)}</div>
        ) : !selectedExam ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">There are no completed exams yet. Complete and approve an exam to publish results to student portals.</div>
        ) : reports.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">No marks have been recorded for this exam yet.</div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <article key={report.student.id} className="flex flex-col gap-3 rounded-xl border border-border bg-secondary/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{report.student.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{report.student.student_id || "No student ID"} · {report.student.class_name || classes.find((schoolClass) => schoolClass.id === report.student.school_class)?.name || "Class not set"} · Average {report.average.toFixed(1)}%</p>
                  <p className="mt-1 text-xs text-muted-foreground">Available in the student portal</p>
                </div>
                <Button variant="outline" size="sm" className="shrink-0" onClick={() => startPrint([report.student.id])}>
                  <Printer className="mr-2 h-4 w-4" /> Print this student
                </Button>
              </article>
            ))}
          </div>
        )}
      </section>

      {printStudentIds.length > 0 && createPortal(
        <div id="admin-report-print-root" aria-hidden="true">
          {printedReports.map((report) => (
            <AdminReportCard
              key={report.student.id}
              report={report}
              exam={selectedExam!}
              className={report.student.class_name || classes.find((schoolClass) => schoolClass.id === report.student.school_class)?.name || "—"}
            />
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
};

export default AdminReportCardsSection;
