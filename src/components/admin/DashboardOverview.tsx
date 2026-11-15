import { useQuery } from "@tanstack/react-query";
import { BookOpen, GraduationCap, Users, UserRound, Pin, Megaphone } from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import { useClasses, useParents, useStudents, useTeachers } from "@/lib/hooks";
import { ActivityFeed, type ActivityItem } from "@/components/dashboard/DashboardExtras";

type Notice = { id: number; title: string; content: string; date: string; audience: string; priority: string; pinned: boolean };
const list = (x: Notice[] | { results?: Notice[] }) => Array.isArray(x) ? x : x.results ?? [];

const relativeDate = (value: string) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
};

const DashboardOverview = () => {
  const students = useStudents(); const teachers = useTeachers(); const classes = useClasses(); const parents = useParents();
  const notices = useQuery({
    queryKey: ["admin-notices"],
    queryFn: async () => list(await api.get<Notice[] | { results?: Notice[] }>("/notices/notices/")),
    refetchInterval: 15000,
  });
  const isLoading = students.isLoading || teachers.isLoading || classes.isLoading || parents.isLoading;
  const error = students.error || teachers.error || classes.error || parents.error || notices.error;
  const activeStudents = students.data?.filter((s) => s.status === "Active").length ?? 0;

  const stats = [
    { label: "Students", value: students.data?.length ?? 0, icon: GraduationCap, detail: `${activeStudents} active` },
    { label: "Teachers", value: teachers.data?.length ?? 0, icon: Users, detail: "On staff" },
    { label: "Parents", value: parents.data?.length ?? 0, icon: UserRound, detail: "Guardians on record" },
    { label: "Classes", value: classes.data?.length ?? 0, icon: BookOpen, detail: "Open this term" },
  ];

  const activity: ActivityItem[] = (notices.data ?? []).slice(0, 8).map((n) => ({
    title: n.title,
    detail: n.content,
    time: relativeDate(n.date),
    tone: n.pinned ? "pinned" : /high|urgent/i.test(n.priority) ? "alert" : "info",
    icon: n.pinned ? Pin : Megaphone,
  }));

  return (
    <div className="space-y-6">
      {error && (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Some dashboard data could not be loaded: {getErrorMessage(error)}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <stat.icon className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="font-heading text-3xl font-semibold leading-tight text-foreground">{isLoading ? "–" : stat.value}</p>
              <p className="truncate text-xs text-muted-foreground">{stat.detail}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-5">
        <section className="min-w-0 rounded-2xl border border-border bg-card p-5 shadow-sm xl:col-span-3">
          <header className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h3 className="font-heading text-lg font-semibold text-foreground">Class register</h3>
              <p className="text-sm text-muted-foreground">Seats filled in each class</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-accent"><BookOpen className="h-4 w-4" /></span>
          </header>
          {isLoading ? (
            <div className="space-y-4" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />)}</div>
          ) : !classes.data?.length ? (
            <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">No classes yet. Add one in Classes to see enrolment here.</p>
          ) : (
            <ul className="grid gap-x-8 gap-y-4 md:grid-cols-2">
              {classes.data.map((cls) => {
                const count = students.data?.filter((s) => s.school_class === cls.id).length ?? 0;
                const percent = cls.capacity ? Math.min(100, (count / cls.capacity) * 100) : 0;
                const full = percent >= 90;
                return (
                  <li key={cls.id}>
                    <div className="mb-1.5 flex items-baseline justify-between text-sm">
                      <span className="font-medium text-foreground">{cls.name}</span>
                      <span className="text-muted-foreground">{count} of {cls.capacity}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-valuenow={Math.round(percent)} aria-valuemin={0} aria-valuemax={100} aria-label={`${cls.name} capacity`}>
                      <div className={`h-full rounded-full ${full ? "bg-accent" : "bg-primary"}`} style={{ width: `${percent}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        <ActivityFeed items={activity} loading={notices.isLoading} className="xl:col-span-2" />
      </div>
    </div>
  );
};
export default DashboardOverview;
