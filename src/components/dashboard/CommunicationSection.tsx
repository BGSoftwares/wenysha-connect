import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, Clock3, Send, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { api, getErrorMessage } from "@/lib/api";
import { useNotices, type Notice, type SchoolClass, type Student } from "@/lib/hooks";

type StaffRole = "admin" | "teacher" | "accounts";
type RecipientType = "all_students" | "class" | "individual";
type NoticeDraft = {
  title: string;
  content: string;
  priority: "High" | "Medium" | "Low";
  recipient_type: RecipientType;
  recipient_class: string;
  recipient_student: string;
};

interface Props {
  role: StaffRole;
  classes: Pick<SchoolClass, "id" | "name">[];
  students: Pick<Student, "id" | "name" | "school_class" | "class_name">[];
}

const path = "/notices/notices/";
const initialDraft = (role: StaffRole): NoticeDraft => ({
  title: "",
  content: "",
  priority: "Medium",
  recipient_type: role === "teacher" ? "class" : "all_students",
  recipient_class: "",
  recipient_student: "",
});

const statusStyles: Record<Notice["status"], string> = {
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-700",
  approved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
  rejected: "border-destructive/30 bg-destructive/10 text-destructive",
};

const CommunicationSection = ({ role, classes, students }: Props) => {
  const client = useQueryClient();
  const { data: notices = [], isLoading, error } = useNotices();
  const [draft, setDraft] = useState<NoticeDraft>(() => initialDraft(role));
  const [statusFilter, setStatusFilter] = useState("all");
  const isAdmin = role === "admin";

  const selectedClassId = Number(draft.recipient_class) || undefined;
  const individualOptions = useMemo(
    () => students.filter((student) => !selectedClassId || student.school_class === selectedClassId),
    [selectedClassId, students],
  );
  const filteredNotices = notices.filter((notice) => statusFilter === "all" || notice.status === statusFilter);
  const pendingCount = notices.filter((notice) => notice.status === "pending").length;

  const createNotice = useMutation({
    mutationFn: (payload: NoticeDraft) => api.post<Notice>(path, {
      title: payload.title.trim(),
      content: payload.content.trim(),
      priority: payload.priority,
      recipient_type: payload.recipient_type,
      recipient_class: payload.recipient_type === "class" ? Number(payload.recipient_class) : null,
      recipient_student: payload.recipient_type === "individual" ? Number(payload.recipient_student) : null,
    }),
    onSuccess: (notice) => {
      void client.invalidateQueries({ queryKey: ["notices"] });
      setDraft(initialDraft(role));
      toast.success(notice.status === "approved" ? "Notification shared with its recipients." : "Notification submitted for administrator approval.");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const reviewNotice = useMutation({
    mutationFn: ({ id, action }: { id: number; action: "approve" | "reject" }) =>
      api.post<Notice>(`${path}${id}/${action}/`, {}),
    onSuccess: (_notice, variables) => {
      void client.invalidateQueries({ queryKey: ["notices"] });
      toast.success(variables.action === "approve" ? "Notification approved and delivered." : "Notification rejected.");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const submit = () => {
    if (!draft.title.trim() || !draft.content.trim()) {
      toast.error("Add a title and message before submitting.");
      return;
    }
    if (draft.recipient_type === "class" && !draft.recipient_class) {
      toast.error("Choose a class for this notification.");
      return;
    }
    if (draft.recipient_type === "individual" && !draft.recipient_student) {
      toast.error("Choose a student to receive this notification.");
      return;
    }
    createNotice.mutate(draft);
  };

  const recipientLabel = (notice: Notice) => {
    if (notice.recipient_type === "class") return notice.recipient_class_name || notice.audience;
    if (notice.recipient_type === "individual") return notice.recipient_student_name || notice.audience;
    if (notice.recipient_type === "all_parents") return "All parents";
    if (notice.recipient_type === "staff") return "School staff";
    return "All students";
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-primary">Communications</p>
          <h2 className="font-heading text-2xl font-bold text-foreground">Class and student notifications</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAdmin ? "Review staff requests and share approved updates with students and families." : "Send a class update or message an individual student. An administrator approves it before delivery."}
          </p>
        </div>
        {isAdmin && <Badge variant="outline" className="px-3 py-1">{pendingCount} awaiting review</Badge>}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg"><Send className="h-5 w-5 text-primary" />Compose notification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium">Title
              <input className="w-full rounded-lg border border-border bg-background px-3 py-2 font-normal" maxLength={255} value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} placeholder="For example, Friday timetable change" />
            </label>
            <label className="space-y-1.5 text-sm font-medium">Send to
              <select className="w-full rounded-lg border border-border bg-background px-3 py-2 font-normal" value={draft.recipient_type} onChange={(event) => setDraft((current) => ({ ...current, recipient_type: event.target.value as RecipientType, recipient_class: "", recipient_student: "" }))}>
                {role !== "teacher" && <option value="all_students">All students and families</option>}
                <option value="class">A class</option>
                <option value="individual">An individual student</option>
              </select>
            </label>
            {draft.recipient_type === "class" && <label className="space-y-1.5 text-sm font-medium">Class
              <select className="w-full rounded-lg border border-border bg-background px-3 py-2 font-normal" value={draft.recipient_class} onChange={(event) => setDraft((current) => ({ ...current, recipient_class: event.target.value }))}>
                <option value="">Choose a class</option>
                {classes.map((schoolClass) => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>)}
              </select>
            </label>}
            {draft.recipient_type === "individual" && <>
              <label className="space-y-1.5 text-sm font-medium">Class filter <span className="font-normal text-muted-foreground">(optional)</span>
                <select className="w-full rounded-lg border border-border bg-background px-3 py-2 font-normal" value={draft.recipient_class} onChange={(event) => setDraft((current) => ({ ...current, recipient_class: event.target.value, recipient_student: "" }))}>
                  <option value="">All available students</option>
                  {classes.map((schoolClass) => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>)}
                </select>
              </label>
              <label className="space-y-1.5 text-sm font-medium">Student
                <select className="w-full rounded-lg border border-border bg-background px-3 py-2 font-normal" value={draft.recipient_student} onChange={(event) => setDraft((current) => ({ ...current, recipient_student: event.target.value }))}>
                  <option value="">Choose a student</option>
                  {individualOptions.map((student) => <option key={student.id} value={student.id}>{student.name}{student.class_name ? ` · ${student.class_name}` : ""}</option>)}
                </select>
              </label>
            </>}
            <label className="space-y-1.5 text-sm font-medium">Priority
              <select className="w-full rounded-lg border border-border bg-background px-3 py-2 font-normal" value={draft.priority} onChange={(event) => setDraft((current) => ({ ...current, priority: event.target.value as NoticeDraft["priority"] }))}>
                <option>Medium</option><option>High</option><option>Low</option>
              </select>
            </label>
          </div>
          <label className="block space-y-1.5 text-sm font-medium">Message
            <Textarea rows={4} maxLength={10000} value={draft.content} onChange={(event) => setDraft((current) => ({ ...current, content: event.target.value }))} placeholder="Write the update for the selected class or student." />
          </label>
          <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">{isAdmin ? "Administrator messages are delivered immediately." : "Your message stays private until an administrator approves it."}</p>
            <Button variant="gold" onClick={submit} disabled={createNotice.isPending}>
              <Send className="mr-2 h-4 w-4" />{createNotice.isPending ? "Submitting…" : isAdmin ? "Share notification" : "Submit for approval"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h3 className="font-heading text-xl font-bold">Notification history</h3><p className="text-sm text-muted-foreground">Only approved messages reach their selected recipients.</p></div>
          <select aria-label="Filter notifications by approval status" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All statuses</option><option value="pending">Awaiting approval</option><option value="approved">Approved</option><option value="rejected">Rejected</option>
          </select>
        </div>
        {isLoading ? <Card><CardContent className="p-8 text-center text-muted-foreground">Loading notifications…</CardContent></Card>
          : error ? <Card><CardContent className="p-6 text-sm text-destructive">Could not load notifications: {getErrorMessage(error)}</CardContent></Card>
            : filteredNotices.length === 0 ? <Card><CardContent className="p-8 text-center text-muted-foreground">No notifications in this view yet.</CardContent></Card>
              : <div className="grid gap-4">{filteredNotices.map((notice) => (
                <Card key={notice.id} className={notice.pinned ? "border-primary/40" : ""}>
                  <CardContent className="flex flex-col justify-between gap-4 p-5 md:flex-row md:items-start">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2"><Bell className="h-4 w-4 text-primary"/><h4 className="font-semibold">{notice.title}</h4><Badge variant="outline" className={statusStyles[notice.status]}>{notice.status}</Badge><Badge variant="secondary">{notice.priority}</Badge></div>
                      <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{notice.content}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"><span>To: {recipientLabel(notice)}</span><span>By {notice.author}</span><span>{new Date(notice.date).toLocaleDateString()}</span></div>
                      {notice.status === "pending" && !isAdmin && <p className="flex items-center gap-1 text-xs text-amber-700"><Clock3 className="h-3.5 w-3.5" />Waiting for administrator approval</p>}
                      {notice.status === "rejected" && notice.review_note && <p className="text-xs text-destructive">Review note: {notice.review_note}</p>}
                    </div>
                    {isAdmin && notice.status === "pending" && <div className="flex shrink-0 gap-2">
                      <Button variant="outline" size="sm" disabled={reviewNotice.isPending} onClick={() => reviewNotice.mutate({ id: notice.id, action: "approve" })}><Check className="mr-1.5 h-4 w-4"/>Approve</Button>
                      <Button variant="outline" size="sm" disabled={reviewNotice.isPending} onClick={() => reviewNotice.mutate({ id: notice.id, action: "reject" })}><X className="mr-1.5 h-4 w-4"/>Reject</Button>
                    </div>}
                  </CardContent>
                </Card>
              ))}</div>}
      </section>
    </div>
  );
};

export default CommunicationSection;
