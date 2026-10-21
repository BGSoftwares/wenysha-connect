import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link2, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/lib/api";
import { useStudents, type Student } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Account = { id: number; username: string; email: string; full_name: string; role_name?: string };
type AccountResponse = Account[] | { results?: Account[] };

const StudentDirectorySection = ({ onManageGuardians }: { onManageGuardians: () => void }) => {
  const client = useQueryClient();
  const { data: students = [], isLoading, error } = useStudents();
  const [search, setSearch] = useState("");
  const [linkingStudent, setLinkingStudent] = useState<Student | null>(null);
  const [accountId, setAccountId] = useState("");
  const { data: accounts = [] } = useQuery({
    queryKey: ["admin-accounts"],
    queryFn: async () => {
      const response = await api.get<AccountResponse>("/auth/accounts/");
      return Array.isArray(response) ? response : response.results ?? [];
    },
  });
  const linkAccount = useMutation({
    mutationFn: () => api.patch(`/school/students/${linkingStudent!.id}/`, { user: Number(accountId) }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["students"] });
      void client.invalidateQueries({ queryKey: ["student-profile"] });
      setLinkingStudent(null);
      setAccountId("");
      toast.success("Student account linked");
    },
    onError: error => toast.error(getErrorMessage(error)),
  });
  const studentAccounts = accounts.filter(account => account.role_name?.trim().toLowerCase() === "student");
  const filtered = useMemo(() => students.filter(student => {
    const guardianNames = (student.next_of_kin ?? []).map(guardian => guardian.name).join(" ");
    return `${student.name} ${student.student_id} ${student.class_name} ${student.account_email ?? ""} ${guardianNames}`
      .toLowerCase().includes(search.toLowerCase());
  }), [students, search]);

  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div><h2 className="font-heading text-xl font-bold">School Directory</h2><p className="text-sm text-muted-foreground">Student accounts and linked next-of-kin details, kept in sync with their portal records.</p></div>
      <Button variant="outline" onClick={onManageGuardians}><Users className="mr-2 h-4 w-4"/>Manage guardians</Button>
    </div>
    <div className="relative max-w-xl"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><Input className="pl-10" placeholder="Search students, class, account, or guardian" value={search} onChange={event => setSearch(event.target.value)}/></div>
    {isLoading ? <p className="py-10 text-center text-muted-foreground">Loading directory…</p> : error ? <p className="rounded-xl border border-destructive/30 p-5 text-destructive">Could not load the directory: {getErrorMessage(error)}</p> : filtered.length === 0 ? <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">No students match this search.</div> : <div className="overflow-x-auto rounded-xl border bg-card shadow-elegant"><table className="w-full min-w-[800px]"><thead className="bg-secondary/50"><tr><th className="px-4 py-3 text-left text-sm font-semibold">Student</th><th className="px-4 py-3 text-left text-sm font-semibold">Class</th><th className="px-4 py-3 text-left text-sm font-semibold">Student account</th><th className="px-4 py-3 text-left text-sm font-semibold">Next of kin</th><th className="px-4 py-3 text-right text-sm font-semibold">Account link</th></tr></thead><tbody className="divide-y divide-border">{filtered.map(student => <tr key={student.id} className="align-top hover:bg-secondary/20"><td className="px-4 py-4"><p className="font-semibold">{student.name}</p><p className="mt-1 text-xs text-muted-foreground">{student.student_id}</p></td><td className="px-4 py-4 text-sm">{student.class_name || "—"}</td><td className="px-4 py-4 text-sm">{student.account_email ? <><p>{student.account_email}</p><p className="mt-1 text-xs text-muted-foreground">Linked portal account</p></> : <span className="text-muted-foreground">No account linked</span>}</td><td className="px-4 py-4 text-sm">{student.next_of_kin?.length ? <div className="space-y-2">{student.next_of_kin.map(guardian => <div key={guardian.id}><p className="font-medium">{guardian.name}</p><p className="text-xs text-muted-foreground">{guardian.phone || guardian.email || "Contact details not provided"}</p></div>)}</div> : <span className="text-muted-foreground">No guardian linked</span>}</td><td className="px-4 py-4 text-right">{student.user ? <span className="text-xs font-medium text-emerald-700">Linked</span> : <Button variant="outline" size="sm" onClick={() => { setLinkingStudent(student); setAccountId(""); }}><Link2 className="mr-1 h-4 w-4"/>Link account</Button>}</td></tr>)}</tbody></table></div>}
    {linkingStudent && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setLinkingStudent(null)}><div className="w-full max-w-md space-y-4 rounded-xl bg-card p-6" onClick={event => event.stopPropagation()}><div><h3 className="text-lg font-bold">Link student portal account</h3><p className="mt-1 text-sm text-muted-foreground">{linkingStudent.name} · {linkingStudent.student_id}</p></div><label className="block text-sm">Student account<select className="mt-1 w-full rounded-lg border border-border bg-background p-2.5" value={accountId} onChange={event => setAccountId(event.target.value)}><option value="">Select an unlinked student account</option>{studentAccounts.filter(account => !students.some(student => student.id !== linkingStudent.id && student.user === account.id)).map(account => <option key={account.id} value={account.id}>{account.full_name || account.username} · {account.email}</option>)}</select></label>{studentAccounts.length === 0 && <p className="text-sm text-muted-foreground">Create a Student account under User Accounts &amp; Roles first.</p>}<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setLinkingStudent(null)}>Cancel</Button><Button variant="gold" disabled={!accountId || linkAccount.isPending} onClick={() => linkAccount.mutate()}>{linkAccount.isPending ? "Linking…" : "Link account"}</Button></div></div></div>}
  </div>;
};

export default StudentDirectorySection;
