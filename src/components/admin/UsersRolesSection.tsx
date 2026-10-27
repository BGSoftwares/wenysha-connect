import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, KeyRound, Plus, Search, Shield, Trash2, UserPlus, UserX } from "lucide-react";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/lib/api";
import { fetchAllPages, useClasses, useSubjects, type SchoolClass, type Subject } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { normalizePortalRole } from "@/lib/portalRoles";
import { StudentPortalCredentialsDialog, type StudentPortalCredentials } from "@/components/admin/StudentPortalCredentials";

type Role = { id: number; name: string; description: string; permissions: string[]; users_count: number };
type Allocation = { subject: number; school_class: number };
type AccountAllocation = { subject_id: number; subject__name: string; school_class_id: number; school_class__name: string };
type Account = {
  id: number; username: string; email: string; first_name: string; last_name: string; full_name: string;
  role: number | null; role_name: string; phone: string; department: string; access_level: string;
  stream: string; student_id: string; student_class: number | null; student_class_name: string;
  allocations: AccountAllocation[]; role_change_allowed: boolean; is_active: boolean; is_staff: boolean; date_joined: string; last_login: string | null;
};
type AccountDraft = {
  id?: number; mode: "create" | "edit" | "password"; first_name: string; last_name: string;
  username: string; email: string; role: string; password: string; is_active: boolean;
  phone: string; department: string; access_level: string; student_class: string; stream: string;
  student_id: string; guardian_name: string; guardian_relationship: string; guardian_phone: string;
  guardian_email: string; guardian_address: string; teaching_allocations: Allocation[];
};
type RoleDraft = { id?: number; name: string; description: string };
type AccountResponse = Account & { portal_credentials?: StudentPortalCredentials };

const rows = <T,>(value: T[] | { results?: T[] }) => Array.isArray(value) ? value : value.results ?? [];
const emptyAccounts: Account[] = [];
const emptyRoles: Role[] = [];
const emptySubjects: Subject[] = [];
const fixedSections = ["All accounts", "Administration", "Accounts", "Parents", "Sciences", "Arts", "Commercials", "Teachers", "Students"];
const blankDraft = (department = ""): AccountDraft => ({
  mode: "create", first_name: "", last_name: "", username: "", email: "", role: "", password: "", is_active: true,
  phone: "", department, access_level: "Full access", student_class: "", stream: "", student_id: "",
  guardian_name: "", guardian_relationship: "", guardian_phone: "", guardian_email: "", guardian_address: "",
  teaching_allocations: [],
});

const UsersRolesSection = ({ activeSubNav }: { activeSubNav: string }) => {
  const client = useQueryClient();
  const [search, setSearch] = useState("");
  const [section, setSection] = useState("All accounts");
  const [roleFilter, setRoleFilter] = useState("all");
  const [accountDraft, setAccountDraft] = useState<AccountDraft | null>(null);
  const [roleDraft, setRoleDraft] = useState<RoleDraft | null>(null);
  const [credentials, setCredentials] = useState<StudentPortalCredentials | null>(null);
  const isRoleView = activeSubNav === "roles";
  const { data: classesQuery } = useClasses();
  const { data: subjectsQuery } = useSubjects();
  const classes: SchoolClass[] = classesQuery ?? [];
  const subjects = subjectsQuery ?? emptySubjects;

  const accountsQuery = useQuery({
    queryKey: ["admin-accounts"],
    queryFn: () => fetchAllPages<Account>("/auth/accounts/"),
    refetchInterval: 15000,
  });
  const rolesQuery = useQuery({
    queryKey: ["admin-roles"],
    queryFn: async () => rows(await api.get<Role[] | { results?: Role[] }>("/auth/roles/")),
  });
  const refresh = () => {
    for (const key of ["admin-accounts", "admin-roles", "teachers", "teacher-profile", "parents", "parent-profile", "students", "student-profile", "allocations"])
      void client.invalidateQueries({ queryKey: [key] });
  };
  const accounts = accountsQuery.data ?? emptyAccounts;
  const roles = rolesQuery.data ?? emptyRoles;
  const editingAccount = accountDraft?.id ? accounts.find(account => account.id === accountDraft.id) : undefined;
  const selectedRole = accountDraft ? roles.find(role => String(role.id) === accountDraft.role) : undefined;
  const selectedRoleName = selectedRole?.name ?? accounts.find(account => account.id === accountDraft?.id)?.role_name ?? "";
  const portalRole = normalizePortalRole(selectedRoleName);
  const availableCreateRoles = roles.filter(role => ["admin", "teacher", "student", "parent", "accounts"].includes(normalizePortalRole(role.name) ?? ""));
  const roleOptions = accountDraft?.id
    ? roles.filter(role => role.id === editingAccount?.role || (editingAccount?.role_change_allowed && normalizePortalRole(role.name) !== "student"))
    : availableCreateRoles;

  const saveAccount = useMutation({
    mutationFn: async (draft: AccountDraft) => {
      const selected = roles.find(role => String(role.id) === draft.role);
      const kind = normalizePortalRole(selected?.name ?? accounts.find(account => account.id === draft.id)?.role_name);
      const fullName = `${draft.first_name.trim()} ${draft.last_name.trim()}`.trim();
      const payload: Record<string, unknown> = {
        first_name: draft.first_name.trim(), last_name: draft.last_name.trim(), full_name: fullName,
        email: draft.email.trim(), role: Number(draft.role), is_active: draft.is_active,
        department: draft.department.trim(), phone: draft.phone.trim(),
      };
      if (draft.password) payload.password = draft.password;
      if (kind === "student") {
        payload.student_class = Number(draft.student_class);
        payload.stream = draft.stream.trim();
        if (!draft.id) {
          payload.guardian_name = draft.guardian_name.trim();
          payload.guardian_relationship = draft.guardian_relationship.trim();
          payload.guardian_phone = draft.guardian_phone.trim();
          payload.guardian_email = draft.guardian_email.trim();
          payload.guardian_address = draft.guardian_address.trim();
          if (draft.student_id.trim()) payload.student_id = draft.student_id.trim();
        }
      } else {
        payload.username = draft.username.trim();
        if (kind === "teacher") payload.teaching_allocations = draft.teaching_allocations;
        if (kind === "admin") payload.access_level = draft.access_level.trim() || "Full access";
      }
      return draft.id
        ? api.patch<AccountResponse>(`/auth/accounts/${draft.id}/`, payload)
        : api.post<AccountResponse>("/auth/accounts/", payload);
    },
    onSuccess: (result, draft) => {
      refresh();
      setAccountDraft(null);
      if (result.portal_credentials) setCredentials(result.portal_credentials);
      else toast.success(draft.mode === "password" ? "Password reset" : draft.id ? "Account updated" : "Account created");
    },
    onError: error => toast.error(getErrorMessage(error)),
  });
  const saveRole = useMutation({
    mutationFn: (draft: RoleDraft) => draft.id
      ? api.patch(`/auth/roles/${draft.id}/`, draft)
      : api.post("/auth/roles/", { ...draft, permissions: [] }),
    onSuccess: () => { refresh(); setRoleDraft(null); toast.success("Role saved"); },
    onError: error => toast.error(getErrorMessage(error)),
  });

  const deactivate = async (account: Account) => {
    if (!window.confirm(`Deactivate ${account.full_name || account.username}? The account and school records will be kept.`)) return;
    try { await api.delete(`/auth/accounts/${account.id}/`); refresh(); toast.success("Account deactivated"); }
    catch (error) { toast.error(getErrorMessage(error)); }
  };
  const permanentlyDelete = async (account: Account) => {
    if (!window.confirm(`Permanently delete ${account.full_name || account.username}? This cannot be undone. Linked school records are protected and will block deletion.`)) return;
    try { await api.delete(`/auth/accounts/${account.id}/permanent-delete/`); refresh(); toast.success("Account deleted"); }
    catch (error) { toast.error(getErrorMessage(error)); }
  };

  const departments = useMemo(() => Array.from(new Set([
    ...accounts.map(account => account.department.trim()),
    ...subjects.map(subject => subject.department.trim()),
  ].filter(Boolean))).sort(), [accounts, subjects]);
  const sections = Array.from(new Set([...fixedSections, ...departments.filter(dept => !fixedSections.includes(dept))]));
  const filteredAccounts = useMemo(() => accounts.filter(account => {
    const portal = normalizePortalRole(account.role_name);
    const matchesSection = section === "All accounts" ? true
      : section === "Administration" ? portal === "admin"
      : section === "Accounts" ? portal === "accounts"
      : section === "Parents" ? portal === "parent"
      : section === "Students" ? portal === "student"
      : section === "Teachers" ? portal === "teacher"
      : account.department.trim().toLowerCase() === section.toLowerCase();
    const matchesRole = roleFilter === "all" || portal === roleFilter;
    const matchesSearch = `${account.full_name} ${account.username} ${account.email} ${account.role_name} ${account.phone} ${account.department} ${account.student_id}`.toLowerCase().includes(search.trim().toLowerCase());
    return matchesSection && matchesRole && matchesSearch;
  }), [accounts, roleFilter, search, section]);

  const openCreate = (department = "") => {
    const draft = blankDraft(department);
    const defaultRole = department.toLowerCase() === "administration" ? "admin"
      : department.toLowerCase() === "students" ? "student"
      : department.toLowerCase() === "parents" ? "parent"
      : department.toLowerCase() === "accounts" ? "accounts"
      : "teacher";
    const role = availableCreateRoles.find(item => normalizePortalRole(item.name) === defaultRole);
    if (role) draft.role = String(role.id);
    setAccountDraft(draft);
  };
  const openEdit = (account: Account) => {
    const nameParts = (account.full_name || `${account.first_name} ${account.last_name}`).trim().split(/\s+/);
    setAccountDraft({
      ...blankDraft(account.department), mode: "edit", id: account.id,
      first_name: account.first_name || nameParts[0] || "", last_name: account.last_name || nameParts.slice(1).join(" "),
      username: account.username, email: account.email, role: account.role ? String(account.role) : "", password: "",
      is_active: account.is_active, phone: account.phone || "", department: account.department || "",
      access_level: account.access_level || "Full access", student_class: account.student_class ? String(account.student_class) : "",
      stream: account.stream || "", student_id: account.student_id || "",
      teaching_allocations: account.allocations.map(allocation => ({ subject: allocation.subject_id, school_class: allocation.school_class_id })),
    });
  };
  const updateDraft = (key: keyof AccountDraft, value: string | boolean | Allocation[]) => {
    setAccountDraft(current => current ? { ...current, [key]: value } : current);
  };
  const addAllocation = () => updateDraft("teaching_allocations", [
    ...(accountDraft?.teaching_allocations ?? []),
    { subject: subjects[0]?.id ?? 0, school_class: classes[0]?.id ?? 0 },
  ]);
  const updateAllocation = (index: number, key: keyof Allocation, value: number) => {
    updateDraft("teaching_allocations", (accountDraft?.teaching_allocations ?? []).map((allocation, i) => i === index ? { ...allocation, [key]: value } : allocation));
  };
  const canSave = Boolean(accountDraft && accountDraft.first_name.trim() && accountDraft.last_name.trim() && accountDraft.role
    && (accountDraft.mode === "password" ? accountDraft.password.length >= 8 : portalRole === "student"
      ? accountDraft.student_class && (accountDraft.id || (accountDraft.guardian_name.trim() && accountDraft.guardian_phone.trim()))
      : accountDraft.username.trim() && accountDraft.email.trim() && (accountDraft.id ? !accountDraft.password || accountDraft.password.length >= 8 : accountDraft.password.length >= 8)
        && (portalRole !== "teacher" || (accountDraft.department.trim() && accountDraft.teaching_allocations.length > 0))
        && (portalRole !== "admin" || accountDraft.access_level.trim())));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="font-heading text-xl font-bold">Users &amp; Roles</h2><p className="text-sm text-muted-foreground">Create role-based accounts, assign teaching pairs, and manage access.</p></div>
        {isRoleView
          ? <Button variant="gold" onClick={() => setRoleDraft({ name: "", description: "" })}><Plus className="mr-2 h-4 w-4" />Add Role</Button>
          : <Button variant="gold" onClick={() => openCreate(section === "All accounts" ? "" : section)}><UserPlus className="mr-2 h-4 w-4" />Add User</Button>}
      </div>

      {accountsQuery.error || rolesQuery.error
        ? <p className="rounded-xl border border-destructive/30 p-5 text-destructive">Could not load account data: {getErrorMessage(accountsQuery.error || rolesQuery.error)}</p>
        : isRoleView
          ? rolesQuery.isLoading ? <p className="py-8 text-center text-muted-foreground">Loading roles…</p>
            : <div className="grid gap-4 md:grid-cols-2">{roles.map(role => <Card key={role.id}><CardContent className="flex items-start justify-between p-5"><div><h3 className="font-semibold"><Shield className="mr-2 inline h-4 w-4 text-primary" />{role.name}</h3><p className="mt-1 text-sm text-muted-foreground">{role.description || "No role description"}</p><p className="mt-3 text-xs text-muted-foreground">{role.users_count} linked account(s)</p></div><Button variant="outline" size="icon" aria-label={`Edit ${role.name} role`} onClick={() => setRoleDraft({ id: role.id, name: role.name, description: role.description })}><Edit className="h-4 w-4" /></Button></CardContent></Card>)}</div>
          : <>
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Account departments and groups">{sections.map(item => <button key={item} role="tab" aria-selected={section === item} onClick={() => setSection(item)} className={`rounded-full border px-4 py-2 text-sm transition-colors ${section === item ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-secondary"}`}>{item}</button>)}</div>
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-10" placeholder="Search name, username, email, department, or student ID" value={search} onChange={event => setSearch(event.target.value)} /></div><select aria-label="Filter accounts by role" className="rounded-lg border border-border bg-background px-3 py-2" value={roleFilter} onChange={event => setRoleFilter(event.target.value)}><option value="all">All roles</option>{["admin", "teacher", "student", "parent", "accounts"].map(role => <option key={role} value={role}>{role[0].toUpperCase() + role.slice(1)}</option>)}</select></div>
            {accountsQuery.isLoading ? <p className="py-8 text-center text-muted-foreground">Loading accounts…</p>
              : <div className="overflow-x-auto rounded-xl border bg-card"><table className="w-full min-w-[1120px]"><thead className="bg-secondary/50"><tr>{["Name", "Username / email", "Role", "Department", "Subjects / classes", "Status", "Actions"].map(label => <th key={label} className="px-4 py-3 text-left text-sm">{label}</th>)}</tr></thead><tbody>{filteredAccounts.map(account => <tr key={account.id} className="border-t align-top"><td className="px-4 py-3 font-medium">{account.full_name || account.username}</td><td className="px-4 py-3"><div>{account.username}</div><div className="text-xs text-muted-foreground">{account.email || "No email"}</div></td><td className="px-4 py-3">{account.role_name || "Unassigned"}</td><td className="px-4 py-3">{account.department || (normalizePortalRole(account.role_name) === "admin" ? "Administration" : normalizePortalRole(account.role_name) === "student" ? "Students" : "—")}</td><td className="max-w-[320px] px-4 py-3 text-xs">{account.allocations.length ? account.allocations.map(item => <div key={`${item.subject_id}-${item.school_class_id}`}>{item.subject__name} <span className="text-muted-foreground">· {item.school_class__name}</span></div>) : account.student_id ? <>{account.student_id}{account.student_class_name && <span className="text-muted-foreground"> · {account.student_class_name}{account.stream ? ` · ${account.stream}` : ""}</span>}</> : "—"}</td><td className="px-4 py-3">{account.is_active ? "Active" : "Inactive"}</td><td className="px-4 py-3"><div className="flex gap-1"><Button variant="outline" size="icon" aria-label={`Edit ${account.username}`} onClick={() => openEdit(account)}><Edit className="h-4 w-4" /></Button><Button variant="outline" size="icon" aria-label={`Reset password for ${account.username}`} onClick={() => setAccountDraft({ ...blankDraft(account.department), ...account, mode: "password", role: account.role ? String(account.role) : "", password: "", student_class: account.student_class ? String(account.student_class) : "", teaching_allocations: account.allocations.map(item => ({ subject: item.subject_id, school_class: item.school_class_id })) })}><KeyRound className="h-4 w-4" /></Button>{account.is_active && <Button variant="outline" size="icon" aria-label={`Deactivate ${account.username}`} onClick={() => void deactivate(account)}><UserX className="h-4 w-4 text-destructive" /></Button>}<Button variant="outline" size="icon" aria-label={`Delete ${account.username}`} onClick={() => void permanentlyDelete(account)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></td></tr>)}{filteredAccounts.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No accounts found in this section.</td></tr>}</tbody></table></div>}
          </>}

      {accountDraft && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setAccountDraft(null)}><div className="max-h-[92vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-xl bg-card p-6" onClick={event => event.stopPropagation()}>
        <div><h3 className="text-xl font-bold">{accountDraft.mode === "password" ? "Reset password" : accountDraft.id ? "Edit account" : "Add user"}</h3><p className="mt-1 text-sm text-muted-foreground">Passwords are hashed before storage. Student portal credentials are generated and shown once after creation.</p></div>
        {accountDraft.mode !== "password" && <>
          <div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm">First name<Input autoComplete="given-name" required value={accountDraft.first_name} onChange={event => updateDraft("first_name", event.target.value)} /></label><label className="block text-sm">Surname<Input autoComplete="family-name" required value={accountDraft.last_name} onChange={event => updateDraft("last_name", event.target.value)} /></label></div>
          <label className="block text-sm">Role<select className="mt-1 w-full rounded-lg border bg-background p-2" value={accountDraft.role} disabled={Boolean(accountDraft.id && !editingAccount?.role_change_allowed)} onChange={event => { updateDraft("role", event.target.value); }}><option value="">Select role</option>{roleOptions.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}</select>{accountDraft.id && !editingAccount?.role_change_allowed && <span className="text-xs text-muted-foreground">Role is locked because this account has linked school records.</span>}</label>
          {portalRole !== "student" && <label className="block text-sm">Username<Input autoComplete="username" required value={accountDraft.username} onChange={event => updateDraft("username", event.target.value)} /></label>}
          <div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm">Email{portalRole === "student" ? " (optional)" : ""}<Input type="email" autoComplete="email" required={portalRole !== "student"} value={accountDraft.email} onChange={event => updateDraft("email", event.target.value)} /></label><label className="block text-sm">Phone<Input type="tel" autoComplete="tel" value={accountDraft.phone} onChange={event => updateDraft("phone", event.target.value)} /></label></div>
          <label className="block text-sm">Department<Input list="account-departments" value={accountDraft.department} onChange={event => updateDraft("department", event.target.value)} placeholder="Sciences, Arts, Commercials…" /><datalist id="account-departments">{Array.from(new Set([...departments, ...subjects.map(subject => subject.department).filter(Boolean)])).map(value => <option key={value} value={value} />)}</datalist></label>
          {portalRole === "admin" && <label className="block text-sm">Access level<select className="mt-1 w-full rounded-lg border bg-background p-2" value={accountDraft.access_level} onChange={event => updateDraft("access_level", event.target.value)}><option>Full access</option></select></label>}
          {portalRole === "teacher" && <section className="space-y-3 rounded-lg border p-4"><div className="flex items-center justify-between"><div><h4 className="font-semibold">Subject-to-class assignments</h4><p className="text-xs text-muted-foreground">Choose each exact pair this teacher is allowed to teach.</p></div><Button type="button" variant="outline" onClick={addAllocation} disabled={!subjects.length || !classes.length}><Plus className="mr-1 h-4 w-4" />Add pair</Button></div>{accountDraft.teaching_allocations.map((allocation, index) => <div key={index} className="flex flex-wrap gap-2"><select aria-label={`Subject assignment ${index + 1}`} className="min-w-0 flex-1 rounded-lg border bg-background p-2" value={allocation.subject} onChange={event => updateAllocation(index, "subject", Number(event.target.value))}>{subjects.map(subject => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select><select aria-label={`Class assignment ${index + 1}`} className="min-w-0 flex-1 rounded-lg border bg-background p-2" value={allocation.school_class} onChange={event => updateAllocation(index, "school_class", Number(event.target.value))}>{classes.map(schoolClass => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>)}</select><Button type="button" variant="outline" onClick={() => updateDraft("teaching_allocations", accountDraft.teaching_allocations.filter((_, i) => i !== index))}>Remove</Button></div>)}</section>}
          {portalRole === "student" && <section className="space-y-3 rounded-lg border p-4"><h4 className="font-semibold">Student details</h4><label className="block text-sm">Class / form<select required className="mt-1 w-full rounded-lg border bg-background p-2" value={accountDraft.student_class} onChange={event => updateDraft("student_class", event.target.value)}><option value="">Select class</option>{classes.map(schoolClass => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>)}</select></label><div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm">Stream<Input value={accountDraft.stream} onChange={event => updateDraft("stream", event.target.value)} /></label><label className="block text-sm">Student number<input className="mt-1 w-full rounded-lg border bg-background p-2" value={accountDraft.student_id} onChange={event => updateDraft("student_id", event.target.value)} placeholder="Leave blank to generate" /></label></div>{!accountDraft.id && <><h5 className="pt-1 text-sm font-semibold">Guardian / next of kin</h5><div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm">Name<Input required value={accountDraft.guardian_name} onChange={event => updateDraft("guardian_name", event.target.value)} /></label><label className="block text-sm">Relationship<Input value={accountDraft.guardian_relationship} onChange={event => updateDraft("guardian_relationship", event.target.value)} placeholder="Parent / Guardian" /></label><label className="block text-sm">Phone<Input type="tel" required value={accountDraft.guardian_phone} onChange={event => updateDraft("guardian_phone", event.target.value)} /></label><label className="block text-sm">Email<Input type="email" value={accountDraft.guardian_email} onChange={event => updateDraft("guardian_email", event.target.value)} /></label><label className="block text-sm sm:col-span-2">Address<Input value={accountDraft.guardian_address} onChange={event => updateDraft("guardian_address", event.target.value)} /></label></div><p className="text-xs text-muted-foreground">A secure temporary password will be generated and displayed once after account creation.</p></>}</section>}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={accountDraft.is_active} onChange={event => updateDraft("is_active", event.target.checked)} />Account active</label>
        </>}
        <label className="block text-sm">{accountDraft.mode === "password" ? "New password" : accountDraft.id ? "Reset password (optional)" : portalRole === "student" ? "Student password is generated automatically" : "Initial password"}<Input type="password" autoComplete="new-password" minLength={8} disabled={portalRole === "student" && accountDraft.mode !== "password"} value={accountDraft.password} onChange={event => updateDraft("password", event.target.value)} placeholder={accountDraft.mode === "password" ? "At least 8 characters" : ""} /></label>
        <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setAccountDraft(null)}>Cancel</Button><Button variant="gold" disabled={saveAccount.isPending || !canSave} onClick={() => saveAccount.mutate(accountDraft)}>{saveAccount.isPending ? "Saving…" : accountDraft.mode === "password" ? "Reset password" : accountDraft.id ? "Save changes" : "Create account"}</Button></div>
      </div></div>}

      {roleDraft && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setRoleDraft(null)}><div className="w-full max-w-md space-y-4 rounded-xl bg-card p-6" onClick={event => event.stopPropagation()}><h3 className="text-xl font-bold">{roleDraft.id ? "Edit Role" : "Add Role"}</h3><label className="block text-sm">Role name<Input value={roleDraft.name} onChange={event => setRoleDraft({ ...roleDraft, name: event.target.value })} /></label><label className="block text-sm">Description<textarea className="mt-1 min-h-24 w-full rounded-lg border bg-background p-2" value={roleDraft.description} onChange={event => setRoleDraft({ ...roleDraft, description: event.target.value })} /></label><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setRoleDraft(null)}>Cancel</Button><Button variant="gold" disabled={saveRole.isPending || !roleDraft.name.trim()} onClick={() => saveRole.mutate(roleDraft)}>Save Role</Button></div></div></div>}
      {credentials && <StudentPortalCredentialsDialog credentials={credentials} onClose={() => setCredentials(null)} />}
    </div>
  );
};

export default UsersRolesSection;
