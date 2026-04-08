import { GraduationCap, Users, UserCog, DollarSign, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";

let statsCards: Array<any> = [];

const earningsData = [
  { day: "Mon", total: 65000, fees: 12000 },
  { day: "Tue", total: 45000, fees: 8000 },
  { day: "Wed", total: 75000, fees: 15000 },
  { day: "Thu", total: 52000, fees: 10000 },
  { day: "Fri", total: 88000, fees: 18000 },
  { day: "Sat", total: 42000, fees: 9000 },
  { day: "Sun", total: 30000, fees: 6000 },
];

const expensesData = [
  { month: "Jan 2019", value: 15000 },
  { month: "Feb 2019", value: 10000 },
  { month: "Mar 2019", value: 8000 },
];

const monthlyExpenses = [
  { name: "Jan", value: 125000 },
  { name: "Feb", value: 100000 },
  { name: "Mar", value: 75000 },
  { name: "Apr", value: 50000 },
  { name: "May", value: 90000 },
];

const studentsPieData = [
  { name: "Female Students", value: 45000, color: "hsl(200, 85%, 55%)" },
  { name: "Male Students", value: 105000, color: "hsl(35, 90%, 55%)" },
];

const trafficData = [
  { source: "Direct", value: 12890, percentage: 50, color: "hsl(150, 60%, 45%)" },
  { source: "Search", value: 7245, percentage: 27, color: "hsl(200, 85%, 55%)" },
  { source: "Referrals", value: 4256, percentage: 8, color: "hsl(35, 90%, 55%)" },
  { source: "Social", value: 500, percentage: 7, color: "hsl(350, 80%, 55%)" },
];

const notices = [
  { date: "16 June, 2019", title: "Great School manag mene esom text of the printing.", author: "Jennyfar Lopez", time: "5 min ago" },
  { date: "16 June, 2019", title: "Great School manag printing.", author: "Jennyfar Lopez", time: "5 min ago" },
  { date: "16 June, 2019", title: "Great School manag meneesom.", author: "Jennyfar Lopez", time: "5 min ago" },
];

const socialStats = [
  { platform: "facebook", label: "Like us on facebook", value: "30,000", color: "bg-[hsl(220,75%,55%)]" },
  { platform: "twitter", label: "Follow us on twitter", value: "1,11,000", color: "bg-[hsl(195,95%,55%)]" },
  { platform: "google", label: "Follow us on googleplus", value: "19,000", color: "bg-[hsl(5,75%,55%)]" },
  { platform: "linkedin", label: "Follow us on linked", value: "45,000", color: "bg-[hsl(200,75%,45%)]" },
];

const DashboardOverview = () => {
  const [currentMonth, setCurrentMonth] = useState("April 2019");
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      return await api.get<any>('/school/dashboard-stats/');
    },
    staleTime: 5 * 60 * 1000,
  });

  if (stats && statsCards.length === 0) {
    statsCards = [
      { icon: GraduationCap, label: 'Students', value: stats.students?.toLocaleString?.() ?? String(stats.students ?? '-'), bgColor: 'bg-[hsl(200,85%,92%)]', iconColor: 'text-[hsl(200,85%,50%)]' },
      { icon: Users, label: 'Teachers', value: stats.teachers?.toLocaleString?.() ?? String(stats.teachers ?? '-'), bgColor: 'bg-[hsl(150,60%,90%)]', iconColor: 'text-[hsl(150,60%,40%)]' },
      { icon: UserCog, label: 'Parents', value: stats.parents?.toLocaleString?.() ?? String(stats.parents ?? '-'), bgColor: 'bg-[hsl(35,90%,90%)]', iconColor: 'text-[hsl(35,90%,50%)]' },
      { icon: DollarSign, label: 'Earnings', value: stats.earnings ? `$${stats.earnings}` : '-', bgColor: 'bg-[hsl(350,80%,92%)]', iconColor: 'text-[hsl(350,80%,55%)]' },
    ];
  }
  
  // Calendar data for April 2019
  const calendarEvents = [
    { day: 1, label: "All Day Event", color: "bg-[hsl(200,85%,55%)]" },
    { day: 8, label: "All Day Event", color: "bg-[hsl(200,85%,55%)]" },
    { day: 12, label: "2:30p Mee", color: "bg-[hsl(150,60%,45%)]" },
    { day: 15, label: "5:30p Host", color: "bg-[hsl(35,90%,55%)]" },
    { day: 19, label: "", color: "" },
    { day: 20, label: "7a Birthday", color: "bg-[hsl(150,60%,45%)]" },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-5 h-28 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Home &gt; <span className="text-accent">Admin</span></p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <div key={index} className="bg-card rounded-xl border border-border p-5 flex items-center gap-4">
            <div className={`h-14 w-14 rounded-full ${stat.bgColor} flex items-center justify-center`}>
              <stat.icon className={`h-7 w-7 ${stat.iconColor}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Earnings Chart */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">Earnings</h3>
              <div className="flex items-center gap-4 mt-1">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="w-3 h-3 rounded-full bg-[hsl(200,85%,55%)]" />
                  Total Collections
                </span>
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="w-3 h-3 rounded-full bg-[hsl(350,80%,55%)]" />
                  Fees Collection
                </span>
              </div>
            </div>
            <button className="p-1 hover:bg-secondary rounded">
              <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
          <div className="flex gap-4 mb-4">
            <div>
              <p className="text-xl font-bold text-foreground">$ 75,000</p>
            </div>
            <div>
              <p className="text-xl font-bold text-[hsl(350,80%,55%)]">$ 15,000</p>
            </div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={earningsData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(200, 85%, 55%)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(200, 85%, 55%)" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorFees" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(350, 80%, 55%)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(350, 80%, 55%)" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${v/1000}k`} />
                <Tooltip />
                <Area type="monotone" dataKey="total" stroke="hsl(200, 85%, 55%)" fill="url(#colorTotal)" />
                <Area type="monotone" dataKey="fees" stroke="hsl(350, 80%, 55%)" fill="url(#colorFees)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expenses Chart */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Expenses</h3>
            <button className="p-1 hover:bg-secondary rounded">
              <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
          <div className="flex gap-4 mb-4">
            {expensesData.map((item, idx) => (
              <div key={idx} className="text-center">
                <p className="text-xs text-muted-foreground">{item.month}</p>
                <p className="text-sm font-bold text-foreground">$ {item.value.toLocaleString()}</p>
              </div>
            ))}
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyExpenses}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${v/1000}k`} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(35, 90%, 55%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Students Pie Chart */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Students</h3>
            <button className="p-1 hover:bg-secondary rounded">
              <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
          <div className="h-48 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={studentsPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {studentsPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[hsl(200,85%,55%)]" />
              <span className="text-xs text-muted-foreground">Female Students</span>
              <span className="text-xs font-bold text-foreground">45,000</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[hsl(35,90%,55%)]" />
              <span className="text-xs text-muted-foreground">Male Students</span>
              <span className="text-xs font-bold text-foreground">1,05,000</span>
            </div>
          </div>
        </div>
      </div>

      {/* Second Row - Calendar, Traffic, Notice */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event Calendar */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Event Calendar</h3>
            <button className="p-1 hover:bg-secondary rounded">
              <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
          <div className="flex items-center justify-between mb-4">
            <button className="p-1 hover:bg-secondary rounded">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-xs rounded border border-border hover:bg-secondary">Day</button>
              <button className="px-3 py-1 text-xs rounded border border-border hover:bg-secondary">Week</button>
              <button className="px-3 py-1 text-xs rounded bg-accent text-accent-foreground">Month</button>
            </div>
            <button className="p-1 hover:bg-secondary rounded">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <p className="text-center font-semibold text-foreground mb-3">{currentMonth}</p>
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day} className="p-2 font-medium text-muted-foreground">{day}</div>
            ))}
            {Array.from({ length: 35 }, (_, i) => {
              const day = i - 0 + 1; // Adjust for month start
              const dayNum = day > 0 && day <= 30 ? day : "";
              const event = calendarEvents.find(e => e.day === day);
              return (
                <div key={i} className="p-2 relative">
                  <span className={`text-sm ${day > 0 && day <= 30 ? 'text-foreground' : 'text-muted-foreground/30'}`}>
                    {dayNum}
                  </span>
                  {event && event.label && (
                    <div className={`absolute bottom-0 left-0 right-0 text-[8px] truncate ${event.color} text-white rounded px-0.5`}>
                      {event.label}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Website Traffic */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Website Traffic</h3>
            <button className="p-1 hover:bg-secondary rounded">
              <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Unique Visitors</p>
          <p className="text-3xl font-bold text-foreground mb-4">2,590</p>
          <div className="h-3 rounded-full overflow-hidden flex mb-4">
            <div className="bg-[hsl(150,60%,45%)]" style={{ width: "50%" }} />
            <div className="bg-[hsl(200,85%,55%)]" style={{ width: "27%" }} />
            <div className="bg-[hsl(35,90%,55%)]" style={{ width: "8%" }} />
            <div className="bg-[hsl(350,80%,55%)]" style={{ width: "15%" }} />
          </div>
          <div className="space-y-3">
            {trafficData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-foreground">{item.source}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-foreground">{item.value.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground">{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notice Board */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Notice Board</h3>
            <button className="p-1 hover:bg-secondary rounded">
              <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
          <div className="space-y-4">
            {notices.map((notice, idx) => (
              <div key={idx} className="pb-4 border-b border-border last:border-0">
                <span className="inline-block px-2 py-1 text-xs bg-accent text-accent-foreground rounded mb-2">
                  {notice.date}
                </span>
                <p className="text-sm text-foreground mb-1">{notice.title}</p>
                <p className="text-xs text-muted-foreground">{notice.author} / {notice.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Social Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {socialStats.map((stat, idx) => (
          <div key={idx} className={`${stat.color} rounded-xl p-5 text-white`}>
            <div className="flex items-center gap-2 mb-2 text-white/80">
              <span className="text-sm">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardOverview;
