import { useState } from "react";
import { Sparkles, Plus, Trash2, Loader2, Copy } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type StudentOpt = { id: number | string; name: string; class_name?: string };
type Row = { subject: string; score: string; total: string };

export default function AIFeedbackSection({ students = [] }: { students?: StudentOpt[] }) {
  const [studentName, setStudentName] = useState("");
  const [className, setClassName] = useState("");
  const [rows, setRows] = useState<Row[]>([{ subject: "", score: "", total: "100" }]);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const pickStudent = (id: string) => {
    const s = students.find((x) => String(x.id) === id);
    if (s) { setStudentName(s.name); setClassName(s.class_name ?? ""); }
  };

  const updateRow = (i: number, key: keyof Row, v: string) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [key]: v } : row)));

  const generate = async () => {
    const marks = rows
      .filter((r) => r.subject.trim() && r.score !== "")
      .map((r) => ({ subject: r.subject.trim(), score: Number(r.score), total: Number(r.total) || 100 }));
    if (!studentName.trim()) return toast.error("Enter the student's name");
    if (!marks.length && !feedback.trim()) return toast.error("Add at least one mark or some feedback");
    setLoading(true);
    setResult("");
    const { data, error } = await supabase.functions.invoke("student-feedback-ai", {
      body: { studentName, className, marks, feedback },
    });
    setLoading(false);
    if (error || data?.error) {
      let msg = data?.error as string | undefined;
      try { msg ??= (await (error as any)?.context?.json())?.error; } catch { /* ignore */ }
      toast.error(msg || "Couldn't generate suggestions");
      return;
    }
    setResult(data.suggestions);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" /> AI Improvement Coach
        </h2>
        <p className="text-muted-foreground text-sm">Enter a student's marks and your feedback to get personalised improvement suggestions.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Student details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {students.length > 0 && (
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                defaultValue=""
                onChange={(e) => pickStudent(e.target.value)}
              >
                <option value="" disabled>Pick a student (optional)</option>
                {students.map((s) => (
                  <option key={s.id} value={String(s.id)}>{s.name}{s.class_name ? ` — ${s.class_name}` : ""}</option>
                ))}
              </select>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Student name" value={studentName} onChange={(e) => setStudentName(e.target.value)} />
              <Input placeholder="Class (e.g. Form 4A)" value={className} onChange={(e) => setClassName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Marks</p>
              {rows.map((r, i) => (
                <div key={i} className="flex gap-2">
                  <Input className="flex-1" placeholder="Subject / assignment" value={r.subject} onChange={(e) => updateRow(i, "subject", e.target.value)} />
                  <Input className="w-20" type="number" placeholder="Score" value={r.score} onChange={(e) => updateRow(i, "score", e.target.value)} />
                  <Input className="w-20" type="number" placeholder="Out of" value={r.total} onChange={(e) => updateRow(i, "total", e.target.value)} />
                  <Button variant="ghost" size="icon" onClick={() => setRows((rs) => rs.filter((_, idx) => idx !== i))} disabled={rows.length === 1}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setRows((r) => [...r, { subject: "", score: "", total: "100" }])}>
                <Plus className="w-4 h-4 mr-1" /> Add mark
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Assignment feedback</p>
              <Textarea rows={5} placeholder="e.g. Struggles with algebraic equations, essays lack structure, good effort in practicals..." value={feedback} onChange={(e) => setFeedback(e.target.value)} />
            </div>

            <Button className="w-full" onClick={generate} disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating…</> : <><Sparkles className="w-4 h-4 mr-2" /> Generate suggestions</>}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Suggestions</CardTitle>
            {result && (
              <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(result); toast.success("Copied"); }}>
                <Copy className="w-4 h-4 mr-1" /> Copy
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-sm">The AI is reviewing the marks and feedback…</p>
            ) : result ? (
              <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {result.split("\n").map((line, i) =>
                  line.startsWith("## ") ? (
                    <h3 key={i} className="font-semibold text-primary mt-4 mb-1 text-base">{line.slice(3)}</h3>
                  ) : (
                    <p key={i}>{line.replace(/\*\*(.+?)\*\*/g, "$1")}</p>
                  ),
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Suggestions will appear here.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
