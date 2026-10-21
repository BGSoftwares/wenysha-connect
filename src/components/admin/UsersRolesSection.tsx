import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Plus, Search, Shield, UserPlus, UserX } from "lucide-react";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/lib/api";
import { fetchAllPages } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

type Role = { id: number; name: string; description: string; permissions: string[]; users_count: number };
type Account = {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: number | null;
  role_name: string;
  phone: string;
  is_active: boolean;
  is_staff: boolean;
  date_joined: string;
  last_login: string | null;
};
type AccountDraft = {
  id?: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  password: string;
  is_active: boolean;
};
type RoleDraft = { id?: number; name: string; description: string };

const rows = <T,>(value: T[] | { results?: T[] }) => Array.isArray(value) ? value : value.results ?? [];
const emptyAccounts: Account[] = [];
const emptyRoles: Role[] = [];

const UsersRolesSection = ({ activeSubNav }: { activeSubNav: string }) => {
  const client = useQueryClient();
  const [search, setSearch] = useState("");
  const [accountDraft, setAccountDraft] = useState<AccountDraft | null>(null);
  const [roleDraft, setRoleDraft] = useState<RoleDraft | null>(null);
  const isRoleView = activeSubNav === "roles";

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
    for (const key of ["admin-accounts", "admin-roles", "teachers", "teacher-profile", "parents", "parent-profile", "students", "student-profile"])
      void client.invalidateQueries({ queryKey: [key] });
  };

  const saveAccount = useMutation({
    mutationFn: (draft: AccountDraft) => {
      const payload = {
        username: draft.username.trim(),
        email: draft.email.trim(),
        full_name: draft.full_name.trim(),
        role: Number(draft.role),
        is_active: draft.is_active,
        ...(draft.password ? { password: draft.password } : {}),
      };
      return draft.id ? api.patch(`/auth/accounts/${draft.id}/`, payload) : api.post("/auth/accounts/", payload);
    },
    onSuccess: (_data, draft) => { refresh(); setAccountDraft(null); toast.success(draft.password ? "Account saved and password reset" : "Account saved"); },
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
    try {
      await api.delete(`/auth/accounts/${account.id}/`);
      refresh();
      toast.success("Account deactivated");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const accounts = accountsQuery.data ?? emptyAccounts;
  const roles = rolesQuery.data ?? emptyRoles;
  const filteredAccounts = useMemo(() => accounts.filter(account =>
    `${account.full_name} ${account.username} ${account.email} ${account.role_name} ${account.phone}`.toLowerCase().includes(search.toLowerCase()),
  ), [accounts, search]);

  const updateDraft = (key: keyof AccountDraft, value: string | boolean) => {
    setAccountDraft(current => current ? { ...current, [key]: value } : current);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-bold">Users &amp; Roles</h2>
          <p className="text-sm text-muted-foreground">View and manage all portal accounts, details, roles, and password resets.</p>
        </div>
        {isRoleView
          ? <Button variant="gold" onClick={() => setRoleDraft({ name: "", description: "" })}><Plus className="mr-2 h-4 w-4" />Add Role</Button>
          : <Button variant="gold" onClick={() => setAccountDraft({ username: "", email: "", full_name: "", role: "", password: "", is_active: true })}><UserPlus className="mr-2 h-4 w-4" />Add Account</Button>}
      </div>

      {accountsQuery.error || rolesQuery.error
        ? <p className="rounded-xl border border-destructive/30 p-5 text-destructive">Could not load account data: {getErrorMessage(accountsQuery.error || rolesQuery.error)}</p>
        : isRoleView
          ? rolesQuery.isLoading
            ? <p className="py-8 text-center text-muted-foreground">Loading roles…</p>
            : <div className="grid gap-4 md:grid-cols-2">
              {roles.map(role => <Card key={role.id}><CardContent className="flex items-start justify-between p-5"><div><h3 className="font-semibold"><Shield className="mr-2 inline h-4 w-4 text-primary" />{role.name}</h3><p className="mt-1 text-sm text-muted-foreground">{role.description || "No role description"}</p><p className="mt-3 text-xs text-muted-foreground">{role.users_count} linked account(s)</p></div><Button variant="outline" size="icon" aria-label={`Edit ${role.name} role`} onClick={() => setRoleDraft({ id: role.id, name: role.name, description: role.description })}><Edit className="h-4 w-4" /></Button></CardContent></Card>)}
              {roles.length === 0 && <p className="col-span-full py-8 text-center text-muted-foreground">No roles have been configured.</p>}
            </div>
          : <>
            <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-10" placeholder="Search name, username, email, role, or phone" value={search} onChange={event => setSearch(event.target.value)} /></div>
            {accountsQuery.isLoading
              ? <p className="py-8 text-center text-muted-foreground">Loading accounts…</p>
              : <div className="overflow-x-auto rounded-xl border bg-card"><table className="w-full min-w-[1000px]">
                <thead className="bg-secondary/50"><tr>{["Name", "Username / email", "Role", "Phone", "Status", "Last sign-in", "Created", "Actions"].map(label => <th key={label} className="px-4 py-3 text-left text-sm">{label}</th>)}</tr></thead>
                <tbody>{filteredAccounts.map(account => <tr key={account.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{account.full_name || account.username}</td>
                  <td className="px-4 py-3"><div>{account.username}</div><div className="text-xs text-muted-foreground">{account.email || "No email"}</div></td>
                  <td className="px-4 py-3">{account.role_name || "Unassigned"}{account.is_staff && <span className="ml-2 text-xs text-primary">Staff</span>}</td>
                  <td className="px-4 py-3">{account.phone || "—"}</td>
                  <td className="px-4 py-3">{account.is_active ? "Active" : "Inactive"}</td>
                  <td className="px-4 py-3">{account.last_login ? new Date(account.last_login).toLocaleString() : "Never"}</td>
                  <td className="px-4 py-3">{new Date(account.date_joined).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><Button variant="outline" size="icon" aria-label={`Edit ${account.username}`} onClick={() => setAccountDraft({ id: account.id, username: account.username, email: account.email, full_name: account.full_name, role: account.role ? String(account.role) : "", password: "", is_active: account.is_active })}><Edit className="h-4 w-4" /></Button>{account.is_active && <Button className="ml-2" variant="outline" size="icon" aria-label={`Deactivate ${account.username}`} onClick={() => void deactivate(account)}><UserX className="h-4 w-4 text-destructive" /></Button>}</td>
                </tr>)}
                  {filteredAccounts.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No accounts found.</td></tr>}
                </tbody>
              </table></div>}
          </>}

      {accountDraft && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setAccountDraft(null)}><div className="max-h-[90vh] w-full max-w-md space-y-4 overflow-y-auto rounded-xl bg-card p-6" onClick={event => event.stopPropagation()}>
        <div><h3 className="text-xl font-bold">{accountDraft.id ? "Edit Account" : "Create Account"}</h3><p className="mt-1 text-sm text-muted-foreground">Passwords are securely stored and cannot be viewed. Set a new password here to reset it.</p></div>
        <label className="block text-sm">Full name<Input autoComplete="name" value={accountDraft.full_name} onChange={event => updateDraft("full_name", event.target.value)} /></label>
        <label className="block text-sm">Username<Input autoComplete="username" value={accountDraft.username} onChange={event => updateDraft("username", event.target.value)} /></label>
        <label className="block text-sm">Email<Input type="email" autoComplete="email" value={accountDraft.email} onChange={event => updateDraft("email", event.target.value)} /></label>
        <label className="block text-sm">Role<select className="mt-1 w-full rounded-lg border bg-background p-2" value={accountDraft.role} onChange={event => updateDraft("role", event.target.value)}><option value="">Select role</option>{roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label>
        <label className="block text-sm">{accountDraft.id ? "Set new password" : "Initial password"}<Input type="password" autoComplete="new-password" minLength={8} value={accountDraft.password} onChange={event => updateDraft("password", event.target.value)} placeholder={accountDraft.id ? "Leave blank to keep current password" : "At least 8 characters"} /></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={accountDraft.is_active} onChange={event => updateDraft("is_active", event.target.checked)} />Account active</label>
        <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setAccountDraft(null)}>Cancel</Button><Button variant="gold" disabled={saveAccount.isPending || !accountDraft.username.trim() || !accountDraft.email.trim() || !accountDraft.role || (!accountDraft.id && accountDraft.password.length < 8) || (Boolean(accountDraft.password) && accountDraft.password.length < 8)} onClick={() => saveAccount.mutate(accountDraft)}>{saveAccount.isPending ? "Saving…" : accountDraft.id ? "Save / Reset Password" : "Create Account"}</Button></div>
      </div></div>}

      {roleDraft && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setRoleDraft(null)}><div className="w-full max-w-md space-y-4 rounded-xl bg-card p-6" onClick={event => event.stopPropagation()}>
        <h3 className="text-xl font-bold">{roleDraft.id ? "Edit Role" : "Add Role"}</h3>
        <label className="block text-sm">Role name<Input value={roleDraft.name} onChange={event => setRoleDraft({ ...roleDraft, name: event.target.value })} /></label>
        <label className="block text-sm">Description<textarea className="mt-1 min-h-24 w-full rounded-lg border bg-background p-2" value={roleDraft.description} onChange={event => setRoleDraft({ ...roleDraft, description: event.target.value })} /></label>
        <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setRoleDraft(null)}>Cancel</Button><Button variant="gold" disabled={saveRole.isPending || !roleDraft.name.trim()} onClick={() => saveRole.mutate(roleDraft)}>Save Role</Button></div>
      </div></div>}
    </div>
  );
};

export default UsersRolesSection;
