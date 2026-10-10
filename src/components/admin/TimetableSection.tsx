import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/lib/api";
import { useTeachers, useSubjects, useTimetable, type SchoolClass } from "@/lib/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

interface Props { classes: SchoolClass[] }
const TimetableSection = ({ classes }: Props) => {
  const queryClient = useQueryClient();
  const [classId, setClassId] = useState<number | undefined>(classes[0]?.id);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ day_of_week: "Monday", period_start: "08:00", period_end: "08:40", subject: "", teacher: "", room: "" });
  useEffect(() => { if (classId === undefined && classes.length) setClassId(classes[0].id); }, [classId, classes]);
  const { data: entries = [], isLoading, error } = useTimetable(classId);
  const { data: subjects = [] } = useSubjects();
  const { data: teachers = [] } = useTeachers();
  const save = async () => {
    if (!classId || !draft.subject || !draft.period_start || !draft.period_end) { toast.error("Choose a class, subject, and period times"); return; }
    if (draft.period_end <= draft.period_start) { toast.error("End time must be after start time"); return; }
    try {
      await api.post("/school/timetable/", { ...draft, school_class: classId, subject: Number(draft.subject), teacher: draft.teacher ? Number(draft.teacher) : null });
      await queryClient.invalidateQueries({ queryKey: ["timetable", classId] });
      setAdding(false); setDraft({ day_of_week: "Monday", period_start: "08:00", period_end: "08:40", subject: "", teacher: "", room: "" });
      toast.success("Timetable period saved");
    } catch (e) { toast.error(getErrorMessage(e)); }
  };
  const remove = async (id: number) => {
    if (!window.confirm("Delete this timetable period?")) return;
    try { await api.delete(`/school/timetable/${id}/`); await queryClient.invalidateQueries({ queryKey: ["timetable", classId] }); toast.success("Period deleted"); }
    catch (e) { toast.error(getErrorMessage(e)); }
  };
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-heading text-xl font-bold">School Timetable</h2><p className="text-sm text-muted-foreground">Schedule and manage lessons by class</p></div><div className="flex gap-2"><select aria-label="Select class" className="rounded-lg border border-border bg-background px-3 py-2" value={classId ?? ""} onChange={e => setClassId(Number(e.target.value) || undefined)}><option value="">Select class</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><Button variant="gold" disabled={!classId} onClick={() => setAdding(true)}><Plus className="mr-2 h-4 w-4"/>Add Period</Button></div></div>
    {isLoading ? <p className="py-10 text-center text-muted-foreground">Loading timetable…</p> : error ? <p className="rounded-xl border border-destructive/30 p-5 text-destructive">Could not load timetable: {getErrorMessage(error)}</p> : !classId ? <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">Create or select a class to view its timetable.</p> : entries.length === 0 ? <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">No timetable periods have been entered for this class yet.</p> : <div className="overflow-x-auto rounded-xl border bg-card"><table className="w-full min-w-[700px]"><thead className="bg-secondary/50"><tr>{["Day", "Start", "End", "Subject", "Teacher", "Room", ""].map((h, i) => <th key={`${h}${i}`} className="px-4 py-3 text-left text-sm font-semibold">{h}</th>)}</tr></thead><tbody>{entries.map(entry => <tr key={entry.id} className="border-t"><td className="px-4 py-3">{entry.day_of_week}</td><td className="px-4 py-3">{entry.period_start}</td><td className="px-4 py-3">{entry.period_end}</td><td className="px-4 py-3 font-medium">{entry.subject_name}</td><td className="px-4 py-3">{entry.teacher_name || "—"}</td><td className="px-4 py-3">{entry.room || "—"}</td><td className="px-4 py-3 text-right"><Button variant="outline" size="icon" aria-label="Delete timetable period" onClick={() => void remove(entry.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button></td></tr>)}</tbody></table></div>}
    {adding && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setAdding(false)}><div className="w-full max-w-md space-y-4 rounded-xl bg-card p-6" onClick={e => e.stopPropagation()}><h3 className="text-xl font-bold">Add timetable period</h3><label className="block text-sm">Day<select className="mt-1 w-full rounded-lg border bg-background p-2" value={draft.day_of_week} onChange={e => setDraft({ ...draft, day_of_week: e.target.value })}>{["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(day => <option key={day}>{day}</option>)}</select></label><label className="block text-sm">Subject<select className="mt-1 w-full rounded-lg border bg-background p-2" value={draft.subject} onChange={e => setDraft({ ...draft, subject: e.target.value })}><option value="">Select subject</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label className="block text-sm">Teacher<select className="mt-1 w-full rounded-lg border bg-background p-2" value={draft.teacher} onChange={e => setDraft({ ...draft, teacher: e.target.value })}><option value="">Unassigned</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label><div className="grid grid-cols-2 gap-3">{(["period_start", "period_end"] as const).map(key => <label key={key} className="block text-sm">{key === "period_start" ? "Start time" : "End time"}<input type="time" className="mt-1 w-full rounded-lg border bg-background p-2" value={draft[key]} onChange={e => setDraft({ ...draft, [key]: e.target.value })}/></label>)}</div><label className="block text-sm">Room<input className="mt-1 w-full rounded-lg border bg-background p-2" value={draft.room} onChange={e => setDraft({ ...draft, room: e.target.value })}/></label><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setAdding(false)}>Cancel</Button><Button variant="gold" onClick={() => void save()}>Save period</Button></div></div></div>}
  </div>;
};
export default TimetableSection;
