import type { LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, Clock, FileText, Plus, Search, XCircle, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

type Application = {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  gender: string;
  date_of_birth: string | null;
  address: string;
  previous_school: string;
  guardian_name: string;
  guardian_phone: string;
  applying_for: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

type Draft = Omit<Application, "id" | "status" | "created_at">;

const empty: Draft = {
  full_name: "",
  email: "",
  phone: "",
  gender: "Male",
  date_of_birth: "",
  address: "",
  previous_school: "",
  guardian_name: "",
  guardian_phone: "",
  applying_for: "",
};

const path = "/admissions/admissions/";
const rows = (x: Application[] | { results?: Application[] }) => (Array.isArray(x) ? x : x.results ?? []);

const AdmissionSection = () => {
  const client = useQueryClient();
  const { data = [], isLoading, error } = useQuery({
    queryKey: ["admin-applications"],
    queryFn: async () => rows(await api.get<Application[] | { results?: Application[] }>(path)),
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(empty);
  const [editingApplication, setEditingApplication] = useState<Application | null>(null);

  const refresh = () => client.invalidateQueries({ queryKey: ["admin-applications"] });

  const create = useMutation({
    mutationFn: () => api.post(path, draft),
    onSuccess: () => {
      void refresh();
      setOpen(false);
      setDraft(empty);
      toast.success("Application recorded");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const update = useMutation({
    mutationFn: (updated: Application) => api.patch(`${path}${updated.id}/`, updated),
    onSuccess: () => {
      void refresh();
      setEditingApplication(null);
      toast.success("Application details updated");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: Application["status"] }) =>
      api.patch(`${path}${id}/`, { status }),
    onSuccess: () => {
      void refresh();
      toast.success("Application status updated");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`${path}${id}/`),
    onSuccess: () => {
      void refresh();
      toast.success("Application deleted");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const filtered = useMemo(
    () =>
      data.filter(
        (a) =>
          (statusFilter === "all" || a.status === statusFilter) &&
          `${a.full_name} ${a.email} ${a.applying_for} ${a.guardian_name}`.toLowerCase().includes(search.toLowerCase())
      ),
    [data, search, statusFilter]
  );

  const submitCreate = () => {
    if (!draft.full_name.trim() || !draft.email.trim() || !draft.guardian_name.trim() || !draft.guardian_phone.trim()) {
      toast.error("Applicant and guardian contact details are required");
      return;
    }
    create.mutate();
  };

  const submitEdit = () => {
    if (!editingApplication) return;
    if (!editingApplication.full_name.trim() || !editingApplication.email.trim()) {
      toast.error("Full name and email are required");
      return;
    }
    update.mutate(editingApplication);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-bold">Student Admissions</h2>
          <p className="text-sm text-muted-foreground">Review and edit applications saved in the Able God College database</p>
        </div>
        <Button variant="gold" onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Record Application
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {(
          [
            ["Total", data.length, FileText],
            ["Approved", data.filter((a) => a.status === "approved").length, CheckCircle],
            ["Pending", data.filter((a) => a.status === "pending").length, Clock],
            ["Rejected", data.filter((a) => a.status === "rejected").length, XCircle],
          ] as [string, number, LucideIcon][]
        ).map(([label, count, Icon]) => (
          <Card key={String(label)}>
            <CardContent className="flex items-center gap-3 p-4">
              <Icon className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-10" placeholder="Search applicants, guardians..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="rounded-lg border bg-background px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {isLoading ? (
        <p className="py-10 text-center text-muted-foreground">Loading applications…</p>
      ) : error ? (
        <p className="rounded-xl border border-destructive/30 p-5 text-destructive">Unable to load admissions: {getErrorMessage(error)}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[850px]">
            <thead className="bg-secondary/50">
              <tr>
                {["Applicant", "Applying for", "Guardian", "Contact", "Submitted", "Status", "Actions"].map((x) => (
                  <th key={x} className="px-4 py-3 text-left text-sm font-semibold">
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-t hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{a.full_name}</div>
                    <div className="text-xs text-muted-foreground">{a.email}</div>
                  </td>
                  <td className="px-4 py-3">{a.applying_for || "—"}</td>
                  <td className="px-4 py-3">{a.guardian_name || "—"}</td>
                  <td className="px-4 py-3">{a.guardian_phone || a.phone || "—"}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <select
                      className="rounded border bg-background p-1 text-xs"
                      value={a.status}
                      onChange={(e) => updateStatus.mutate({ id: a.id, status: e.target.value as Application["status"] })}
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label={`Edit ${a.full_name}`}
                        onClick={() => setEditingApplication({ ...a })}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label={`Delete ${a.full_name}`}
                        onClick={() => window.confirm(`Delete the application for ${a.full_name}?`) && remove.mutate(a.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No matching applications in the database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Record New Application Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setOpen(false)}>
          <div className="max-h-[90vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-xl bg-card border border-border p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold">Record New Application</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {(["full_name", "email", "phone", "gender", "date_of_birth", "applying_for", "guardian_name", "guardian_phone", "previous_school", "address"] as const).map((key) => (
                <label key={key} className="block text-sm capitalize">
                  {key.replaceAll("_", " ")}
                  <Input
                    type={key === "email" ? "email" : key === "date_of_birth" ? "date" : "text"}
                    value={draft[key] ?? ""}
                    onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                  />
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="gold" disabled={create.isPending} onClick={submitCreate}>
                {create.isPending ? "Saving…" : "Save Application"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Application Modal */}
      {editingApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setEditingApplication(null)}>
          <div className="max-h-[90vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-xl bg-card border border-border p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-border pb-3">
              <h3 className="text-xl font-bold">Edit Student Application</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Modify admission records, applicant info, and guardian details</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                Full Name
                <Input
                  value={editingApplication.full_name}
                  onChange={(e) => setEditingApplication({ ...editingApplication, full_name: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                Email
                <Input
                  type="email"
                  value={editingApplication.email}
                  onChange={(e) => setEditingApplication({ ...editingApplication, email: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                Phone
                <Input
                  value={editingApplication.phone}
                  onChange={(e) => setEditingApplication({ ...editingApplication, phone: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                Gender
                <select
                  className="mt-1 w-full rounded-lg border border-border bg-background p-2 text-sm"
                  value={editingApplication.gender}
                  onChange={(e) => setEditingApplication({ ...editingApplication, gender: e.target.value })}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </label>
              <label className="block text-sm">
                Date of Birth
                <Input
                  type="date"
                  value={editingApplication.date_of_birth ? editingApplication.date_of_birth.slice(0, 10) : ""}
                  onChange={(e) => setEditingApplication({ ...editingApplication, date_of_birth: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                Applying For (Class / Form)
                <Input
                  value={editingApplication.applying_for}
                  onChange={(e) => setEditingApplication({ ...editingApplication, applying_for: e.target.value })}
                  placeholder="e.g. Form 1, Form 2"
                />
              </label>
              <label className="block text-sm">
                Guardian Name
                <Input
                  value={editingApplication.guardian_name}
                  onChange={(e) => setEditingApplication({ ...editingApplication, guardian_name: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                Guardian Phone
                <Input
                  value={editingApplication.guardian_phone}
                  onChange={(e) => setEditingApplication({ ...editingApplication, guardian_phone: e.target.value })}
                />
              </label>
              <label className="block text-sm sm:col-span-2">
                Previous School
                <Input
                  value={editingApplication.previous_school}
                  onChange={(e) => setEditingApplication({ ...editingApplication, previous_school: e.target.value })}
                />
              </label>
              <label className="block text-sm sm:col-span-2">
                Home Address
                <Input
                  value={editingApplication.address}
                  onChange={(e) => setEditingApplication({ ...editingApplication, address: e.target.value })}
                />
              </label>
              <label className="block text-sm sm:col-span-2">
                Application Status
                <select
                  className="mt-1 w-full rounded-lg border border-border bg-background p-2 text-sm"
                  value={editingApplication.status}
                  onChange={(e) => setEditingApplication({ ...editingApplication, status: e.target.value as Application["status"] })}
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button variant="outline" onClick={() => setEditingApplication(null)}>
                Cancel
              </Button>
              <Button variant="gold" disabled={update.isPending} onClick={submitEdit}>
                {update.isPending ? "Saving changes…" : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdmissionSection;
