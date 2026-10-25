import { useMemo } from "react";
import { BookOpen, CalendarDays, Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { downloadAuthenticatedFile, getErrorMessage } from "@/lib/api";
import { useLearningAssignments, useLearningMaterials, useLearningSubmissions } from "@/lib/hooks";

const ParentELearningSection = ({ studentId, className }: { studentId: number; className: string }) => {
  const { data: materials = [], isLoading: materialsLoading } = useLearningMaterials({ class_name: className, visibility: "class" });
  const { data: assignments = [], isLoading: assignmentsLoading } = useLearningAssignments();
  const { data: submissions = [] } = useLearningSubmissions();

  const classAssignments = useMemo(
    () => assignments.filter(assignment => assignment.class_name === className),
    [assignments, className],
  );
  const childSubmissions = useMemo(
    () => new Map(submissions.filter(submission => submission.student === studentId).map(submission => [submission.assignment, submission])),
    [submissions, studentId],
  );
  const classMaterials = useMemo(
    () => materials.filter(material => material.class_name === className),
    [materials, className],
  );

  const download = async (url: string, name: string) => {
    try {
      await downloadAuthenticatedFile(url, name);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" />Class assignments</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {assignmentsLoading ? <p className="py-5 text-center text-sm text-muted-foreground">Loading assignments…</p>
            : classAssignments.length === 0 ? <p className="py-5 text-center text-sm text-muted-foreground">No assignments have been shared with {className} yet.</p>
              : classAssignments.map(assignment => {
                const submission = childSubmissions.get(assignment.id);
                return <div key={assignment.id} className="space-y-3 rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div><p className="font-semibold">{assignment.title}</p><p className="text-sm text-muted-foreground">{assignment.subject_name} · {assignment.teacher_name}</p></div>
                    <Badge variant="outline" className={submission?.reviewed_at ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700" : submission ? "border-blue-500/30 bg-blue-500/10 text-blue-700" : "border-amber-500/30 bg-amber-500/10 text-amber-700"}>
                      {submission?.reviewed_at ? "Reviewed" : submission ? "Submitted" : "Not submitted"}
                    </Badge>
                  </div>
                  {assignment.instructions && <p className="whitespace-pre-wrap text-sm">{assignment.instructions}</p>}
                  {assignment.due_at && <p className="flex items-center gap-1 text-xs text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" />Due {new Date(assignment.due_at).toLocaleString()}</p>}
                  {assignment.attachment_url && <Button variant="link" className="h-auto justify-start p-0 text-sm" onClick={() => void download(assignment.attachment_url, assignment.attachment_name || `${assignment.title}-instructions`)}><Download className="mr-1 h-4 w-4" />{assignment.attachment_name || "Download assignment"}</Button>}
                  {submission && <div className="space-y-2 rounded-lg bg-secondary/40 p-3 text-sm">
                    <p className="text-xs text-muted-foreground">Submitted {new Date(submission.submitted_at).toLocaleString()}</p>
                    {submission.answer && <p className="whitespace-pre-wrap">{submission.answer}</p>}
                    {submission.attachment_url && <Button variant="link" className="h-auto justify-start p-0 text-sm" onClick={() => void download(submission.attachment_url, submission.attachment_name || `${assignment.title}-submission`)}><Download className="mr-1 h-4 w-4" />{submission.attachment_name || "Download submitted work"}</Button>}
                    {(submission.teacher_feedback || submission.score !== null) && <div className="border-t border-border pt-2"><p className="font-medium">Teacher review{submission.score !== null ? ` · ${submission.score}%` : ""}</p>{submission.teacher_feedback && <p className="mt-1 whitespace-pre-wrap">{submission.teacher_feedback}</p>}</div>}
                  </div>}
                </div>;
              })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Study materials · {className}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {materialsLoading ? <p className="py-5 text-center text-sm text-muted-foreground">Loading materials…</p>
            : classMaterials.length === 0 ? <p className="py-5 text-center text-sm text-muted-foreground">No class materials have been shared yet.</p>
              : classMaterials.map(material => <div key={material.id} className="flex flex-col justify-between gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center">
                <div><p className="font-medium">{material.title}</p><p className="text-sm text-muted-foreground">{material.subject_name} · {material.file_type} · {material.uploaded_by || "School staff"}</p></div>
                {material.file_url && <Button variant="outline" size="sm" onClick={() => void download(material.file_url, material.file_name || material.title)}><Download className="mr-2 h-4 w-4" />Download</Button>}
              </div>)}
        </CardContent>
      </Card>
    </div>
  );
};

export default ParentELearningSection;
