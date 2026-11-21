import { DashboardTable } from "@/components/dashboard/DashboardTable";
import { useTableNavigation } from "@/hooks/useTableNavigation";
import { useEffect, useMemo, useState } from "react";
import { Check, Pencil, Plus, Trash2, Users, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { StudentPortalCredentialsDialog, type StudentPortalCredentials } from "@/components/admin/StudentPortalCredentials";
import { getErrorMessage } from "@/lib/api";
import { useCreateStudent, useDeleteStudent, useUpdateStudent, type SchoolClass, type Student } from "@/lib/hooks";
import ModalShell from "@/components/ui/modal-shell";

type Props = { classes: SchoolClass[]; students: Student[] };
type StudentDraft = {
  name: string;
  gender: string;
  date_of_birth: string;
  address: string;
  next_of_kin: { name: string; relationship: string; phone: string; email: string; address: string };
};
const emptyDraft: StudentDraft = {
  name: "",
  gender: "",
  date_of_birth: "",
  address: "",
  next_of_kin: { name: "", relationship: "", phone: "", email: "", address: "" },
};

type RowEdit = { name: string; gender: string; date_of_birth: string; address: string; status: string };

const ClassRegisterSection = ({ classes, students }: Props) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [rowEdit, setRowEdit] = useState<RowEdit>({ name: "", gender: "", date_of_birth: "", address: "", status: "Active" });
  const updateStudent = useUpdateStudent();
  const [classId, setClassId] = useState<number | "">(classes[0]?.id ?? "");
  const [draft, setDraft] = useState<StudentDraft>(emptyDraft);
  const [showAddForm, setShowAddForm] = useState(false);
  const [portalCredentials, setPortalCredentials] = useState<StudentPortalCredentials | null>(null);
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

  const [studentSearch, setStudentSearch] = useState("");
  const tableNavigation = useTableNavigation(classStudents.filter(student => `${student.name} ${student.student_id}`.toLowerCase().includes(studentSearch.toLowerCase())), `${classId}|${studentSearch}`);

  const addStudent = async () => {
    if (!selectedClass || !draft.name.trim()) {
      toast.error("Enter the student's name and select a class.");
      return;
    }
    if (!draft.next_of_kin.name.trim() || !draft.next_of_kin.relationship.trim() || !draft.next_of_kin.phone.trim()) {
      toast.error("Enter the next of kin's name, relationship, and phone number.");
      return;
    }
    const payload: Partial<Student> = {
      name: draft.name.trim(),
      school_class: selectedClass.id,
      gender: draft.gender,
      status: "Active",
      address: draft.address.trim(),
      next_of_kin_details: {
        name: draft.next_of_kin.name.trim(),
        relationship: draft.next_of_kin.relationship.trim(),
        phone: draft.next_of_kin.phone.trim(),
        email: draft.next_of_kin.email.trim(),
        address: draft.next_of_kin.address.trim(),
      },
      ...(draft.date_of_birth ? { date_of_birth: draft.date_of_birth } : {}),
    };
    try {
      const created = await createStudent.mutateAsync(payload);
      setDraft(emptyDraft);
      setShowAddForm(false);
      toast.success(`${created.name} added to ${selectedClass.name} with ID ${created.student_id}.`);
      if (created.portal_credentials) setPortalCredentials(created.portal_credentials);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const startEdit = (student: Student) => {
    setEditingId(student.id);
    setRowEdit({
      name: student.name,
      gender: student.gender || "",
      date_of_birth: student.date_of_birth || "",
      address: student.address || "",
      status: student.status || "Active",
    });
  };

  const saveEdit = async (student: Student) => {
    if (!rowEdit.name.trim()) {
      toast.error("The student's name cannot be empty.");
      return;
    }
    try {
      await updateStudent.mutateAsync({
        id: student.id,
        data: {
          name: rowEdit.name.trim(),
          gender: rowEdit.gender,
          status: rowEdit.status as Student["status"],
          address: rowEdit.address.trim(),
          // An empty date clears it; the server stores no date as null.
          date_of_birth: (rowEdit.date_of_birth || null) as Student["date_of_birth"],
        },
      });
      toast.success(`${rowEdit.name.trim()} updated.`);
      setEditingId(null);
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

      <Card><CardContent className="flex items-start gap-3 p-4 text-sm text-muted-foreground"><Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><p>Use Edit on a row to change a learner's details, including the house address; changes save directly to the school database and appear in the administrator portal. Removing a student sends an alert to the administrator.</p></CardContent></Card>

      {!selectedClass
        ? <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">No class has been assigned to you as class teacher yet.</p>
        : <div className="space-y-3"><Input aria-label="Search class students" placeholder="Search name or student ID…" value={studentSearch} onChange={event => setStudentSearch(event.target.value)} className="max-w-sm" /><DashboardTable navigation={tableNavigation} label="Class register"><table className="w-full min-w-[980px]">
          <thead className="bg-secondary/50"><tr>{["Student ID", "Student", "Gender", "Date of birth", "House address", "Status", "Actions"].map(label => <th key={label} className="px-4 py-3 text-left text-sm font-semibold">{label}</th>)}</tr></thead>
          <tbody className="divide-y divide-border">{tableNavigation.visibleRows.map(student => {
            const editing = editingId === student.id;
            const field = "w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm";
            return <tr key={student.id} className={editing ? "bg-accent/5" : undefined}>
              <td className="px-4 py-3 font-mono text-sm">{student.student_id || "—"}</td>
              {editing ? <>
                <td className="px-4 py-2"><input aria-label="Student name" className={field} value={rowEdit.name} onChange={event => setRowEdit({ ...rowEdit, name: event.target.value })} /></td>
                <td className="px-4 py-2"><select aria-label="Gender" className={field} value={rowEdit.gender} onChange={event => setRowEdit({ ...rowEdit, gender: event.target.value })}><option value="">—</option><option value="Female">Female</option><option value="Male">Male</option><option value="Other">Other</option></select></td>
                <td className="px-4 py-2"><input aria-label="Date of birth" type="date" className={field} value={rowEdit.date_of_birth} onChange={event => setRowEdit({ ...rowEdit, date_of_birth: event.target.value })} /></td>
                <td className="px-4 py-2"><input aria-label="House address" className={field} value={rowEdit.address} onChange={event => setRowEdit({ ...rowEdit, address: event.target.value })} /></td>
                <td className="px-4 py-2"><select aria-label="Status" className={field} value={rowEdit.status} onChange={event => setRowEdit({ ...rowEdit, status: event.target.value })}><option value="Active">Active</option><option value="Inactive">Inactive</option></select></td>
                <td className="px-4 py-2"><div className="flex gap-2">
                  <Button variant="gold" size="sm" disabled={updateStudent.isPending} onClick={() => void saveEdit(student)}><Check className="mr-1 h-4 w-4" />{updateStudent.isPending ? "Saving…" : "Save"}</Button>
                  <Button variant="outline" size="sm" disabled={updateStudent.isPending} onClick={() => setEditingId(null)}><X className="mr-1 h-4 w-4" />Cancel</Button>
                </div></td>
              </> : <>
                <td className="px-4 py-3 font-medium">{student.name}</td>
                <td className="px-4 py-3 text-sm">{student.gender || "—"}</td>
                <td className="px-4 py-3 text-sm">{student.date_of_birth || "—"}</td>
                <td className="max-w-[16rem] px-4 py-3 text-sm">{student.address || "—"}</td>
                <td className="px-4 py-3 text-sm">{student.status}</td>
                <td className="px-4 py-3"><div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => startEdit(student)}><Pencil className="mr-2 h-4 w-4" />Edit</Button>
                  <Button variant="outline" size="sm" disabled={deleteStudent.isPending} onClick={() => void removeStudent(student)}><Trash2 className="mr-2 h-4 w-4 text-destructive" />Remove</Button>
                </div></td>
              </>}
            </tr>;
          })}
            {tableNavigation.total === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No students match this class or search.</td></tr>}
          </tbody>
        </table></DashboardTable></div>}

      {showAddForm && <ModalShell onClose={() => setShowAddForm(false)} overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-xl bg-card p-6">
        <div><h3 className="text-xl font-bold">Add a student</h3><p className="text-sm text-muted-foreground">Class: {selectedClass?.name}. Student ID is generated automatically.</p></div>
        <label className="block text-sm">Full name<Input autoComplete="name" value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">Gender<select className="mt-1 w-full rounded-lg border border-border bg-background p-2" value={draft.gender} onChange={event => setDraft({ ...draft, gender: event.target.value })}><option value="">Select</option><option value="Female">Female</option><option value="Male">Male</option><option value="Other">Other</option></select></label>
          <label className="block text-sm">Date of birth<Input type="date" value={draft.date_of_birth} onChange={event => setDraft({ ...draft, date_of_birth: event.target.value })} /></label>
        </div>
        <label className="block text-sm">Address<Input value={draft.address} onChange={event => setDraft({ ...draft, address: event.target.value })} /></label>
        <div className="space-y-3 rounded-xl border border-border p-4">
          <div><h4 className="font-semibold">Next of kin</h4><p className="text-xs text-muted-foreground">Name, relationship, and phone number are required.</p></div>
          <label className="block text-sm">Full name<Input autoComplete="name" required value={draft.next_of_kin.name} onChange={event => setDraft({ ...draft, next_of_kin: { ...draft.next_of_kin, name: event.target.value } })} /></label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">Relationship<Input required placeholder="Parent, guardian, aunt…" value={draft.next_of_kin.relationship} onChange={event => setDraft({ ...draft, next_of_kin: { ...draft.next_of_kin, relationship: event.target.value } })} /></label>
            <label className="block text-sm">Phone number<Input autoComplete="tel" type="tel" required value={draft.next_of_kin.phone} onChange={event => setDraft({ ...draft, next_of_kin: { ...draft.next_of_kin, phone: event.target.value } })} /></label>
          </div>
          <label className="block text-sm">Email (optional)<Input autoComplete="email" type="email" value={draft.next_of_kin.email} onChange={event => setDraft({ ...draft, next_of_kin: { ...draft.next_of_kin, email: event.target.value } })} /></label>
          <label className="block text-sm">Address (optional)<Input autoComplete="street-address" value={draft.next_of_kin.address} onChange={event => setDraft({ ...draft, next_of_kin: { ...draft.next_of_kin, address: event.target.value } })} /></label>
        </div>
        <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button><Button variant="gold" disabled={!draft.name.trim() || createStudent.isPending} onClick={() => void addStudent()}>{createStudent.isPending ? "Saving…" : "Save Student"}</Button></div>
      </ModalShell>}
      {portalCredentials && <StudentPortalCredentialsDialog credentials={portalCredentials} onClose={() => setPortalCredentials(null)} />}
    </div>
  );
};

export default ClassRegisterSection;
