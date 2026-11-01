import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import jsPDF from "jspdf";
import { Download, Eye, FileText, Loader2, Printer } from "lucide-react";
import { getErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { calculateGrade } from "@/lib/grading";
import { fetchAllPages, useExamMarks, useStudents } from "@/lib/hooks";
import { drawSchoolLetterhead, loadSchoolLogoDataUrl } from "@/lib/pdfBranding";

interface Submission {
  id: number;
  exam: number;
  subject: number;
  school_class: number;
  exam_name: string;
  subject_name: string;
  class_name: string;
  teacher_name: string;
  note: string;
  submitted_at: string;
}

const MarkSubmissionsSection = () => {
  const { data = [], isLoading, error } = useQuery({
    queryKey: ["mark-submissions"],
    queryFn: () => fetchAllPages<Submission>("/exams/mark-submissions/"),
    refetchInterval: 30000,
  });
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const selectedSubmission = data.find((submission) => submission.id === selectedSubmissionId);
  const { data: students = [], isLoading: loadingStudents, error: studentsError } = useStudents();
  const { data: allMarks = [], isLoading: loadingMarks, error: marksError } = useExamMarks(
    selectedSubmission
      ? {
          exam: selectedSubmission.exam,
          subject: selectedSubmission.subject,
          school_class: selectedSubmission.school_class,
        }
      : undefined
  );

  const classStudents = useMemo(() => {
    if (!selectedSubmission) return [];
    const fromRoster = students.filter(
      (student) => Number(student.school_class) === Number(selectedSubmission.school_class)
    );
    const rosterIds = new Set(fromRoster.map((s) => s.id));
    const knownStudentIds = new Set(students.map((student) => student.id));
    const extraStudents = allMarks
      .filter((m) => !rosterIds.has(m.student) && !knownStudentIds.has(m.student))
      .map((m) => ({
        id: m.student,
        name: m.student_name || `Learner #${m.student}`,
        school_class: selectedSubmission.school_class,
        class_name: selectedSubmission.class_name,
        student_id: "",
        gender: "",
        status: "Active" as const,
      }));
    return [...fromRoster, ...extraStudents].sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedSubmission, students, allMarks]);

  const marksByStudent = useMemo(() => {
    return new Map(allMarks.map((mark) => [mark.student, mark]));
  }, [allMarks]);

  const scoredMarks = classStudents
    .map((s) => marksByStudent.get(s.id))
    .filter((m): m is NonNullable<typeof m> => m !== undefined && m.total_marks > 0);

  const stats = useMemo(() => {
    if (scoredMarks.length === 0) return null;
    const scores = scoredMarks.map((m) => (Number(m.scored) / m.total_marks) * 100);
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const passCount = scores.filter((score) => score >= 40).length;
    const passRate = Math.round((passCount / scores.length) * 100);
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);
    return {
      average: average.toFixed(1),
      passRate,
      passCount,
      totalMarked: scores.length,
      highest: highest.toFixed(1),
      lowest: lowest.toFixed(1),
    };
  }, [scoredMarks]);

  const handleOpenReview = (submissionId: number) => {
    setSelectedSubmissionId(submissionId);
    setIsModalOpen(true);
  };

  const handleDownloadPdf = async () => {
    if (!selectedSubmission) return;
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const left = 14;
    const right = pageWidth - left;
    const width = right - left;
    const schoolLogo = await loadSchoolLogoDataUrl();
    const issuedAt = new Date().toLocaleDateString("en-GB");

    drawSchoolLetterhead(
      doc,
      schoolLogo,
      "OFFICIAL EXAMINATION MARK SHEET",
      `${selectedSubmission.class_name} · ${selectedSubmission.subject_name} · ${selectedSubmission.exam_name} · ${selectedSubmission.teacher_name} · ${issuedAt}`,
    );
    let y = 44;

    if (stats) {
      doc.setFillColor(248, 246, 250);
      doc.setDrawColor(230, 220, 235);
      doc.roundedRect(left, y, width, 14, 2, 2, "FD");
      doc.setTextColor(23, 36, 76);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(`Learners marked: ${stats.totalMarked} of ${classStudents.length}`, left + 4, y + 8.5);
      doc.text(`Class average: ${stats.average}%`, left + 68, y + 8.5);
      doc.setTextColor(179, 22, 105);
      doc.text(`Pass rate: ${stats.passRate}% (${stats.passCount} passed)`, right - 4, y + 8.5, { align: "right" });
      y += 18;
    }

    doc.setFillColor(20, 35, 79);
    doc.roundedRect(left, y, width, 8, 1.2, 1.2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("#", left + 5, y + 5.2, { align: "center" });
    doc.text("Learner", left + 12, y + 5.2);
    doc.text("Score", left + 88, y + 5.2, { align: "center" });
    doc.text("Out Of", left + 108, y + 5.2, { align: "center" });
    doc.text("Percent", left + 128, y + 5.2, { align: "center" });
    doc.text("Grade", left + 148, y + 5.2, { align: "center" });
    doc.text("Comment", left + 160, y + 5.2);
    y += 8;

    const rowHeight = 7.5;
    classStudents.forEach((student, index) => {
      if (y + rowHeight > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }
      const mark = marksByStudent.get(student.id);
      const percentage = mark && mark.total_marks > 0 ? (Number(mark.scored) / mark.total_marks) * 100 : null;
      if (index % 2 === 1) {
        doc.setFillColor(247, 244, 248);
        doc.rect(left, y, width, rowHeight, "F");
      }
      doc.setTextColor(40, 40, 45);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(String(index + 1), left + 5, y + 5, { align: "center" });
      doc.text(doc.splitTextToSize(student.name, 70)[0], left + 12, y + 5);
      doc.text(mark ? String(mark.scored) : "—", left + 88, y + 5, { align: "center" });
      doc.text(mark ? String(mark.total_marks) : "—", left + 108, y + 5, { align: "center" });
      doc.text(percentage !== null ? `${percentage.toFixed(1)}%` : "—", left + 128, y + 5, { align: "center" });
      doc.setFont("helvetica", "bold");
      doc.text(percentage !== null ? calculateGrade(percentage).grade : "—", left + 148, y + 5, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.text(mark?.comment ? doc.splitTextToSize(mark.comment, 40)[0] : "—", left + 160, y + 5);
      y += rowHeight;
    });

    doc.save(`${selectedSubmission.class_name}_${selectedSubmission.subject_name}_Mark_Sheet.pdf`.replace(/\s+/g, "_"));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="font-heading text-lg font-bold text-foreground">Submitted Mark Sheets</h2>
          <p className="text-xs text-muted-foreground">Teacher mark sheets submitted for verification and administrative review.</p>
        </div>
        <Badge variant="outline" className="w-fit">{data.length} submission{data.length === 1 ? "" : "s"}</Badge>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading teacher mark sheet submissions…
        </div>
      ) : error ? (
        <p role="alert" className="text-sm text-destructive">Could not load teacher submissions: {getErrorMessage(error)}</p>
      ) : data.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground italic">
          No teacher has submitted marks yet. When teachers click &quot;Submit to admin&quot; on their mark sheets, they appear here for verification.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60">
              <tr>
                <th className="px-3 py-2.5 text-left font-semibold">Teacher</th>
                <th className="px-3 py-2.5 text-left font-semibold">Class</th>
                <th className="px-3 py-2.5 text-left font-semibold">Subject</th>
                <th className="px-3 py-2.5 text-left font-semibold">Exam</th>
                <th className="px-3 py-2.5 text-left font-semibold">Submission Note</th>
                <th className="px-3 py-2.5 text-left font-semibold">Submitted</th>
                <th className="px-3 py-2.5 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((s) => (
                <tr key={s.id} className="hover:bg-muted/40 transition-colors">
                  <td className="px-3 py-2.5 font-medium text-foreground">{s.teacher_name}</td>
                  <td className="px-3 py-2.5">{s.class_name}</td>
                  <td className="px-3 py-2.5">{s.subject_name}</td>
                  <td className="px-3 py-2.5">{s.exam_name}</td>
                  <td className="px-3 py-2.5 text-muted-foreground text-xs">{s.note || "Standard submission"}</td>
                  <td className="px-3 py-2.5 text-muted-foreground text-xs">{new Date(s.submitted_at).toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-right">
                    <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => handleOpenReview(s.id)}>
                      <Eye className="h-3.5 w-3.5" /> View marks
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Review Dialog Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <DialogTitle className="text-xl font-bold text-foreground">
                  {selectedSubmission?.class_name} · {selectedSubmission?.subject_name}
                </DialogTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Exam: <span className="font-semibold text-foreground">{selectedSubmission?.exam_name}</span> ·
                  Submitted by: <span className="font-semibold text-foreground">{selectedSubmission?.teacher_name}</span> ·
                  {selectedSubmission ? new Date(selectedSubmission.submitted_at).toLocaleDateString("en-GB") : ""}
                </p>
              </div>
            </div>
          </DialogHeader>

          {loadingMarks || loadingStudents ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading submitted marks for this class and subject…
            </div>
          ) : marksError || studentsError ? (
            <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              Could not load submitted marks: {getErrorMessage(marksError || studentsError)}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Analytics KPI Badges */}
              {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 rounded-xl border border-border bg-secondary/30 p-3.5 text-center">
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase font-semibold">Marked</p>
                    <p className="text-lg font-bold text-foreground">{stats.totalMarked} / {classStudents.length}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase font-semibold">Average</p>
                    <p className="text-lg font-bold text-primary">{stats.average}%</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase font-semibold">Pass Rate</p>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{stats.passRate}%</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase font-semibold">Highest</p>
                    <p className="text-lg font-bold text-foreground">{stats.highest}%</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase font-semibold">Lowest</p>
                    <p className="text-lg font-bold text-foreground">{stats.lowest}%</p>
                  </div>
                </div>
              )}

              {/* Marks Table */}
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/60">
                    <tr>
                      <th className="px-3 py-2 text-left w-10 font-semibold">#</th>
                      <th className="px-3 py-2 text-left font-semibold">Learner</th>
                      <th className="px-3 py-2 text-right font-semibold">Score</th>
                      <th className="px-3 py-2 text-right font-semibold">Out of</th>
                      <th className="px-3 py-2 text-right font-semibold">Percent</th>
                      <th className="px-3 py-2 text-center font-semibold">Grade</th>
                      <th className="px-3 py-2 text-left font-semibold">Teacher Comment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {classStudents.map((student, idx) => {
                      const mark = marksByStudent.get(student.id);
                      const percentage = mark && mark.total_marks > 0 ? (Number(mark.scored) / mark.total_marks) * 100 : null;
                      const grade = percentage !== null ? calculateGrade(percentage).grade : "—";
                      return (
                        <tr key={student.id} className="odd:bg-card even:bg-secondary/15">
                          <td className="px-3 py-2 text-muted-foreground text-xs">{idx + 1}</td>
                          <td className="px-3 py-2 font-medium text-foreground">{student.name}</td>
                          <td className="px-3 py-2 text-right font-semibold">{mark?.scored ?? "—"}</td>
                          <td className="px-3 py-2 text-right text-muted-foreground">{mark?.total_marks ?? "—"}</td>
                          <td className="px-3 py-2 text-right font-medium">{percentage !== null ? `${percentage.toFixed(1)}%` : "—"}</td>
                          <td className="px-3 py-2 text-center">
                            <Badge
                              variant={grade === "A" ? "default" : grade === "U" ? "destructive" : "secondary"}
                              className="text-xs"
                            >
                              {grade}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-muted-foreground text-xs italic">{mark?.comment || "—"}</td>
                        </tr>
                      );
                    })}
                    {classStudents.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground italic">
                          No learners are enrolled in this class.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleDownloadPdf} disabled={!selectedSubmission || classStudents.length === 0}>
                <Download className="h-4 w-4 mr-1.5" /> Download PDF Mark Sheet
              </Button>
              <Button size="sm" variant="outline" onClick={handlePrint} disabled={!selectedSubmission || classStudents.length === 0}>
                <Printer className="h-4 w-4 mr-1.5" /> Print
              </Button>
            </div>
            <Button size="sm" variant="default" onClick={() => setIsModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MarkSubmissionsSection;
