import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { Download, Send, Save, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, getErrorMessage } from "@/lib/api";
import { calculateGrade } from "@/lib/grading";
import { EXAM_REPORT_TYPES, useSaveExamMarkSheet, type ExamMark, type ExamReportType } from "@/lib/hooks";
import { drawSchoolLetterhead, loadSchoolLogoDataUrl } from "@/lib/pdfBranding";

interface Props {
  students: { id: number; name: string; student_id?: string }[];
  marks: ExamMark[];
  examId: number | null;
  examName: string;
  reportType: ExamReportType;
  subjectId: number;
  subjectName: string;
  classId: number;
  className: string;
  teacherName: string;
  teacherComments: Record<number, string>;
  onTeacherCommentChange: (studentId: number, comment: string) => void;
  onGradeChange: (studentId: number, score: string) => void;
}

type Row = { score: string; comment: string };

const MarkSheetSection = ({ students, marks, examId, examName, reportType, subjectId, subjectName, classId, className, teacherName, teacherComments, onTeacherCommentChange, onGradeChange }: Props) => {
  const saveMarkSheet = useSaveExamMarkSheet();
  const [rows, setRows] = useState<Record<number, Row>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const next: Record<number, Row> = {};
    students.forEach((s) => {
      const m = marks.find((mk) => mk.student === s.id && mk.subject === subjectId);
      next[s.id] = { score: m ? String(m.scored) : "", comment: m?.comment ?? "" };
    });
    setRows(next);
  }, [students, marks, subjectId]);

  const update = (id: number, patch: Partial<Row>) => {
    setRows((current) => ({ ...current, [id]: { ...current[id], ...patch } }));
    if (patch.comment !== undefined) onTeacherCommentChange(id, patch.comment);
    if (patch.score !== undefined) onGradeChange(id, patch.score);
  };

  const entered = students.filter((s) => rows[s.id]?.score?.trim());

  const saveAll = async () => {
    if (!examId) return toast.error("Select an exam first.");
    if (entered.length === 0) return toast.error("Enter at least one mark.");
    const bad = entered.find((s) => { const n = Number(rows[s.id].score); return !Number.isInteger(n) || n < 0 || n > 100; });
    if (bad) return toast.error(`Mark for ${bad.name} must be a whole number between 0 and 100.`);
    setBusy(true);
    try {
      await saveMarkSheet.mutateAsync({
        exam: examId,
        school_class: classId,
        subject: subjectId,
        marks: entered.map(student => ({
          student: student.id,
          total_marks: 100,
          scored: Number(rows[student.id].score),
          comment: teacherComments[student.id] !== undefined
            ? teacherComments[student.id].trim()
            : rows[student.id].comment.trim(),
        })),
      });
      toast.success(`Saved marks for ${entered.length} learners`);
      return true;
    } catch (e) {
      toast.error(getErrorMessage(e));
      return false;
    } finally { setBusy(false); }
  };

  const buildPdf = async () => {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const left = 14;
    const right = pageWidth - left;
    const width = right - left;
    const reportTypeLabel = EXAM_REPORT_TYPES.find(type => type.value === reportType)?.label ?? "Report card";
    const issuedAt = new Date();
    const issuedDate = issuedAt.toLocaleDateString("en-GB");
    const issueStamp = reportType === "monthly_report_card"
      ? `${issuedAt.toLocaleDateString("en-GB", { month: "long", year: "numeric" })} · ${issuedDate}`
      : issuedDate;
    const schoolLogo = await loadSchoolLogoDataUrl();

    const drawTableHeader = (y: number) => {
      doc.setFillColor(20, 35, 79);
      doc.roundedRect(left, y, width, 8, 1.2, 1.2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("#", left + 5, y + 5.2, { align: "center" });
      doc.text("Learner", left + 12, y + 5.2);
      doc.text("Mark", left + 84, y + 5.2, { align: "center" });
      doc.text("Grade", left + 105, y + 5.2, { align: "center" });
      doc.text("Teacher comment", left + 114, y + 5.2);
      return y + 8;
    };

    const drawPageHeader = () => {
      drawSchoolLetterhead(doc, schoolLogo, "Class Mark Sheet", `${reportTypeLabel} · Issued ${issueStamp}`);
      const metaTop = 43;
      const metaHeight = 22;
      const gap = 1.5;
      const cellWidth = (width - gap) / 2;
      const cells = [
        { label: "Class", value: className, x: left, y: metaTop },
        { label: "Subject", value: subjectName, x: left + cellWidth + gap, y: metaTop },
        { label: "Examination", value: examName || "—", x: left, y: metaTop + metaHeight / 2 },
        { label: "Teacher", value: teacherName, x: left + cellWidth + gap, y: metaTop + metaHeight / 2 },
      ];

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(234, 221, 229);
      doc.roundedRect(left, metaTop, width, metaHeight, 2, 2, "FD");
      doc.line(left, metaTop + metaHeight / 2, right, metaTop + metaHeight / 2);
      doc.line(left + cellWidth + gap / 2, metaTop, left + cellWidth + gap / 2, metaTop + metaHeight);
      cells.forEach((cell) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.5);
        doc.setTextColor(126, 120, 136);
        doc.text(cell.label.toUpperCase(), cell.x + 3, cell.y + 3.5);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(23, 36, 76);
        doc.text(doc.splitTextToSize(cell.value, cellWidth - 6)[0], cell.x + 3, cell.y + 8.5);
      });

      return drawTableHeader(metaTop + metaHeight + 4);
    };

    let y = drawPageHeader();
    students.forEach((student, index) => {
      const r = rows[student.id] ?? { score: "", comment: "" };
      const comment = teacherComments[student.id]?.trim() || r.comment.trim();
      const commentLines = doc.splitTextToSize(comment || "—", 64) as string[];
      const learnerLines = doc.splitTextToSize(student.name, 56) as string[];
      const lineCount = Math.max(commentLines.length, learnerLines.length, 1);
      const rowHeight = Math.max(8, lineCount * 4.2 + 3);

      if (y + rowHeight > pageHeight - 18) {
        doc.addPage();
        y = drawPageHeader();
      }

      doc.setFillColor(255, index % 2 === 0 ? 255 : 243, index % 2 === 0 ? 255 : 248);
      doc.rect(left, y, width, rowHeight, "F");
      doc.setDrawColor(234, 221, 229);
      doc.line(left, y + rowHeight, right, y + rowHeight);
      doc.setTextColor(23, 36, 76);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      const baseline = y + 5.2;
      doc.text(String(index + 1), left + 5, baseline, { align: "center" });
      doc.text(learnerLines, left + 12, baseline);
      doc.text(r.score.trim() ? `${r.score}%` : "—", left + 84, baseline, { align: "center" });
      doc.setFont("helvetica", "bold");
      doc.text(r.score.trim() ? calculateGrade(Number(r.score)).grade : "—", left + 105, baseline, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setTextColor(87, 82, 102);
      doc.text(commentLines, left + 114, baseline);
      y += rowHeight;
    });

    const scored = entered.map((s) => Number(rows[s.id].score));
    if (scored.length) {
      if (y + 18 > pageHeight - 18) {
        doc.addPage();
        y = drawPageHeader();
      }
      y += 4;
      doc.setFillColor(253, 234, 243);
      doc.setDrawColor(237, 207, 223);
      doc.roundedRect(left, y, width, 14, 2, 2, "FD");
      doc.setTextColor(23, 36, 76);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(`Class average: ${(scored.reduce((a, b) => a + b, 0) / scored.length).toFixed(1)}%`, left + 4, y + 8.5);
      doc.setTextColor(179, 22, 105);
      doc.text(`Pass rate: ${Math.round((scored.filter((n) => n >= 40).length / scored.length) * 100)}%`, right - 4, y + 8.5, { align: "right" });
    }

    const pageCount = doc.getNumberOfPages();
    for (let page = 1; page <= pageCount; page += 1) {
      doc.setPage(page);
      doc.setDrawColor(234, 221, 229);
      doc.line(left, pageHeight - 13, right, pageHeight - 13);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 130);
      doc.text(`Issued ${issueStamp} · ${teacherName}`, left, pageHeight - 7, { maxWidth: width - 22 });
      doc.text(`Page ${page} of ${pageCount}`, right, pageHeight - 7, { align: "right" });
    }
    return doc;
  };

  const fileName = `${className}-${subjectName}-${examName}.pdf`.replace(/\s+/g, "_");

  const download = async () => (await buildPdf()).save(fileName);

  const submitToAdmin = async () => {
    if (!examId) return toast.error("Select an exam first.");
    const ok = await saveAll();
    if (!ok) return;
    try {
      await api.post("/exams/mark-submissions/", { exam: examId, subject: subjectId, school_class: classId, teacher_name: teacherName, note: `${entered.length} of ${students.length} learners marked` });
      await download();
      toast.success("Mark sheet submitted to admin");
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  const shareWhatsApp = async () => {
    const blob = (await buildPdf()).output("blob");
    const file = new File([blob], fileName, { type: "application/pdf" });
    const text = `${className} ${subjectName} results (${examName}) from ${teacherName}.`;
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (nav.canShare?.({ files: [file] })) {
      try { await nav.share({ files: [file], title: fileName, text }); return; } catch { /* cancelled */ return; }
    }
    // Desktop fallback: download the PDF, then open WhatsApp so it can be attached to the parents' group.
    await download();
    window.open(`https://wa.me/?text=${encodeURIComponent(text + " The mark sheet PDF is attached.")}`, "_blank");
    toast.info("PDF downloaded — attach it in the WhatsApp chat that just opened.");
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{className} · {subjectName} · {examName || "No exam selected"}</p>
          <p className="text-xs font-medium text-primary">{EXAM_REPORT_TYPES.find(type => type.value === reportType)?.label}</p>
          <h3 className="font-semibold text-foreground">Mark Sheet ({students.length} learners)</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => void saveAll()} disabled={busy}><Save className="h-4 w-4 mr-1" />Save marks</Button>
          <Button size="sm" variant="outline" onClick={() => void download()}><Download className="h-4 w-4 mr-1" />PDF</Button>
          <Button size="sm" variant="gold" onClick={() => void submitToAdmin()} disabled={busy}><Send className="h-4 w-4 mr-1" />Submit to admin</Button>
          <Button size="sm" variant="outline" onClick={() => void shareWhatsApp()}><Share2 className="h-4 w-4 mr-1" />WhatsApp</Button>
        </div>
      </div>
      {students.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No learners are enrolled in this class yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60">
              <tr>
                <th className="px-3 py-2 text-left w-10">#</th>
                <th className="px-3 py-2 text-left">Learner</th>
                <th className="px-3 py-2 text-center w-28">Mark (%)</th>
                <th className="px-3 py-2 text-center w-20">Grade</th>
                <th className="px-3 py-2 text-left">Comment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {students.map((s, i) => {
                const r = rows[s.id] ?? { score: "", comment: "" };
                return (
                  <tr key={s.id} className="odd:bg-card even:bg-secondary/20">
                    <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-2 font-medium text-foreground">{s.name}</td>
                    <td className="px-3 py-2"><input aria-label={`Mark for ${s.name}`} type="number" min={0} max={100} step={1} value={r.score} onChange={(e) => update(s.id, { score: e.target.value })} className="w-full px-2 py-1.5 rounded-md border border-border bg-background text-center" /></td>
                    <td className="px-3 py-2 text-center font-semibold">{r.score ? calculateGrade(Number(r.score)).grade : "—"}</td>
                    <td className="px-3 py-2"><input aria-label={`Comment for ${s.name}`} value={teacherComments[s.id] ?? r.comment} maxLength={500} onChange={(e) => update(s.id, { comment: e.target.value })} placeholder="Comment for report card" className="w-full px-2 py-1.5 rounded-md border border-border bg-background" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MarkSheetSection;
