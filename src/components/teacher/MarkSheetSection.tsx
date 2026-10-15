import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { Download, Send, Save, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, getErrorMessage } from "@/lib/api";
import { calculateGrade } from "@/lib/grading";
import { useSaveExamMark, type ExamMark } from "@/lib/hooks";

interface Props {
  students: { id: number; name: string; student_id?: string }[];
  marks: ExamMark[];
  examId: number | null;
  examName: string;
  subjectId: number;
  subjectName: string;
  classId: number;
  className: string;
  teacherName: string;
}

type Row = { score: string; comment: string };

const MarkSheetSection = ({ students, marks, examId, examName, subjectId, subjectName, classId, className, teacherName }: Props) => {
  const saveMark = useSaveExamMark();
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

  const update = (id: number, patch: Partial<Row>) => setRows((r) => ({ ...r, [id]: { ...r[id], ...patch } }));

  const entered = students.filter((s) => rows[s.id]?.score?.trim());

  const saveAll = async () => {
    if (!examId) return toast.error("Select an exam first.");
    if (entered.length === 0) return toast.error("Enter at least one mark.");
    const bad = entered.find((s) => { const n = Number(rows[s.id].score); return !Number.isFinite(n) || n < 0 || n > 100; });
    if (bad) return toast.error(`Mark for ${bad.name} must be between 0 and 100.`);
    setBusy(true);
    try {
      for (const s of entered) {
        await saveMark.mutateAsync({ exam: examId, student: s.id, subject: subjectId, total_marks: 100, scored: Number(rows[s.id].score), comment: rows[s.id].comment.trim() });
      }
      toast.success(`Saved marks for ${entered.length} learners`);
      return true;
    } catch (e) {
      toast.error(getErrorMessage(e));
      return false;
    } finally { setBusy(false); }
  };

  const buildPdf = () => {
    const doc = new jsPDF();
    const w = doc.internal.pageSize.getWidth();
    doc.setFontSize(16); doc.text("Class Mark Sheet", w / 2, 16, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Class: ${className}    Subject: ${subjectName}    Exam: ${examName}`, 14, 26);
    doc.text(`Teacher: ${teacherName}    Date: ${new Date().toLocaleDateString()}`, 14, 32);
    let y = 42;
    const header = () => {
      doc.setFont("helvetica", "bold");
      doc.text("#", 14, y); doc.text("Learner", 22, y); doc.text("Mark", 92, y); doc.text("Grade", 110, y); doc.text("Comment", 128, y);
      doc.setFont("helvetica", "normal"); doc.line(14, y + 2, w - 14, y + 2); y += 8;
    };
    header();
    students.forEach((s, i) => {
      const r = rows[s.id] ?? { score: "", comment: "" };
      const lines = doc.splitTextToSize(r.comment || "-", w - 142) as string[];
      if (y + lines.length * 5 > 280) { doc.addPage(); y = 20; header(); }
      doc.text(String(i + 1), 14, y);
      doc.text(doc.splitTextToSize(s.name, 66)[0], 22, y);
      doc.text(r.score ? `${r.score}%` : "-", 92, y);
      doc.text(r.score ? calculateGrade(Number(r.score)).grade : "-", 110, y);
      doc.text(lines, 128, y);
      y += Math.max(1, lines.length) * 5 + 2;
    });
    const scored = entered.map((s) => Number(rows[s.id].score));
    if (scored.length) {
      y += 4;
      doc.setFont("helvetica", "bold");
      doc.text(`Class average: ${(scored.reduce((a, b) => a + b, 0) / scored.length).toFixed(1)}%   Pass rate: ${Math.round((scored.filter((n) => n >= 40).length / scored.length) * 100)}%`, 14, y);
    }
    return doc;
  };

  const fileName = `${className}-${subjectName}-${examName}.pdf`.replace(/\s+/g, "_");

  const download = () => buildPdf().save(fileName);

  const submitToAdmin = async () => {
    if (!examId) return toast.error("Select an exam first.");
    const ok = await saveAll();
    if (!ok) return;
    try {
      await api.post("/exams/mark-submissions/", { exam: examId, subject: subjectId, school_class: classId, teacher_name: teacherName, note: `${entered.length} of ${students.length} learners marked` });
      download();
      toast.success("Mark sheet submitted to admin");
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  const shareWhatsApp = async () => {
    const blob = buildPdf().output("blob");
    const file = new File([blob], fileName, { type: "application/pdf" });
    const text = `${className} ${subjectName} results (${examName}) from ${teacherName}.`;
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (nav.canShare?.({ files: [file] })) {
      try { await nav.share({ files: [file], title: fileName, text }); return; } catch { /* cancelled */ return; }
    }
    // Desktop fallback: download the PDF, then open WhatsApp so it can be attached to the parents' group.
    download();
    window.open(`https://wa.me/?text=${encodeURIComponent(text + " The mark sheet PDF is attached.")}`, "_blank");
    toast.info("PDF downloaded — attach it in the WhatsApp chat that just opened.");
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{className} · {subjectName} · {examName || "No exam selected"}</p>
          <h3 className="font-semibold text-foreground">Mark Sheet ({students.length} learners)</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => void saveAll()} disabled={busy}><Save className="h-4 w-4 mr-1" />Save marks</Button>
          <Button size="sm" variant="outline" onClick={download}><Download className="h-4 w-4 mr-1" />PDF</Button>
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
                    <td className="px-3 py-2"><input aria-label={`Mark for ${s.name}`} type="number" min={0} max={100} value={r.score} onChange={(e) => update(s.id, { score: e.target.value })} className="w-full px-2 py-1.5 rounded-md border border-border bg-background text-center" /></td>
                    <td className="px-3 py-2 text-center font-semibold">{r.score ? calculateGrade(Number(r.score)).grade : "—"}</td>
                    <td className="px-3 py-2"><input aria-label={`Comment for ${s.name}`} value={r.comment} maxLength={500} onChange={(e) => update(s.id, { comment: e.target.value })} placeholder="Comment for report card" className="w-full px-2 py-1.5 rounded-md border border-border bg-background" /></td>
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
