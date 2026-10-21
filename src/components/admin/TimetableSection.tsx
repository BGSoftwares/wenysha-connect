import { useEffect, useState } from "react";
import { Plus, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/lib/api";
import { useTeachers, useSubjects, useTimetable, type SchoolClass, type TimetableEntry } from "@/lib/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

interface Props { classes: SchoolClass[] }

const emptyDraft = {
  day_of_week: "Monday",
  period_start: "07:40",
  period_end: "08:40",
  subject: "",
  teacher: "",
  room: ""
};

const lessonSlots = [
  { start: "07:40", end: "08:40" }, { start: "08:40", end: "09:40" }, { start: "09:40", end: "10:40" },
  { start: "11:10", end: "12:10" }, { start: "12:10", end: "13:10" },
  { start: "14:00", end: "15:00" }, { start: "15:00", end: "16:00" },
];

const TimetableSection = ({ classes }: Props) => {
  const queryClient = useQueryClient();
  const [classId, setClassId] = useState<number | undefined>(classes[0]?.id);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);

  useEffect(() => {
    if (classId === undefined && classes.length) setClassId(classes[0].id);
  }, [classId, classes]);

  const { data: entries = [], isLoading, error } = useTimetable(classId);
  const { data: subjects = [] } = useSubjects();
  const { data: teachers = [] } = useTeachers();

  const openAdd = () => {
    setEditingId(null);
    setDraft(emptyDraft);
    setShowModal(true);
  };

  const openEdit = (entry: TimetableEntry) => {
    setEditingId(entry.id);
    setDraft({
      day_of_week: entry.day_of_week || "Monday",
      period_start: entry.period_start?.slice(0, 5) || "07:40",
      period_end: entry.period_end?.slice(0, 5) || "08:40",
      subject: entry.subject ? String(entry.subject) : "",
      teacher: entry.teacher ? String(entry.teacher) : "",
      room: entry.room || ""
    });
    setShowModal(true);
  };

  const save = async () => {
    if (!classId || !draft.subject || !draft.period_start || !draft.period_end) {
      toast.error("Choose a class, subject, and period times");
      return;
    }
    if (draft.period_end <= draft.period_start) {
      toast.error("End time must be after start time");
      return;
    }

    const payload = {
      school_class: classId,
      day_of_week: draft.day_of_week,
      period_start: draft.period_start,
      period_end: draft.period_end,
      subject: Number(draft.subject),
      teacher: draft.teacher ? Number(draft.teacher) : null,
      room: draft.room
    };

    try {
      if (editingId) {
        await api.patch(`/school/timetable/${editingId}/`, payload);
        toast.success("Timetable period updated");
      } else {
        await api.post("/school/timetable/", payload);
        toast.success("Timetable period saved");
      }
      await queryClient.invalidateQueries({ queryKey: ["timetable", classId] });
      setShowModal(false);
      setEditingId(null);
      setDraft(emptyDraft);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm("Delete this timetable period?")) return;
    try {
      await api.delete(`/school/timetable/${id}/`);
      await queryClient.invalidateQueries({ queryKey: ["timetable", classId] });
      toast.success("Period deleted");
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-bold">School Timetable</h2>
          <p className="text-sm text-muted-foreground">Schedule and manage lessons by class</p>
          <p className="mt-1 text-xs text-muted-foreground">Lessons: 07:40–10:40, 11:10–13:10, 14:00–16:00 · Break: 10:40–11:10 · Lunch: 13:10–14:00</p>
        </div>
        <div className="flex gap-2">
          <select
            aria-label="Select class"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            value={classId ?? ""}
            onChange={e => setClassId(Number(e.target.value) || undefined)}
          >
            <option value="">Select class</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <Button variant="gold" disabled={!classId} onClick={openAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Period
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="py-10 text-center text-muted-foreground">Loading timetable…</p>
      ) : error ? (
        <p className="rounded-xl border border-destructive/30 p-5 text-destructive">
          Could not load timetable: {getErrorMessage(error)}
        </p>
      ) : !classId ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          Create or select a class to view its timetable.
        </p>
      ) : entries.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          No timetable periods have been entered for this class yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-elegant">
          <table className="w-full min-w-[700px]">
            <thead className="bg-secondary/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Day</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Start</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">End</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Subject</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Teacher</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Room</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.map(entry => (
                <tr key={entry.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium">{entry.day_of_week}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{entry.period_start}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{entry.period_end}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-foreground">{entry.subject_name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{entry.teacher_name || "Unassigned"}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{entry.room || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Edit timetable period"
                        onClick={() => openEdit(entry)}
                        className="hover:border-primary/50"
                      >
                        <Edit className="h-4 w-4 text-muted-foreground hover:text-primary" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Delete timetable period"
                        onClick={() => void remove(entry.id)}
                        className="hover:border-destructive/50"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md space-y-4 rounded-2xl bg-card p-6 border border-border shadow-2xl animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-foreground">
              {editingId ? "Edit Timetable Period" : "Add Timetable Period"}
            </h3>

            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase text-muted-foreground">
                Day of Week
                <select
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm font-normal text-foreground normal-case outline-none focus:ring-2 focus:ring-primary/20"
                  value={draft.day_of_week}
                  onChange={e => setDraft({ ...draft, day_of_week: e.target.value })}
                >
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-bold uppercase text-muted-foreground">
                Subject *
                <select
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm font-normal text-foreground normal-case outline-none focus:ring-2 focus:ring-primary/20"
                  value={draft.subject}
                  onChange={e => setDraft({ ...draft, subject: e.target.value })}
                >
                  <option value="">Select subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code || "Subject"})</option>)}
                </select>
              </label>

              <label className="block text-xs font-bold uppercase text-muted-foreground">
                Teacher
                <select
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm font-normal text-foreground normal-case outline-none focus:ring-2 focus:ring-primary/20"
                  value={draft.teacher}
                  onChange={e => setDraft({ ...draft, teacher: e.target.value })}
                >
                  <option value="">Unassigned</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-bold uppercase text-muted-foreground">
                  One-hour lesson slot *
                  <select
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm font-normal text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                    value={draft.period_start}
                    onChange={e => {
                      const slot = lessonSlots.find(option => option.start === e.target.value);
                      if (slot) setDraft({ ...draft, period_start: slot.start, period_end: slot.end });
                    }}
                  >
                    {!lessonSlots.some(slot => slot.start === draft.period_start) && <option value="">Choose a valid lesson slot</option>}
                    {lessonSlots.map(slot => <option key={slot.start} value={slot.start}>{slot.start}–{slot.end}</option>)}
                  </select>
                </label>
                <div className="text-xs font-bold uppercase text-muted-foreground">
                  End time
                  <p className="mt-1 rounded-xl border border-border bg-secondary/40 p-2.5 text-sm font-medium text-foreground">{draft.period_end}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Lessons run 07:40–10:40, 11:10–13:10, and 14:00–16:00. Break is 10:40–11:10; lunch is 13:10–14:00.</p>

              <label className="block text-xs font-bold uppercase text-muted-foreground">
                Room / Venue
                <input
                  type="text"
                  placeholder="e.g. Lab 2, Room 14"
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm font-normal text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                  value={draft.room}
                  onChange={e => setDraft({ ...draft, room: e.target.value })}
                />
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1 rounded-xl">
                Cancel
              </Button>
              <Button variant="gold" onClick={() => void save()} className="flex-1 rounded-xl font-bold">
                {editingId ? "Save Changes" : "Save Period"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetableSection;
