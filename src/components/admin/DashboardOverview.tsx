import { useQuery } from "@tanstack/react-query";
import { Bell, BookOpen, GraduationCap, Users, UserRound, CalendarCheck, ArrowUpRight } from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import { useClasses, useParents, useStudents, useTeachers } from "@/lib/hooks";
import { Card, CardContent } from "@/components/ui/card";

type Notice = { id: number; title: string; content: string; date: string; audience: string; priority: string; pinned: boolean };
const list = (x: Notice[] | { results?: Notice[] }) => Array.isArray(x) ? x : x.results ?? [];
const DashboardOverview = () => {
  const students = useStudents(); const teachers = useTeachers(); const classes = useClasses(); const parents = useParents();
  const notices = useQuery({ queryKey: ["admin-notices"], queryFn: async () => list(await api.get<Notice[] | { results?: Notice[] }>("/notices/notices/")) });
  const isLoading = students.isLoading || teachers.isLoading || classes.isLoading || parents.isLoading || notices.isLoading;
  const error = students.error || teachers.error || classes.error || parents.error || notices.error;
  const stats = [
    { label: "Students", value: students.data?.length ?? 0, icon: GraduationCap, detail: `${students.data?.filter(s => s.status === "Active").length ?? 0} active` },
    { label: "Teachers", value: teachers.data?.length ?? 0, icon: Users, detail: "Staff records" },
    { label: "Parents", value: parents.data?.length ?? 0, icon: UserRound, detail: "Guardian records" },
    { label: "Classes", value: classes.data?.length ?? 0, icon: BookOpen, detail: "Registered classes" },
  ];
  const recentNotices = (notices.data ?? []).slice(0, 5);
  return <div className="space-y-6"><div><h1 className="font-heading text-2xl font-bold">Able God College Admin</h1><p className="text-sm text-muted-foreground">Live summary from your school database</p></div>
    {error&&<p className="rounded-xl border border-destructive/30 p-4 text-sm text-destructive">Some dashboard data could not be loaded: {getErrorMessage(error)}</p>}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(stat=><Card key={stat.label}><CardContent className="flex items-center gap-4 p-5"><div className="rounded-xl bg-primary/10 p-3"><stat.icon className="h-6 w-6 text-primary"/></div><div><p className="text-sm text-muted-foreground">{stat.label}</p><p className="text-2xl font-bold">{isLoading?"—":stat.value}</p><p className="text-xs text-muted-foreground">{stat.detail}</p></div></CardContent></Card>)}</div>
    <div className="grid gap-5 lg:grid-cols-3"><Card className="lg:col-span-2"><CardContent className="p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold">Class Register</h2><p className="text-sm text-muted-foreground">Enrollment from current student records</p></div><BookOpen className="h-5 w-5 text-primary"/></div>{isLoading?<p className="py-6 text-center text-muted-foreground">Loading school records…</p>:!classes.data?.length?<p className="py-8 text-center text-muted-foreground">No classes have been created.</p>:<div className="space-y-4">{classes.data.map(cls=>{const count=students.data?.filter(s=>s.school_class===cls.id).length??0;const percent=cls.capacity?Math.min(100,count/cls.capacity*100):0;return <div key={cls.id}><div className="mb-1 flex justify-between text-sm"><span className="font-medium">{cls.name}</span><span className="text-muted-foreground">{count} / {cls.capacity}</span></div><div className="h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{width:`${percent}%`}}/></div></div>})}</div>}</CardContent></Card>
      <Card><CardContent className="p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold">Recent Notices</h2><p className="text-sm text-muted-foreground">Published announcements</p></div><Bell className="h-5 w-5 text-primary"/></div>{notices.isLoading?<p className="py-6 text-center text-muted-foreground">Loading…</p>:recentNotices.length===0?<p className="py-8 text-center text-muted-foreground">No notices published.</p>:<div className="space-y-3">{recentNotices.map(n=><div key={n.id} className="border-b pb-3 last:border-0"><div className="flex items-start justify-between gap-2"><p className="font-medium">{n.title}</p>{n.pinned&&<ArrowUpRight className="h-4 w-4 shrink-0 text-primary"/>}</div><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{n.content}</p><p className="mt-1 text-xs text-muted-foreground">{n.date} · {n.audience}</p></div>)}</div>}</CardContent></Card></div>
    <Card><CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center"><CalendarCheck className="h-6 w-6 text-primary"/><div><h2 className="font-semibold">Data connected</h2><p className="text-sm text-muted-foreground">Dashboard counts are taken directly from database records. Charts with no historical financial source are not shown as invented figures.</p></div></CardContent></Card>
  </div>;
};
export default DashboardOverview;
