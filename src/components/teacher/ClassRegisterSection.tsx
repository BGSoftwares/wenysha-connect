import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { getErrorMessage } from "@/lib/api";
import { useCreateStudent, useDeleteStudent, type SchoolClass, type Student } from "@/lib/hooks";

type Props = { classes: SchoolClass[]; students: Student[] };
type StudentDraft = { name: string; gender: string; date_of_birth: string; address: string };
const emptyDraft: StudentDraft = { name: "", gender: "", date_of_birth: "", address: "" };

const ClassRegisterSection = ({ classes, students }: Props) => {
  const [classId, setClassId] = useState<number | "">(classes[0]?.id ?? "");
  const [draft, setDraft] = useState<StudentDraft>(emptyDraft);
  const [showAddForm, setShowAddForm] = useState(false);
  const createStudent = useCreateStudent();
  const deleteStudent = useDeleteStudent();

  useEffect(() => {
    if (!classes.some(schoolClass => schoolClass.id === classId)) setClassId(classes[0]?.id ?? "");
  }, [classId, classes]);

  const selectedClass = classes.find(schoolClass => schoolClass.id === classId);
  const classStudents = useMemo(
    () => students.filter(student => student.school_class === classId),
    [students, classId],
  );

  const addStudent = async () => {
    if (!selectedClass || !draft.name.trim()) {
      toast.error("Enter the student's name and select a class.");
      return;
    }
    const payload: Partial<Student> = {
      name: draft.name.trim(),
      school_class: selectedClass.id,
      gender: draft.gender,
      status: "Active",
      address: draft.address.trim(),
      ...(draft.date_of_birth ? { date_of_birth: draft.date_of_birth } : {}),
    };
    try {
      await createStudent.mutateAsync(payload);
      setDraft(emptyDraft);
      setShowAddForm(false);
      toast.success(`${draft.name.trim()} added to ${selectedClass.name}.`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const removeStudent = async (student: Student) => {
    if (!window.confirm(`Remove ${student.name} from ${selectedClass?.name}? The administrator will receive an alert.`)) return;
    try {
      await deleteStudent.mutateAsync(student.id);
      toast.success("Student removed. The administrator has been alerted.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-bold">Class Register</h2>
          <p className="text-sm text-muted-foreground">Manage students in classes assigned to you as class teacher.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select aria-label="Select your class" className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" value={classId} onChange={event => setClassId(Number(event.target.value))}>
            {classes.map(schoolClass => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>)}
          </select>
          <Button variant="gold" disabled={!selectedClass} onClick={() => setShowAddForm(true)}><Plus className="mr-2 h-4 w-4" />Add Student</Button>
        </div>
      </div>

      <Card><CardContent className="flex items-start gap-3 p-4 text-sm text-muted-foreground"><Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><p>Changes save directly to the school database and appear in the administrator portal. Removing a student sends an alert to the administrator.</p></CardContent></Card>

      {!selectedClass
        ? <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">No class has been assigned to you as class teacher yet.</p>
        : <div className="overflow-x-auto rounded-xl border bg-card"><table className="w-full min-w-[680px]">
          <thead className="bg-secondary/50"><tr>{["Student ID", "Student", "Gender", "Date of birth", "Status", "Actions"].map(label => <th key={label} className="px-4 py-3 text-left text-sm font-semibold">{label}</th>)}</tr></thead>
          <tbody className="divide-y divide-border">{classStudents.map(student => <tr key={student.id}>
            <td className="px-4 py-3 font-mono text-sm">{student.student_id || "—"}</td>
            <td className="px-4 py-3 font-medium">{student.name}</td>
            <td className="px-4 py-3 text-sm">{student.gender || "—"}</td>
            <td className="px-4 py-3 text-sm">{student.date_of_birth || "—"}</td>
            <td className="px-4 py-3 text-sm">{student.status}</td>
            <td className="px-4 py-3"><Button variant="outline" size="sm" disabled={deleteStudent.isPending} onClick={() => void removeStudent(student)}><Trash2 className="mr-2 h-4 w-4 text-destructive" />Remove</Button></td>
          </tr>)}
            {classStudents.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No students are registered in {selectedClass.name} yet.</td></tr>}
          </tbody>
        </table></div>}

      {showAddForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowAddForm(false)}><div className="w-full max-w-lg space-y-4 rounded-xl bg-card p-6" onClick={event => event.stopPropagation()}>
        <div><h3 className="text-xl font-bold">Add a student</h3><p className="text-sm text-muted-foreground">Class: {selectedClass?.name}. Student ID is generated automatically.</p></div>
        <label className="block text-sm">Full name<Input autoComplete="name" value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">Gender<select className="mt-1 w-full rounded-lg border border-border bg-background p-2" value={draft.gender} onChange={event => setDraft({ ...draft, gender: event.target.value })}><option value="">Select</option><option value="Female">Female</option><option value="Male">Male</option><option value="Other">Other</option></select></label>
          <label className="block text-sm">Date of birth<Input type="date" value={draft.date_of_birth} onChange={event => setDraft({ ...draft, date_of_birth: event.target.value })} /></label>
        </div>
        <label className="block text-sm">Address<Input value={draft.address} onChange={event => setDraft({ ...draft, address: event.target.value })} /></label>
        <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button><Button variant="gold" disabled={!draft.name.trim() || createStudent.isPending} onClick={() => void addStudent()}>{createStudent.isPending ? "Saving…" : "Save Student"}</Button></div>
      </div></div>}
    </div>
  );
};

export default ClassRegisterSection;
