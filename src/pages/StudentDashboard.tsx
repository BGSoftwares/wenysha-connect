import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import {
  Home,
  FileText,
  BookOpen,
  DollarSign,
  Calendar,
  Settings,
  Bell,
  LogOut,
  TrendingUp,
  Users,
  CheckCircle,
  User,
  Award
} from "lucide-react";
import logo from "/able-god-college-logo.png";
import ReportCardSection from "@/components/student/ReportCardSection";
import StudentFeesSection from "@/components/student/StudentFeesSection";
import ResultsSection from "@/components/student/ResultsSection";
import ELearningSection from "@/components/student/ELearningSection";
import StudentLibrarySection from "@/components/student/StudentLibrarySection";
import StudentSettingsSection from "@/components/student/StudentSettingsSection";
import { calculateGrade } from "@/lib/grading";
import {
  useStudentProfile,
  useGrades,
  useAttendanceRecords,
  useStudentFees,
  useTimetable,
} from "@/lib/hooks";
import { clearAuth, getStoredUser } from "@/lib/api";

const navigation = [
  { name: "Dashboard", icon: Home, id: "dashboard" },
  { name: "My Results", icon: FileText, id: "results" },
  { name: "Report Card", icon: Award, id: "report-card" },
  { name: "E-Learning", icon: BookOpen, id: "elearning" },
  { name: "Library", icon: BookOpen, id: "library" },
  { name: "Fees", icon: DollarSign, id: "fees" },
  { name: "Timetable", icon: Calendar, id: "timetable" },
  { name: "Settings", icon: Settings, id: "settings" },
];

const StudentDashboard = () => {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = getStoredUser();

  const { data: profile, isLoading: isLoadingProfile } = useStudentProfile();
  const { data: grades = [] } = useGrades({ student: profile?.id });
  const { data: attendance = [] } = useAttendanceRecords({ student: profile?.id });
  const { data: fees = [] } = useStudentFees({ student: profile?.id });
  const { data: timetable = [] } = useTimetable(profile?.school_class);

  const averageGrade = useMemo(() => {
    if (!grades.length) return 0;
    return (grades.reduce((acc, g) => acc + Number(g.score), 0) / grades.length).toFixed(1);
  }, [grades]);

  const attendanceRate = useMemo(() => {
    if (!attendance.length) return 100;
    const presentCount = attendance.filter(a => a.status === 'present').length;
    return ((presentCount / attendance.length) * 100).toFixed(0);
  }, [attendance]);

  const totalFeesDue = useMemo(() => {
    return fees.reduce((acc, f) => acc + (Number(f.amount_due) - Number(f.amount_paid)), 0);
  }, [fees]);

  const totalPaid = useMemo(() => {
    return fees.reduce((acc, f) => acc + Number(f.amount_paid), 0);
  }, [fees]);

  const totalBilled = useMemo(() => {
    return fees.reduce((acc, f) => acc + Number(f.amount_due), 0);
  }, [fees]);

  const resultsLocked = totalFeesDue > 0;

  // Require authentication
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-6 bg-card p-8 rounded-2xl border border-border shadow-elegant">
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <User className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-foreground">Login Required</h2>
          <p className="text-muted-foreground">Please log in to access the student portal. Your data will be loaded from the server.</p>
          <Link to="/portal" className="inline-block px-6 py-2 rounded-xl bg-primary text-primary-foreground font-medium">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground animate-pulse font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-6 bg-card p-8 rounded-2xl border border-border shadow-elegant">
          <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <User className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-foreground">Profile Not Found</h2>
          <p className="text-muted-foreground">We couldn't find a student profile linked to your account. Please contact administration.</p>
          <Link to="/portal" className="inline-block px-6 py-2 rounded-xl bg-primary text-primary-foreground font-medium">
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  const renderTimetable = () => (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-bold text-foreground">My Class Timetable</h2>
      <p className="text-muted-foreground">{profile?.class_name || "Assigned Class"}</p>

      <div className="grid gap-4">
        {timetable.length > 0 ? [...new Set(timetable.map(entry => entry.day_of_week))].map(day => (
          <div key={day} className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="bg-primary/10 px-4 py-3 border-b border-border">
              <h3 className="font-semibold text-foreground">{day}</h3>
            </div>
            <div className="divide-y divide-border">
              {timetable.filter(entry => entry.day_of_week === day).map((period) => (
                <div
                  key={period.id}
                  className="flex items-center gap-4 px-4 py-3"
                >
                  <div className="w-24 text-sm font-medium text-muted-foreground">
                    {period.period_start.slice(0, 5)}–{period.period_end.slice(0, 5)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {period.subject_name}
                    </p>
                    {period.teacher_name && <p className="text-xs text-muted-foreground">{period.teacher_name}</p>}
                  </div>
                  {period.room && (
                    <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                      {period.room}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )) : <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">No timetable has been published for this class yet.</div>}
      </div>
    </div>
  );

  const renderDashboard = () => (
    <>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Average Grade */}
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-sm text-muted-foreground mb-1">Average Grade</p>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold text-foreground">{averageGrade}%</span>
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Live data
          </p>
        </div>

        {/* Class Rank */}
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-sm text-muted-foreground mb-1">Class Rank</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-muted-foreground">—</span>
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-amber-600" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Rank is not available</p>
        </div>

        {/* Attendance */}
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-sm text-muted-foreground mb-1">Attendance</p>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold text-foreground">{attendanceRate}%</span>
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${attendanceRate}%` }}></div>
          </div>
        </div>

        {/* Fees Balance */}
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-sm text-muted-foreground mb-1">Fees Balance</p>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold text-foreground">${totalFeesDue}</span>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">${totalPaid} paid of ${totalBilled}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Results */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading font-bold text-lg text-foreground">Recent Results</h2>
            <button onClick={() => setActiveNav("results")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {(grades || []).slice(0, 4).map((result, index) => {
              const gradeInfo = calculateGrade(result.score);
              return (
                <div key={index} className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{result.subject_name}</h4>
                    <p className="text-xs text-muted-foreground">{result.assessment_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">{result.score}%</p>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${gradeInfo.bgColor} ${gradeInfo.color}`}>
                      Grade {gradeInfo.grade}
                    </span>
                  </div>
                </div>
              );
            })}
            {grades.length === 0 && (
              <div className="py-8 text-center text-muted-foreground italic">No recent results found.</div>
            )}
          </div>
        </div>

        {/* Announcements */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-heading font-bold text-lg text-foreground mb-6">Announcements</h2>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">No announcements are currently available.</p>
          </div>
        </div>
      </div>

      {/* Upcoming Assignments */}
      <div className="mt-6 bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading font-bold text-lg text-foreground">Upcoming Assignments</h2>
          <button onClick={() => setActiveNav("elearning")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            View All
          </button>
        </div>
        <p className="text-sm text-muted-foreground">Assignments will appear here when teachers publish them.</p>
      </div>
    </>
  );

  const renderContent = () => {
    const lockedResultsMessage = (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="max-w-xl w-full bg-card border border-amber-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <DollarSign className="h-8 w-8" />
          </div>
          <h3 className="font-heading text-2xl font-bold text-foreground mb-2">Results Are Locked</h3>
          <p className="text-muted-foreground mb-4">
            Academic results and the report card are currently hidden because the account has an outstanding balance of ${totalFeesDue.toFixed(2)}.
          </p>
          <p className="text-sm text-muted-foreground">Please clear your account balance in the fees section before viewing results.</p>
        </div>
      </div>
    );

    switch (activeNav) {
      case "timetable": return renderTimetable();
      case "report-card": return resultsLocked ? lockedResultsMessage : <ReportCardSection studentId={profile.id} />;
      case "fees": return <StudentFeesSection studentId={profile.id} />;
      case "results": return resultsLocked ? lockedResultsMessage : <ResultsSection studentId={profile.id} />;
      case "elearning": return <ELearningSection />;
      case "library": return <StudentLibrarySection />;
      case "settings": return <StudentSettingsSection />;
      case "dashboard":
      default: return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen flex bg-background dashboard-3d portal-dashboard">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`portal-sidebar fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[hsl(var(--forest-dark))] text-white/90 flex flex-col transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo & School Name */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-accent to-gold-dark p-[2px] shadow-lg shadow-accent/20">
              <div className="h-full w-full rounded-[10px] bg-forest flex items-center justify-center border border-white/10">
                <img src={logo} alt="Able God College" className="h-7 w-7 object-contain" />
              </div>
            </div>
            <div>
              <h1 className="font-heading font-bold text-lg text-white">Student Portal</h1>
              <p className="text-[10px] text-accent font-bold uppercase tracking-[0.2em]">Able God College</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveNav(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all text-sm ${activeNav === item.id
                ? "bg-accent text-accent-foreground font-bold shadow-lg shadow-accent/25"
                : "text-white/75 hover:text-white hover:bg-white/10"
                }`}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </button>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 mb-4 p-2 rounded-2xl bg-white/5 border border-white/5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-accent to-gold-dark flex items-center justify-center shadow-lg shadow-accent/20">
              <User className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="font-bold text-sm text-white">{profile.name}</p>
              <p className="text-[10px] text-accent font-bold uppercase tracking-tight">{profile.class_name}</p>
            </div>
          </div>
          <Link
            to="/portal"
            onClick={clearAuth}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-destructive/10 text-destructive font-bold hover:bg-destructive/20 transition-all border border-destructive/20 text-sm"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="portal-header bg-[hsl(var(--forest-dark))] border-b border-white/5 p-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-white/10 transition-colors">
              <Menu className="h-5 w-5 text-white" />
            </button>
            <div>
              <h1 className="font-heading text-2xl font-bold text-white">
                {activeNav === "timetable" ? "My Timetable" :
                  activeNav === "report-card" ? "Report Card" :
                    activeNav === "fees" ? "My Fees & Payments" :
                      `Welcome back, ${profile.name.split(' ')[0]}!`}
              </h1>
              <p className="text-white/50 text-sm">{profile.class_name} • Term 1 2024</p>
            </div>
          </div>
          <button className="relative p-2 rounded-xl hover:bg-white/10 transition-colors">
            <Bell className="h-6 w-6 text-white/60" />
            <span className="absolute top-1 right-1 h-4 w-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </button>
        </header>

        <div className="p-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
