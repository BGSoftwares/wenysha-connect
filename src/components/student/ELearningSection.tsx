import { useMemo, useState } from "react";
import { BookOpen, CalendarDays, CheckCircle, Clock3, Download, FileText, Search, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { downloadAuthenticatedFile, getErrorMessage } from "@/lib/api";
import {
  useLearningAssignments,
  useLearningMaterials,
  useLearningSubmissions,
  useSubmitLearningAssignment,
  type LearningAssignment,
} from "@/lib/hooks";

const maxFileBytes = 20 * 1024 * 1024;

const ELearningSection = ({ className }: { className: string }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssignment, setSelectedAssignment] = useState<LearningAssignment | null>(null);
  const [answer, setAnswer] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileInputVersion, setFileInputVersion] = useState(0);
  const { data: materials = [], isLoading: materialsLoading, error: materialsError } = useLearningMaterials({ class_name: className, visibility: "class" });
  const { data: assignments = [], isLoading: assignmentsLoading, error: assignmentsError } = useLearningAssignments();
  const { data: submissions = [] } = useLearningSubmissions();
  const submitAssignment = useSubmitLearningAssignment();

  const filteredMaterials = useMemo(() => materials.filter(material =>
    `${material.title} ${material.subject_name} ${material.file_name}`.toLowerCase().includes(searchQuery.toLowerCase()),
  ), [materials, searchQuery]);
  const filteredAssignments = useMemo(() => assignments.filter(assignment =>
    `${assignment.title} ${assignment.subject_name} ${assignment.teacher_name}`.toLowerCase().includes(searchQuery.toLowerCase()),
  ), [assignments, searchQuery]);
  const submissionsByAssignment = useMemo(() => new Map(submissions.map(submission => [submission.assignment, submission])), [submissions]);

  const openSubmission = (assignment: LearningAssignment) => {
    const existing = submissionsByAssignment.get(assignment.id);
    setSelectedAssignment(assignment);
    setAnswer(existing?.answer ?? "");
    setFile(null);
    setFileInputVersion(version => version + 1);
  };

  const closeSubmission = () => {
    setSelectedAssignment(null);
    setAnswer("");
    setFile(null);
  };

  const saveSubmission = async () => {
    if (!selectedAssignment) return;
    const existing = submissionsByAssignment.get(selectedAssignment.id);
    if (!answer.trim() && !file && !existing?.attachment_url) {
      toast.error("Write an answer or attach your work before submitting.");
      return;
    }
    if (file && file.size > maxFileBytes) {
      toast.error("Your submission file must be 20MB or smaller.");
      return;
    }
    try {
      await submitAssignment.mutateAsync({
        id: existing?.id,
        data: { assignment: selectedAssignment.id, answer: answer.trim(), ...(file ? { attachment: file } : {}) },
      });
      toast.success(existing ? "Your assignment has been resubmitted." : "Your assignment has been sent to your teacher.");
      closeSubmission();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const downloadAssignmentFile = async (assignment: LearningAssignment) => {
    try {
      await downloadAuthenticatedFile(assignment.attachment_url, assignment.attachment_name || `${assignment.title}-instructions`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const assignmentStatus = (assignment: LearningAssignment) => {
    const submission = submissionsByAssignment.get(assignment.id);
    if (submission?.reviewed_at) return { label: "Reviewed", style: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700" };
    if (submission) return { label: "Submitted", style: "border-blue-500/30 bg-blue-500/10 text-blue-700" };
    if (assignment.due_at && new Date(assignment.due_at).getTime() < Date.now()) {
      return { label: "Overdue", style: "border-destructive/30 bg-destructive/10 text-destructive" };
    }
    return { label: "To do", style: "border-amber-500/30 bg-amber-500/10 text-amber-700" };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">E-Learning</h2>
          <p className="text-muted-foreground">Assignments and study materials shared with {className || "your class"}.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Search e-learning" placeholder="Search assignments and materials" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} className="pl-10" />
        </div>
      </div>

      <Tabs defaultValue="assignments" className="w-full">
        <TabsList><TabsTrigger value="assignments">Assignments</TabsTrigger><TabsTrigger value="materials">Materials</TabsTrigger></TabsList>
        <TabsContent value="assignments" className="mt-4 space-y-4">
          {assignmentsLoading ? <Card><CardContent className="p-8 text-center text-muted-foreground">Loading assignments…</CardContent></Card>
            : assignmentsError ? <Card><CardContent className="p-6 text-sm text-destructive">Could not load assignments: {getErrorMessage(assignmentsError)}</CardContent></Card>
              : filteredAssignments.length === 0 ? <Card><CardContent className="flex flex-col items-center gap-2 p-10 text-center text-muted-foreground"><BookOpen className="h-8 w-8" />No assignments have been published to your class yet.</CardContent></Card>
                : filteredAssignments.map(assignment => {
                  const submission = submissionsByAssignment.get(assignment.id);
                  const status = assignmentStatus(assignment);
                  return <Card key={assignment.id}>
                    <CardContent className="flex flex-col justify-between gap-4 p-5 md:flex-row md:items-start">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2"><h3 className="break-words font-semibold">{assignment.title}</h3><Badge variant="outline" className={status.style}>{status.label}</Badge></div>
                        <p className="text-sm text-muted-foreground">{assignment.subject_name} · {assignment.teacher_name}</p>
                        {assignment.instructions && <p className="whitespace-pre-wrap break-words text-sm">{assignment.instructions}</p>}
                        {assignment.attachment_url && <Button variant="link" className="h-auto justify-start p-0 text-sm" onClick={() => void downloadAssignmentFile(assignment)}><Download className="mr-1 h-4 w-4" />{assignment.attachment_name || "Download assignment"}</Button>}
                        {assignment.due_at && <p className="flex items-center gap-1 text-xs text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" />Due {new Date(assignment.due_at).toLocaleString()}</p>}
                        {submission?.teacher_feedback && <div className="rounded-lg bg-secondary/50 p-3 text-sm"><p className="font-medium">Teacher feedback{submission.score ? ` · ${submission.score}%` : ""}</p><p className="mt-1 whitespace-pre-wrap">{submission.teacher_feedback}</p></div>}
                      </div>
                      <Button className="shrink-0" variant={submission ? "outline" : "gold"} onClick={() => openSubmission(assignment)}><Upload className="mr-2 h-4 w-4" />{submission ? "Update submission" : "Submit assignment"}</Button>
                    </CardContent>
                  </Card>;
                })}
        </TabsContent>

        <TabsContent value="materials" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Class materials</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {materialsLoading ? <p className="py-6 text-center text-sm text-muted-foreground">Loading class materials…</p>
                : materialsError ? <p className="py-6 text-center text-sm text-destructive">Could not load class materials: {getErrorMessage(materialsError)}</p>
                  : filteredMaterials.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">No materials have been shared with your class yet.</p>
                    : filteredMaterials.map(material => {
                      const isVideo = material.file_type === "VIDEO";
                      return <div key={material.id} className="flex flex-col justify-between gap-3 rounded-lg border p-3 sm:flex-row sm:items-center">
                        <div className="flex min-w-0 items-center gap-3"><div className="rounded-lg bg-primary/10 p-2"><FileText className="h-5 w-5 text-primary" /></div><div className="min-w-0"><p className="break-words font-medium">{material.title}</p><p className="text-sm text-muted-foreground">{material.subject_name} · {material.file_type}{material.file_name ? ` · ${material.file_name}` : ""}</p></div></div>
                        <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end"><span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="h-3.5 w-3.5" />{new Date(material.created_at).toLocaleDateString()}</span>{material.file_url && <a href={material.file_url} target="_blank" rel="noreferrer" download={!isVideo}><Button variant="outline" size="sm"><Download className="mr-1 h-4 w-4" />{isVideo ? "Watch" : "Download"}</Button></a>}</div>
                      </div>;
                    })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedAssignment && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeSubmission}>
        <div role="dialog" aria-modal="true" aria-labelledby="assignment-submit-title" className="max-h-[90vh] w-full max-w-xl space-y-4 overflow-y-auto rounded-xl bg-card p-6 shadow-2xl" onClick={event => event.stopPropagation()}>
          <div className="flex items-start justify-between gap-3"><div><h3 id="assignment-submit-title" className="text-xl font-bold">Submit assignment</h3><p className="text-sm text-muted-foreground">{selectedAssignment.title} · {selectedAssignment.subject_name}</p></div><Button variant="ghost" size="icon" aria-label="Close submission form" onClick={closeSubmission}><X className="h-4 w-4" /></Button></div>
          <label className="block space-y-1 text-sm">Your written answer
            <Textarea rows={7} maxLength={20000} value={answer} onChange={event => setAnswer(event.target.value)} placeholder="Write your answer here or attach a file below." />
          </label>
          <label className="block space-y-1 text-sm">Attach your work <span className="text-muted-foreground">(optional, max 20MB)</span>
            <Input key={fileInputVersion} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.webp,.zip" onChange={event => setFile(event.target.files?.[0] ?? null)} />
          </label>
          {file && <p className="text-xs text-muted-foreground">Selected file: {file.name}</p>}
          {submissionsByAssignment.get(selectedAssignment.id)?.attachment_url && !file && <p className="text-xs text-muted-foreground">Your previously submitted file is kept unless you choose another file.</p>}
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={closeSubmission}>Cancel</Button><Button variant="gold" disabled={submitAssignment.isPending || (!answer.trim() && !file && !submissionsByAssignment.get(selectedAssignment.id)?.attachment_url)} onClick={() => void saveSubmission()}><Upload className="mr-2 h-4 w-4" />{submitAssignment.isPending ? "Sending…" : submissionsByAssignment.has(selectedAssignment.id) ? "Resubmit Work" : "Send to Teacher"}</Button></div>
        </div>
      </div>}
    </div>
  );
};

export default ELearningSection;
