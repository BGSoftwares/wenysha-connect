import React, { useEffect, useState } from 'react';

interface StudentDetailProps {
  open: boolean;
  onClose: () => void;
  student: any | null;
  classes?: any[];
  onSave?: (id: number | string, data: Record<string, any>) => Promise<void>;
}

const StudentDetailDrawer = ({ open, onClose, student, classes = [], onSave }: StudentDetailProps) => {
  const [form, setForm] = useState<any>(() => ({
    name: student?.name ?? '',
    student_id: student?.student_id ?? '',
    school_class: student?.school_class ?? student?.class_name ?? '',
    gender: student?.gender ?? '',
    status: student?.status ?? '',
    date_of_birth: student?.date_of_birth ?? '',
    address: student?.address ?? '',
  }));
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setForm({
      name: student?.name ?? '',
      student_id: student?.student_id ?? '',
      school_class: student?.school_class ?? student?.class_name ?? '',
      gender: student?.gender ?? '',
      status: student?.status ?? '',
      date_of_birth: student?.date_of_birth ?? '',
      address: student?.address ?? '',
    });
  }, [student]);

  if (!open || !student) return null;

  const handleSave = async () => {
    if (!onSave) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    // basic validation
    if (!form.name || !form.student_id) {
      setErrorMsg('Name and Student ID are required');
      return;
    }
    const idPattern = /^[A-Za-z0-9\-]{3,}$/;
    if (!idPattern.test(form.student_id)) {
      setErrorMsg('Student ID must be at least 3 characters and contain only letters, numbers, or dashes');
      return;
    }

    setSaving(true);
    try {
      await onSave(student.id, form);
      setSuccessMsg('Saved successfully');
      // delay close so user sees success
      setTimeout(() => onClose(), 800);
    } catch (err: any) {
      setErrorMsg(String(err?.message ?? 'Save failed'));
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <aside className="ml-auto w-full max-w-md bg-card h-full border-l border-border p-6 overflow-auto shadow-2xl transform transition-transform">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-heading text-lg font-bold">Student Profile</h3>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground p-2 rounded hover:bg-secondary/10">✕</button>
        </div>

        <div className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded">{errorMsg}</div>
          )}
          {successMsg && (
            <div className="p-3 bg-green-50 text-green-800 text-sm rounded">{successMsg}</div>
          )}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Full Name</label>
            <input className="w-full p-2 rounded border border-border bg-background focus:ring-2 focus:ring-primary/20" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Student ID</label>
            <input className="w-full p-2 rounded border border-border bg-background focus:ring-2 focus:ring-primary/20" value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })} />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Class</label>
            <select className="w-full p-2 rounded border border-border bg-background focus:ring-2 focus:ring-primary/20" value={String(form.school_class)} onChange={e => setForm({ ...form, school_class: e.target.value })}>
              <option value="">Select</option>
              {classes.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Gender</label>
              <select className="w-full p-2 rounded border border-border bg-background focus:ring-2 focus:ring-primary/20" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <select className="w-full p-2 rounded border border-border bg-background focus:ring-2 focus:ring-primary/20" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Date of Birth</label>
            <input type="date" className="w-full p-2 rounded border border-border bg-background focus:ring-2 focus:ring-primary/20" value={form.date_of_birth || ''} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Address</label>
            <textarea className="w-full p-2 rounded border border-border bg-background focus:ring-2 focus:ring-primary/20" value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} />
          </div>

          <div className="flex gap-3 pt-4">
            <button onClick={onClose} className="px-4 py-2 rounded border border-border text-sm">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded bg-gold text-foreground text-sm font-semibold shadow-sm">{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default StudentDetailDrawer;
