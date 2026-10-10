import { useEffect, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Bell, CalendarDays, CheckCircle2, CreditCard, GraduationCap, Sparkles } from "lucide-react";
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
          <p className="flex items-center gap-2 text-sm text-primary-foreground/80">
            <Sparkles className="h-4 w-4" />
            {now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
          <h2 className="mt-2 text-2xl md:text-3xl font-semibold">
            {greet}{name ? `, ${name}` : ""}!
          </h2>
          <p className="mt-1 text-primary-foreground/80">Welcome to your {role} dashboard.</p>
        </div>
        {actions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {actions.map((a) => (
              <button
                key={a.label}
                onClick={a.onClick}
                className="rounded-full border border-primary-foreground/30 bg-primary-foreground/10 px-4 py-2 text-sm font-medium backdrop-blur transition hover:bg-primary-foreground/20"
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

export const StatsCharts = ({ title1 = "Attendance trend (%)", title2 = "Average marks by subject" }) => (
  <div className="grid gap-4 lg:grid-cols-2">
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="mb-4 font-semibold text-foreground">{title1}</h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={attendance}>
            <defs>
              <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.5} />
                <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="m" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis domain={[80, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
            <Area type="monotone" dataKey="v" name="Attendance" stroke="hsl(var(--accent))" strokeWidth={2} fill="url(#attGrad)" animationDuration={1200} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="mb-4 font-semibold text-foreground">{title2}</h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={performance}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="s" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
            <Bar dataKey="v" name="Average" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} animationDuration={1200} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);

const activities = [
  { icon: Bell, text: "New notice: Term 3 opening dates published", time: "2h ago" },
  { icon: CreditCard, text: "Fee payment received for Form 3", time: "5h ago" },
  { icon: GraduationCap, text: "Mid-term results uploaded for Form 2", time: "Yesterday" },
  { icon: CheckCircle2, text: "Attendance register completed for all classes", time: "Yesterday" },
  { icon: Bell, text: "Chess team qualifies for NICAZ provincials", time: "2 days ago" },
];

const events = [
  { date: new Date(new Date().getFullYear(), new Date().getMonth(), 14), title: "Sports Day" },
  { date: new Date(new Date().getFullYear(), new Date().getMonth(), 20), title: "Parents' Meeting" },
  { date: new Date(new Date().getFullYear(), new Date().getMonth(), 27), title: "Mid-term Exams" },
];

export const ActivityAndCalendar = () => {
  const [day, setDay] = useState<Date | undefined>(new Date());
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="bg-card rounded-xl border border-border p-5 lg:col-span-2">
        <h3 className="mb-4 font-semibold text-foreground">Recent activity</h3>
        <ol className="relative border-l border-border ml-3 space-y-5">
          {activities.map((a, i) => (
            <li key={i} className="ml-6 animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
              <span className="absolute -left-3.5 flex h-7 w-7 items-center justify-center rounded-full bg-secondary ring-4 ring-card">
                <a.icon className="h-3.5 w-3.5 text-accent" />
              </span>
              <p className="text-sm text-foreground">{a.text}</p>
              <p className="text-xs text-muted-foreground">{a.time}</p>
            </li>
          ))}
        </ol>
      </div>
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="mb-2 flex items-center gap-2 font-semibold text-foreground">
          <CalendarDays className="h-4 w-4 text-accent" /> Upcoming events
        </h3>
        <Calendar
          mode="single"
          selected={day}
          onSelect={setDay}
          modifiers={{ event: events.map((e) => e.date) }}
          modifiersClassNames={{ event: "font-bold text-accent underline" }}
          className="mx-auto"
        />
        <ul className="mt-2 space-y-2">
          {events.map((e) => (
            <li key={e.title} className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2 text-sm">
              <span className="text-secondary-foreground">{e.title}</span>
              <span className="text-xs text-muted-foreground">
                {e.date.toLocaleDateString(undefined, { day: "numeric", month: "short" })}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export const DashboardExtras = (props: { name?: string; role: string; actions?: Action[] }) => (
  <div className="space-y-6 mb-6">
    <WelcomeBanner {...props} />
    <StatsCharts />
    <ActivityAndCalendar />
  </div>
);

export default DashboardExtras;
