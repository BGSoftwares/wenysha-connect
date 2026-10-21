import { useMemo, useState } from "react";
import { BookOpen, Download, Eye, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { downloadAuthenticatedFile, getErrorMessage } from "@/lib/api";
import {
  useCreateLearningAssignment,
  useDeleteLearningAssignment,
  useLearningAssignments,
  useLearningSubmissions,
  type Allocation,
} from "@/lib/hooks";

type Draft = { allocation: string; title: string; instructions: string; dueAt: string };
const emptyDraft: Draft = { allocation: "", title: "", instructions: "", dueAt: "" };
const maxFileBytes = 20 * 1024 * 1024;

const LearningAssignmentsSection = ({ allocations }: { allocations: Allocation[] }) => {
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [file, setFile] = useState<File | null>(null);
  const [expandedAssignment, setExpandedAssignment] = useState<number | null>(null);
  const { data: assignments = [], isLoading, error } = useLearningAssignments();
  const { data: submissions = [] } = useLearningSubmissions();
  const createAssignment = useCreateLearningAssignment();
  const deleteAssignment = useDeleteLearningAssignment();

  const selectedAllocation = allocations.find(item => String(item.id) === draft.allocation);
  const allocationOptions = useMemo(() => allocations.filter((allocation, index, all) =>
    all.findIndex(candidate => candidate.school_class === allocation.school_class && candidate.subject === allocation.subject) === index,
  ), [allocations]);

  const downloadFile = async (url: string, filename: string) => {
    try {
      await downloadAuthenticatedFile(url, filename);
    } catch (downloadError) {
      toast.error(getErrorMessage(downloadError));
    }
  };

  const publish = async () => {
    if (!selectedAllocation || !draft.title.trim()) {
      toast.error("Choose your allocated class and subject and enter an assignment title.");
      return;
    }
    if (file && file.size > maxFileBytes) {
      toast.error("Assignment files must be 20MB or smaller.");
      return;
    }
    try {
      await createAssignment.mutateAsync({
        title: draft.title.trim(),
        instructions: draft.instructions.trim(),
        school_class: selectedAllocation.school_class,
        subject: selectedAllocation.subject,
        ...(draft.dueAt ? { due_at: new Date(draft.dueAt).toISOString() } : {}),
        ...(file ? { attachment: file } : {}),
        is_published: true,
      });
      setDraft(emptyDraft);
      setFile(null);
      toast.success("Assignment published to the selected class student portal.");
    } catch (submitError) {
      toast.error(getErrorMessage(submitError));
    }
  };

  const remove = async (id: number, title: string) => {
    if (!window.confirm(`Delete “${title}” and its student submissions?`)) return;
    try {
      await deleteAssignment.mutateAsync(id);
      toast.success("Assignment deleted.");
    } catch (deleteError) {
      toast.error(getErrorMessage(deleteError));
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold">Assignments</h2>
        <p className="text-sm text-muted-foreground">Publish work to classes and subjects assigned to you, then review student submissions.</p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <h3 className="flex items-center gap-2 font-semibold"><Plus className="h-4 w-4 text-primary" />Create an assignment</h3>
          {allocationOptions.length === 0 ? (
            <p className="rounded-lg bg-secondary/60 p-4 text-sm text-muted-foreground">An administrator must assign you a subject and class before you can publish assignments.</p>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1 text-sm">Class and subject
                  <select className="w-full rounded-lg border border-border bg-background px-3 py-2" value={draft.allocation} onChange={event => setDraft(current => ({ ...current, allocation: event.target.value }))}>
                    <option value="">Select an allocation</option>
                    {allocationOptions.map(allocation => <option key={allocation.id} value={allocation.id}>{allocation.class_name} · {allocation.subject_name}</option>)}
                  </select>
                </label>
                <label className="space-y-1 text-sm">Assignment title
                  <Input maxLength={255} value={draft.title} onChange={event => setDraft(current => ({ ...current, title: event.target.value }))} placeholder="For example, Algebra practice" />
                </label>
                <label className="space-y-1 text-sm">Due date and time <span className="text-muted-foreground">(optional)</span>
                  <Input type="datetime-local" value={draft.dueAt} onChange={event => setDraft(current => ({ ...current, dueAt: event.target.value }))} />
                </label>
                <label className="space-y-1 text-sm">Attach instructions or a worksheet <span className="text-muted-foreground">(optional, max 20MB)</span>
                  <Input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.webp,.zip" onChange={event => setFile(event.target.files?.[0] ?? null)} />
                </label>
              </div>
              <label className="block space-y-1 text-sm">Instructions
                <Textarea rows={4} maxLength={10000} value={draft.instructions} onChange={event => setDraft(current => ({ ...current, instructions: event.target.value }))} placeholder="Explain what students should complete and how to submit it." />
              </label>
              <div className="flex justify-end"><Button variant="gold" disabled={createAssignment.isPending || !draft.title.trim() || !draft.allocation} onClick={() => void publish()}><Upload className="mr-2 h-4 w-4" />{createAssignment.isPending ? "Publishing…" : "Publish to Student Portal"}</Button></div>
            </>
          )}
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div><h3 className="font-heading text-xl font-bold">Published assignments</h3><p className="text-sm text-muted-foreground">Student work is visible only to its student, the assigned teacher, and administrators.</p></div>
        {isLoading ? <Card><CardContent className="p-6 text-center text-muted-foreground">Loading assignments…</CardContent></Card>
          : error ? <Card><CardContent className="p-6 text-sm text-destructive">Could not load assignments: {getErrorMessage(error)}</CardContent></Card>
            : assignments.length === 0 ? <Card><CardContent className="p-8 text-center text-muted-foreground">You have not published an assignment yet.</CardContent></Card>
              : assignments.map(assignment => {
                const assignmentSubmissions = submissions.filter(submission => submission.assignment === assignment.id);
                const expanded = expandedAssignment === assignment.id;
                return <Card key={assignment.id}>
                  <CardContent className="space-y-4 p-5">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div className="min-w-0 space-y-1">
                        <h4 className="break-words font-semibold">{assignment.title}</h4>
                        <p className="text-sm text-muted-foreground">{assignment.class_name} · {assignment.subject_name}{assignment.due_at ? ` · Due ${new Date(assignment.due_at).toLocaleString()}` : " · No due date"}</p>
                        {assignment.instructions && <p className="whitespace-pre-wrap text-sm">{assignment.instructions}</p>}
                        {assignment.attachment_url && <Button variant="link" className="h-auto justify-start p-0 text-sm" onClick={() => void downloadFile(assignment.attachment_url, assignment.attachment_name || `${assignment.title}-instructions`)}><Download className="mr-1 h-4 w-4" />{assignment.attachment_name || "Download instructions"}</Button>}
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => setExpandedAssignment(expanded ? null : assignment.id)}><Eye className="mr-2 h-4 w-4" />{expanded ? "Hide" : "View"} submissions ({assignmentSubmissions.length})</Button>
                        <Button variant="outline" size="icon" aria-label={`Delete ${assignment.title}`} disabled={deleteAssignment.isPending} onClick={() => void remove(assignment.id, assignment.title)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </div>
                    {expanded && <div className="space-y-3 border-t pt-4">
                      {assignmentSubmissions.length === 0 ? <p className="text-sm text-muted-foreground">No student submissions yet.</p>
                        : assignmentSubmissions.map(submission => <div key={submission.id} className="rounded-lg border bg-secondary/20 p-4">
                          <p className="font-medium">{submission.student_name}<span className="ml-2 text-xs font-normal text-muted-foreground">{new Date(submission.submitted_at).toLocaleString()}</span></p>
                          {submission.answer && <p className="mt-2 whitespace-pre-wrap break-words text-sm">{submission.answer}</p>}
                          {submission.attachment_url && <Button variant="link" className="mt-2 h-auto justify-start p-0 text-sm" onClick={() => void downloadFile(submission.attachment_url, submission.attachment_name || `${submission.student_name}-work`)}><Download className="mr-1 h-4 w-4" />{submission.attachment_name || "Download student work"}</Button>}
                        </div>)}
                    </div>}
                  </CardContent>
                </Card>;
              })}
      </section>

      <Card><CardContent className="flex items-center gap-3 p-4 text-sm text-muted-foreground"><BookOpen className="h-4 w-4 shrink-0 text-primary" /><p>Class materials can be added from the Materials section. Both materials and published assignments appear in the student e-learning portal.</p></CardContent></Card>
    </div>
  );
};

export default LearningAssignmentsSection;
