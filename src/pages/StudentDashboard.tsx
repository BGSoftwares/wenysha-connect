import { useState } from "react";
import { Link } from "react-router-dom";
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
  TrendingDown,
  Users,
  CheckCircle,
  Clock,
  User,
  Award
} from "lucide-react";
import logo from "@/assets/wenyasha-logo.jpg";
import ReportCardSection from "@/components/student/ReportCardSection";
import StudentFeesSection from "@/components/student/StudentFeesSection";
import ResultsSection from "@/components/student/ResultsSection";
import ELearningSection from "@/components/student/ELearningSection";
import StudentSettingsSection from "@/components/student/StudentSettingsSection";
import { calculateGrade } from "@/lib/grading";

const navigation = [
  { name: "Dashboard", icon: Home, id: "dashboard" },
  { name: "My Results", icon: FileText, id: "results" },
  { name: "Report Card", icon: Award, id: "report-card" },
  { name: "E-Learning", icon: BookOpen, id: "elearning" },
  { name: "Fees", icon: DollarSign, id: "fees" },
  { name: "Timetable", icon: Calendar, id: "timetable" },
  { name: "Settings", icon: Settings, id: "settings" },
];

const recentResults = [
  { subject: "Mathematics", score: 85 },
  { subject: "English", score: 78 },
  { subject: "Physics", score: 72 },
  { subject: "Chemistry", score: 48 },
];

const assignments = [
  { subject: "Mathematics", title: "Quadratic Equations", due: "Dec 20, 2024", status: "pending" },
  { subject: "English", title: "Essay Writing", due: "Dec 18, 2024", status: "submitted" },
  { subject: "Physics", title: "Lab Report", due: "Dec 22, 2024", status: "pending" },
];

const announcements = [
  { title: "Mid-Term Examinations", date: "Dec 15, 2024", priority: "high" },
  { title: "Sports Day Preparations", date: "Dec 10, 2024", priority: "medium" },
  { title: "Holiday Schedule Released", date: "Dec 8, 2024", priority: "low" },
];

const timetableData = [
  { day: "Monday", periods: [
    { time: "08:00-08:40", subject: "Mathematics", teacher: "Mrs. Moyo", room: "Room 12" },
    { time: "08:40-09:20", subject: "English", teacher: "Ms. Phiri", room: "Room 5" },
    { time: "09:20-10:00", subject: "Physics", teacher: "Mr. Ncube", room: "Lab 1" },
    { time: "10:00-10:30", subject: "Break", teacher: "", room: "" },
    { time: "10:30-11:10", subject: "Chemistry", teacher: "Mr. Ncube", room: "Lab 2" },
    { time: "11:10-11:50", subject: "History", teacher: "Mr. Dube", room: "Room 8" },
    { time: "11:50-12:30", subject: "Shona", teacher: "Mrs. Banda", room: "Room 3" },
  ]},
  { day: "Tuesday", periods: [
    { time: "08:00-08:40", subject: "English", teacher: "Ms. Phiri", room: "Room 5" },
    { time: "08:40-09:20", subject: "Geography", teacher: "Mr. Moyo", room: "Room 10" },
    { time: "09:20-10:00", subject: "Mathematics", teacher: "Mrs. Moyo", room: "Room 12" },
    { time: "10:00-10:30", subject: "Break", teacher: "", room: "" },
    { time: "10:30-11:10", subject: "Biology", teacher: "Mrs. Chikwanda", room: "Lab 3" },
    { time: "11:10-11:50", subject: "Physics", teacher: "Mr. Ncube", room: "Lab 1" },
    { time: "11:50-12:30", subject: "PE", teacher: "Mr. Sibanda", room: "Field" },
  ]},
  { day: "Wednesday", periods: [
    { time: "08:00-08:40", subject: "Chemistry", teacher: "Mr. Ncube", room: "Lab 2" },
    { time: "08:40-09:20", subject: "Mathematics", teacher: "Mrs. Moyo", room: "Room 12" },
    { time: "09:20-10:00", subject: "English", teacher: "Ms. Phiri", room: "Room 5" },
    { time: "10:00-10:30", subject: "Break", teacher: "", room: "" },
    { time: "10:30-11:10", subject: "History", teacher: "Mr. Dube", room: "Room 8" },
    { time: "11:10-11:50", subject: "Geography", teacher: "Mr. Moyo", room: "Room 10" },
    { time: "11:50-12:30", subject: "Biology", teacher: "Mrs. Chikwanda", room: "Lab 3" },
  ]},
  { day: "Thursday", periods: [
    { time: "08:00-08:40", subject: "Physics", teacher: "Mr. Ncube", room: "Lab 1" },
    { time: "08:40-09:20", subject: "Shona", teacher: "Mrs. Banda", room: "Room 3" },
    { time: "09:20-10:00", subject: "Mathematics", teacher: "Mrs. Moyo", room: "Room 12" },
    { time: "10:00-10:30", subject: "Break", teacher: "", room: "" },
    { time: "10:30-11:10", subject: "English", teacher: "Ms. Phiri", room: "Room 5" },
    { time: "11:10-11:50", subject: "Chemistry", teacher: "Mr. Ncube", room: "Lab 2" },
    { time: "11:50-12:30", subject: "Art", teacher: "Ms. Ndlovu", room: "Art Room" },
  ]},
  { day: "Friday", periods: [
    { time: "08:00-08:40", subject: "Biology", teacher: "Mrs. Chikwanda", room: "Lab 3" },
    { time: "08:40-09:20", subject: "Mathematics", teacher: "Mrs. Moyo", room: "Room 12" },
    { time: "09:20-10:00", subject: "History", teacher: "Mr. Dube", room: "Room 8" },
    { time: "10:00-10:30", subject: "Break", teacher: "", room: "" },
    { time: "10:30-11:10", subject: "English", teacher: "Ms. Phiri", room: "Room 5" },
    { time: "11:10-11:50", subject: "Physics", teacher: "Mr. Ncube", room: "Lab 1" },
    { time: "11:50-12:30", subject: "Club Activities", teacher: "", room: "Various" },
  ]},
];

const StudentDashboard = () => {
  const [activeNav, setActiveNav] = useState("dashboard");

  const renderTimetable = () => (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-bold text-foreground">My Class Timetable</h2>
      <p className="text-muted-foreground">Form 4A - Term 1 2024</p>
      
      <div className="grid gap-4">
        {timetableData.map((daySchedule) => (
          <div key={daySchedule.day} className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="bg-primary/10 px-4 py-3 border-b border-border">
              <h3 className="font-semibold text-foreground">{daySchedule.day}</h3>
            </div>
            <div className="divide-y divide-border">
              {daySchedule.periods.map((period, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center gap-4 px-4 py-3 ${
                    period.subject === "Break" ? "bg-secondary/30" : ""
                  }`}
                >
                  <div className="w-24 text-sm font-medium text-muted-foreground">
                    {period.time}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${period.subject === "Break" ? "text-muted-foreground italic" : "text-foreground"}`}>
                      {period.subject}
                    </p>
                    {period.teacher && (
                      <p className="text-xs text-muted-foreground">{period.teacher}</p>
                    )}
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
        ))}
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
            <span className="text-3xl font-bold text-foreground">78%</span>
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            +5% from last term
          </p>
        </div>

        {/* Class Rank */}
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-sm text-muted-foreground mb-1">Class Rank</p>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold text-foreground">#5</span>
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-amber-600" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">out of 45 students</p>
        </div>

        {/* Attendance */}
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-sm text-muted-foreground mb-1">Attendance</p>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold text-foreground">95%</span>
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full w-[95%] bg-primary rounded-full"></div>
          </div>
        </div>

        {/* Fees Balance */}
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-sm text-muted-foreground mb-1">Fees Balance</p>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold text-foreground">$350</span>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">$850 paid of $1200</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Results */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading font-bold text-lg text-foreground">Recent Results</h2>
            <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {recentResults.map((result, index) => {
              const gradeInfo = calculateGrade(result.score);
              const prevScore = index === 0 ? 80 : index === 1 ? 75 : index === 2 ? 75 : 52;
              const trend = result.score >= prevScore ? "up" : "down";
              return (
                <div key={index} className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{result.subject}</h4>
                    <p className="text-xs text-muted-foreground">Latest assessment</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">{result.score}%</p>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${gradeInfo.bgColor} ${gradeInfo.color}`}>
                      Grade {gradeInfo.grade}
                    </span>
                  </div>
                  {trend === "up" ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Announcements */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-heading font-bold text-lg text-foreground mb-6">Announcements</h2>
          <div className="space-y-4">
            {announcements.map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className={`h-2 w-2 rounded-full mt-2 ${
                  item.priority === "high" ? "bg-red-500" :
                  item.priority === "medium" ? "bg-amber-500" :
                  "bg-green-500"
                }`} />
                <div>
                  <p className="font-medium text-foreground text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Assignments */}
      <div className="mt-6 bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading font-bold text-lg text-foreground">Upcoming Assignments</h2>
          <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            View All
          </button>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {assignments.map((assignment, index) => (
            <div key={index} className="p-4 rounded-xl border-l-4 border-primary bg-secondary/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium px-2 py-1 rounded bg-card border border-border text-foreground">
                  {assignment.subject}
                </span>
                <span className={`text-xs font-medium ${
                  assignment.status === "submitted" ? "text-green-600" : "text-amber-600"
                }`}>
                  {assignment.status === "submitted" ? "Submitted" : "Pending"}
                </span>
              </div>
              <h4 className="font-medium text-foreground mt-2">{assignment.title}</h4>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Due: {assignment.due}
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  const renderContent = () => {
    switch (activeNav) {
      case "timetable": return renderTimetable();
      case "report-card": return <ReportCardSection />;
      case "fees": return <StudentFeesSection />;
      case "dashboard": 
      default: return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-primary text-primary-foreground flex flex-col">
        {/* Logo & School Name */}
        <div className="p-6 border-b border-primary-foreground/10">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Wenyasha" className="h-10 w-10 rounded-lg object-contain bg-card" />
            <div>
              <h1 className="font-heading font-bold text-lg">Student Portal</h1>
              <p className="text-xs text-primary-foreground/70">Wenyasha International School</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                activeNav === item.id
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-primary-foreground/80 hover:bg-primary-foreground/10"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </button>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-primary-foreground/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-sm">John Moyo</p>
              <p className="text-xs text-primary-foreground/70">Form 4A</p>
            </div>
          </div>
          <Link
            to="/portal"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground font-medium hover:bg-accent/90 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-card border-b border-border p-6 flex items-center justify-between sticky top-0 z-10">
          <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
              {activeNav === "timetable" ? "My Timetable" : 
               activeNav === "report-card" ? "Report Card" : 
               activeNav === "fees" ? "My Fees & Payments" :
               "Welcome back, John!"}
            </h1>
            <p className="text-muted-foreground text-sm">Form 4A • Term 1 2024</p>
          </div>
          <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
            <Bell className="h-6 w-6 text-muted-foreground" />
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
