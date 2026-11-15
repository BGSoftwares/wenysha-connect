import { useEffect, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, Bell, CalendarDays, CheckCircle2, CreditCard, GraduationCap, Inbox, Sparkles, type LucideIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";

type Action = { label: string; onClick: () => void };

export const WelcomeBanner = ({ name, role, actions = [] }: { name?: string; role: string; actions?: Action[] }) => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);
  const h = now.getHours();
  const greet = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-hero p-6 md:p-8 text-primary-foreground shadow-lg animate-fade-in">
      <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary-foreground/10 blur-2xl animate-float" />
      <div className="absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-accent/40 blur-3xl" />
      <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-sm text-white/90 font-medium drop-shadow-sm">
            <Sparkles className="h-4 w-4 text-pink-300" />
            {now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
          <h2 className="mt-2 text-2xl md:text-3xl font-bold text-white drop-shadow-sm">
            {greet}{name ? `, ${name}` : ""}!
          </h2>
          <p className="mt-1 text-white/90 font-medium drop-shadow-sm">Welcome to your {role} dashboard.</p>
        </div>
        {actions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {actions.map((a) => (
              <button
                key={a.label}
                onClick={a.onClick}
                className="rounded-full border border-white/40 bg-white/20 px-4 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur transition hover:bg-white/30"
              >
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const attendance = [
  { m: "Jan", v: 91 }, { m: "Feb", v: 93 }, { m: "Mar", v: 89 }, { m: "Apr", v: 94 },
  { m: "May", v: 96 }, { m: "Jun", v: 92 }, { m: "Jul", v: 95 },
];
const performance = [
  { s: "Maths", v: 72 }, { s: "English", v: 78 }, { s: "Science", v: 69 },
  { s: "History", v: 81 }, { s: "Shona", v: 85 }, { s: "Geo", v: 74 },
];

type TrendPoint = { m: string; v: number | null };
type SubjectPoint = { s: string; v: number };

const ChartState = ({ loading, message }: { loading?: boolean; message: string }) =>
  loading ? (
    <div className="h-full animate-pulse rounded-xl bg-muted" aria-busy="true" />
  ) : (
    <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border px-4 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );

export const StatsCharts = ({
  title1 = "Attendance trend (%)",
  title2 = "Average marks by subject",
  attendanceData = attendance,
  performanceData = performance,
  loading = false,
}: {
  title1?: string;
  title2?: string;
  attendanceData?: TrendPoint[];
  performanceData?: SubjectPoint[];
  loading?: boolean;
}) => (
  <div className="grid items-stretch gap-4 xl:grid-cols-2">
    <div className="h-full min-w-0 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h3 className="mb-4 font-heading text-lg font-semibold text-foreground">{title1}</h3>
      <div className="h-56">
        {loading || !attendanceData.some((p) => p.v !== null) ? (
          <ChartState loading={loading} message="No attendance has been recorded yet. Mark a register to see the trend." />
        ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={attendanceData}>
            <defs>
              <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.5} />
                <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="m" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
            <Area type="monotone" dataKey="v" name="Attendance %" stroke="hsl(var(--accent))" strokeWidth={2} fill="url(#attGrad)" animationDuration={1200} />
          </AreaChart>
        </ResponsiveContainer>
        )}
      </div>
    </div>
    <div className="h-full min-w-0 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h3 className="mb-4 font-heading text-lg font-semibold text-foreground">{title2}</h3>
      <div className="h-56">
        {loading || performanceData.length === 0 ? (
          <ChartState loading={loading} message="No marks have been entered yet. Averages appear once teachers submit marks." />
        ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="s" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
            <Bar dataKey="v" name="Average %" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} animationDuration={1200} />
          </BarChart>
        </ResponsiveContainer>
        )}
      </div>
    </div>
  </div>
);

export type ActivityItem = {
  title: string;
  detail?: string;
  time: string;
  tone?: "info" | "alert" | "success" | "pinned";
  icon?: LucideIcon;
};

const toneStyles: Record<NonNullable<ActivityItem["tone"]>, { chip: string; label: string }> = {
  info: { chip: "bg-primary/10 text-primary", label: "" },
  success: { chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300", label: "" },
  alert: { chip: "bg-accent/10 text-accent", label: "Important" },
  pinned: { chip: "bg-accent/10 text-accent", label: "Pinned" },
};

const defaultActivities: ActivityItem[] = [
  { icon: Bell, title: "New notice: Term 3 opening dates published", time: "2h ago", tone: "info" },
  { icon: CreditCard, title: "Fee payment received for Form 3", time: "5h ago", tone: "success" },
  { icon: GraduationCap, title: "Mid-term results uploaded for Form 2", time: "Yesterday", tone: "info" },
  { icon: CheckCircle2, title: "Attendance register completed for all classes", time: "Yesterday", tone: "success" },
  { icon: Bell, title: "Chess team qualifies for NICAZ provincials", time: "2 days ago", tone: "info" },
];

export const ActivityFeed = ({
  items = defaultActivities,
  loading = false,
  className = "",
}: { items?: ActivityItem[]; loading?: boolean; className?: string }) => (
  <section className={`flex min-w-0 flex-col rounded-2xl border border-border bg-card p-5 shadow-sm ${className}`}>
    <header className="mb-4 flex items-center justify-between gap-3">
      <div>
        <h3 className="font-heading text-lg font-semibold text-foreground">Recent activity</h3>
        <p className="text-sm text-muted-foreground">What changed across the school lately</p>
      </div>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-accent">
        <Activity className="h-4 w-4" />
      </span>
    </header>
    {loading ? (
      <ul className="space-y-3" aria-busy="true">
        {[0, 1, 2, 3].map((i) => <li key={i} className="h-14 animate-pulse rounded-xl bg-muted" />)}
      </ul>
    ) : items.length === 0 ? (
      <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border px-4 py-10 text-center">
        <Inbox className="mb-2 h-6 w-6 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">Nothing new yet</p>
        <p className="mt-1 text-sm text-muted-foreground">Published notices will show up here.</p>
      </div>
    ) : (
      <ol className="relative max-h-[26rem] space-y-1 overflow-y-auto pr-1 before:absolute before:bottom-6 before:left-[1.125rem] before:top-6 before:w-px before:bg-border">
        {items.map((a, i) => {
          const tone = toneStyles[a.tone ?? "info"];
          const Icon = a.icon ?? Bell;
          return (
            <li key={`${a.title}-${i}`} className="relative flex gap-3 rounded-xl p-2 transition-colors hover:bg-secondary/60">
              <span className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-4 ring-card ${tone.chip}`}>
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-snug text-foreground">{a.title}</p>
                  <time className="shrink-0 pt-0.5 text-xs text-muted-foreground">{a.time}</time>
                </div>
                {a.detail && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{a.detail}</p>}
                {tone.label && (
                  <span className="mt-1.5 inline-block rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">
                    {tone.label}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    )}
  </section>
);

export type CalendarEvent = { date: Date; title: string };

const sampleEvents: CalendarEvent[] = [
  { date: new Date(new Date().getFullYear(), new Date().getMonth(), 14), title: "Sports Day" },
  { date: new Date(new Date().getFullYear(), new Date().getMonth(), 20), title: "Parents' Meeting" },
  { date: new Date(new Date().getFullYear(), new Date().getMonth(), 27), title: "Mid-term Exams" },
];

export const EventsCalendar = ({
  className = "",
  events = sampleEvents,
  loading = false,
}: { className?: string; events?: CalendarEvent[]; loading?: boolean }) => {
  const [day, setDay] = useState<Date | undefined>(new Date());
  return (
    <section className={`min-w-0 rounded-2xl border border-border bg-card p-5 shadow-sm ${className}`}>
      <header className="mb-3 flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-accent" />
        <h3 className="font-heading text-lg font-semibold text-foreground">Upcoming events</h3>
      </header>
      <div className="grid items-center gap-4 md:grid-cols-[auto_1fr]">
        <Calendar
          mode="single"
          selected={day}
          onSelect={setDay}
          modifiers={{ event: events.map((e) => e.date) }}
          modifiersClassNames={{ event: "font-bold text-accent underline" }}
          className="mx-auto"
        />
        {loading ? (
          <div className="h-32 animate-pulse rounded-xl bg-muted" aria-busy="true" />
        ) : events.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            No upcoming exams or school closures. Schedule an exam or mark a holiday to see it here.
          </p>
        ) : (
          <ul className="space-y-2">
            {events.map((e) => (
              <li key={`${e.title}-${e.date.toISOString()}`} className="flex items-center gap-3 rounded-xl bg-secondary px-3 py-2.5">
                <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-card text-accent shadow-sm">
                  <span className="text-base font-bold leading-none">{e.date.getDate()}</span>
                  <span className="text-[10px] font-medium leading-none text-muted-foreground">
                    {e.date.toLocaleDateString(undefined, { month: "short" })}
                  </span>
                </span>
                <span className="text-sm font-medium text-secondary-foreground">{e.title}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export const ActivityAndCalendar = () => (
  <div className="grid items-stretch gap-4 xl:grid-cols-3">
    <ActivityFeed className="xl:col-span-2" />
    <EventsCalendar />
  </div>
);

export const DashboardExtras = (props: { name?: string; role: string; actions?: Action[] }) => (
  <div className="space-y-6">
    <WelcomeBanner {...props} />
    <StatsCharts />
    <ActivityAndCalendar />
  </div>
);

export default DashboardExtras;
