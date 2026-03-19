import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Home,
  BookOpen,
  GraduationCap,
  Calendar,
  Settings,
  Bell,
  LogOut,
  FileText,
  CheckSquare,
  Users,
  Edit,
  Eye,
  Plus,
  Clock,
  User,
  TrendingUp,
  Upload,
  Check,
  X
} from "lucide-react";
import logo from "@/assets/wenyasha-logo.jpg";
import { Button } from "@/components/ui/button";
import {
  useTeacherProfile,
  useAllocations,
  useStudents,
  useExams,
  useExamMarks,
  useAttendanceRecords,
  useUpdateAttendance
} from "@/lib/hooks";
import { toast } from "sonner";

const navigation = [
  { name: "Dashboard", icon: Home, id: "dashboard" },
  { name: "My Classes", icon: Users, id: "classes" },
  { name: "Subjects", icon: BookOpen, id: "subjects" },
  { name: "Grading", icon: FileText, id: "grading" },
  { name: "Attendance", icon: CheckSquare, id: "attendance" },
  { name: "Content", icon: Upload, id: "content" },
  { name: "Timetable", icon: Calendar, id: "timetable" },
  { name: "Settings", icon: Settings, id: "settings" },
];

const myClasses = [
  { id: 1, name: "Form 4A", subject: "Mathematics", students: 42, nextClass: "Today, 08:00" },
  { id: 2, name: "Form 3B", subject: "Mathematics", students: 38, nextClass: "Today, 10:30" },
  { id: 3, name: "Form 4B", subject: "Statistics", students: 40, nextClass: "Tomorrow, 08:40" },
];

const mySubjects = [
  { id: 1, name: "Mathematics", code: "MATH", classes: ["Form 4A", "Form 3B"], curriculum: "ZIMSEC & Cambridge" },
  { id: 2, name: "Statistics", code: "STAT", classes: ["Form 4B"], curriculum: "Cambridge" },
];

const pendingGrades = [
  { id: 1, class: "Form 4A", subject: "Mathematics", assessment: "Mid-Term Exam", dueDate: "Dec 18, 2024", submitted: 38, total: 42 },
  { id: 2, class: "Form 3B", subject: "Mathematics", assessment: "Assignment 5", dueDate: "Dec 20, 2024", submitted: 32, total: 38 },
  { id: 3, class: "Form 4B", subject: "Statistics", assessment: "Quiz 3", dueDate: "Dec 22, 2024", submitted: 40, total: 40 },
];

const students = [
  { id: 1, name: "John Moyo", class: "Form 4A", attendance: 95, avgGrade: 78 },
  { id: 2, name: "Sarah Ndlovu", class: "Form 4A", attendance: 98, avgGrade: 85 },
  { id: 3, name: "Peter Chikwanda", class: "Form 4A", attendance: 88, avgGrade: 72 },
  { id: 4, name: "Mary Sibanda", class: "Form 4A", attendance: 92, avgGrade: 80 },
  { id: 5, name: "James Dube", class: "Form 4A", attendance: 85, avgGrade: 68 },
];

const contentMaterials = [
  { id: 1, title: "Quadratic Equations Notes", subject: "Mathematics", type: "PDF", uploadDate: "Dec 10, 2024", downloads: 38 },
  { id: 2, title: "Statistics Formulas", subject: "Statistics", type: "PDF", uploadDate: "Dec 8, 2024", downloads: 25 },
  { id: 3, title: "Practice Problems Set 5", subject: "Mathematics", type: "PDF", uploadDate: "Dec 5, 2024", downloads: 42 },
];

const TeacherDashboard = () => {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);

  // Data Hooks
  const { data: teacher, isLoading: isLoadingProfile } = useTeacherProfile();
  const { data: allocations = [], isLoading: isLoadingAllocations } = useAllocations({
    teacher: teacher?.id
  });

  const { data: students = [] } = useStudents();

  const { data: exams = [] } = useExams({ status: "ongoing" });
  const { data: attendanceRecords = [] } = useAttendanceRecords({
    date: attendanceDate
  });

  const updateAttendanceMutation = useUpdateAttendance();

  const uniqueClasses = Array.from(new Set(allocations.map(a => JSON.stringify({ id: a.school_class, name: a.class_name }))))
    .map(s => JSON.parse(s));

  const uniqueSubjects = Array.from(new Set(allocations.map(a => JSON.stringify({ id: a.subject, name: a.subject_name }))))
    .map(s => JSON.parse(s));

  // Initialize selected class
  useState(() => {
    if (uniqueClasses.length > 0 && !selectedClassId) {
      setSelectedClassId(uniqueClasses[0].id);
    }
  });

  const teacherName = teacher?.name || "Teacher";
  const department = teacher?.department || "General";

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">My Classes</p>
              <p className="text-3xl font-bold text-foreground mt-1">3</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">120 students total</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Subjects Teaching</p>
              <p className="text-3xl font-bold text-foreground mt-1">2</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-accent-foreground" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Mathematics & Statistics</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Grades</p>
              <p className="text-3xl font-bold text-foreground mt-1">3</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
              <FileText className="h-6 w-6 text-amber-600" />
            </div>
          </div>
          <p className="text-xs text-amber-600 mt-2">Due this week</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg. Class Performance</p>
              <p className="text-3xl font-bold text-foreground mt-1">76%</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-green-600 mt-2">+3% from last term</p>
        </div>
      </div>

      {/* Today's Schedule & Pending Tasks */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-heading font-bold text-lg text-foreground mb-4">Today's Schedule</h2>
          <div className="space-y-3">
            {allocations.map((alloc) => (
              <div key={alloc.id} className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">{alloc.class_name} - {alloc.subject_name}</h4>
                  <p className="text-xs text-muted-foreground">{alloc.periods} periods/week</p>
                </div>
              </div>
            ))}
            {allocations.length === 0 && <p className="text-sm text-muted-foreground italic">No allocations found.</p>}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-heading font-bold text-lg text-foreground mb-4">Pending Assessments</h2>
          <div className="space-y-3">
            {pendingGrades.map((grade) => (
              <div key={grade.id} className="p-4 rounded-lg bg-secondary/30">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-foreground">{grade.assessment}</h4>
                  <span className="text-xs text-amber-600">{grade.dueDate}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{grade.class} • {grade.subject}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{grade.submitted}/{grade.total} graded</span>
                  <Button size="sm" variant="outline" className="h-7">
                    <Edit className="h-3 w-3 mr-1" />
                    Grade
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderClasses = () => (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-bold text-foreground">My Classes</h2>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {uniqueClasses.map((cls) => (
          <div key={cls.id} className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <Button variant="outline" size="sm" onClick={() => { setSelectedClassId(cls.id); setActiveNav("attendance"); }}>
                <Eye className="h-4 w-4 mr-1" />
                Manage
              </Button>
            </div>
            <h3 className="font-bold text-lg text-foreground">{cls.name}</h3>
            <p className="text-sm text-muted-foreground mb-3">Teaching {allocations.filter(a => a.school_class === cls.id).length} subjects</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSubjects = () => (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-bold text-foreground">My Subjects</h2>

      <div className="grid gap-4">
        {uniqueSubjects.map((subject) => (
          <div key={subject.id} className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{subject.name}</h3>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-2">My Classes for this Subject:</p>
              <div className="flex flex-wrap gap-2">
                {allocations.filter(a => a.subject === subject.id).map((a, i) => (
                  <span key={i} className="text-xs px-3 py-1 rounded-full bg-secondary text-foreground">{a.class_name}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderGrading = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold text-foreground">Grading</h2>
        <div className="flex gap-3">
          <select
            value={selectedClassId || ""}
            onChange={(e) => setSelectedClassId(Number(e.target.value))}
            className="px-4 py-2 rounded-lg border border-border bg-background text-foreground"
          >
            <option value="">Select Class</option>
            {uniqueClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="px-4 py-2 rounded-lg border border-border bg-background text-foreground">
            <option value="">Select Exam</option>
            {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-secondary/30">
          <h3 className="font-medium text-foreground">{uniqueClasses.find(c => c.id === selectedClassId)?.name || "Select Class"} - Mathematics</h3>
          <p className="text-sm text-muted-foreground">Mid-Term Examination</p>
        </div>
        <table className="w-full">
          <thead className="bg-secondary/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Student</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-foreground">Score</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-foreground">Grade</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm text-foreground">{student.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="number"
                    className="w-16 text-center px-2 py-1 rounded border border-border bg-background text-foreground"
                    min="0"
                    max="100"
                    placeholder="-"
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-xs px-2 py-1 rounded font-medium bg-secondary text-muted-foreground">-</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="outline" size="sm">Save</Button>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-muted-foreground italic">
                  No students found for the selected class.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="p-4 border-t border-border flex justify-end">
          <Button variant="gold" onClick={() => toast.info("Bulk submission coming soon")}>Submit All Grades</Button>
        </div>
      </div>
    </div>
  );

  const renderAttendance = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="font-heading text-xl font-bold text-foreground">Attendance</h2>
        <div className="flex gap-3">
          <select
            value={selectedClassId || ""}
            onChange={(e) => setSelectedClassId(Number(e.target.value))}
            className="px-4 py-2 rounded-lg border border-border bg-background text-foreground"
          >
            {uniqueClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input
            type="date"
            value={attendanceDate}
            onChange={(e) => setAttendanceDate(e.target.value)}
            className="px-4 py-2 rounded-lg border border-border bg-background text-foreground"
          />
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-secondary/30 flex items-center justify-between">
          <div>
            <h3 className="font-medium text-foreground">{uniqueClasses.find(c => c.id === selectedClassId)?.name || "Select Class"} - Attendance</h3>
            <p className="text-sm text-muted-foreground">{new Date(attendanceDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="flex gap-4 text-sm">
            <span className="text-green-600">Present: 40</span>
            <span className="text-red-500">Absent: 2</span>
          </div>
        </div>
        <table className="w-full">
          <thead className="bg-secondary/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Student</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-foreground">Status</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-foreground">Overall %</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => {
              const record = attendanceRecords.find(r => r.student === student.id);
              const status = record?.status || "present";

              return (
                <tr key={student.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm text-foreground">{student.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={async () => {
                          try {
                            await updateAttendanceMutation.mutateAsync({ student: student.id as number, date: attendanceDate, status: "present" });
                            toast.success(`Marked ${student.name} as present`);
                          } catch (e) { toast.error("Failed to update attendance"); }
                        }}
                        className={`p-1.5 rounded-lg transition-colors ${status === "present" ? "bg-green-500 text-white" : "bg-secondary text-muted-foreground hover:bg-green-100"}`}
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await updateAttendanceMutation.mutateAsync({ student: student.id as number, date: attendanceDate, status: "absent" });
                            toast.success(`Marked ${student.name} as absent`);
                          } catch (e) { toast.error("Failed to update attendance"); }
                        }}
                        className={`p-1.5 rounded-lg transition-colors ${status === "absent" ? "bg-destructive text-white" : "bg-secondary text-muted-foreground hover:bg-red-100"}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await updateAttendanceMutation.mutateAsync({ student: student.id as number, date: attendanceDate, status: "late" });
                            toast.success(`Marked ${student.name} as late`);
                          } catch (e) { toast.error("Failed to update attendance"); }
                        }}
                        className={`p-1.5 rounded-lg transition-colors ${status === "late" ? "bg-amber-500 text-white" : "bg-secondary text-muted-foreground hover:bg-amber-100"}`}
                      >
                        <Clock className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-medium text-muted-foreground">-</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="p-4 border-t border-border flex justify-end">
          <Button variant="gold" onClick={() => toast.success("Attendance verified for this class")}>Verify Attendance</Button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold text-foreground">Learning Materials</h2>
        <Button variant="gold">
          <Plus className="h-4 w-4 mr-2" />
          Upload Material
        </Button>
      </div>

      <div className="grid gap-4">
        {contentMaterials.map((material) => (
          <div key={material.id} className="bg-card rounded-xl border border-border p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">{material.title}</h3>
                <p className="text-sm text-muted-foreground">{material.subject} • {material.type} • {material.uploadDate}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{material.downloads} downloads</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm"><Eye className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm"><Edit className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Area */}
      <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
        <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-medium text-foreground mb-2">Upload Learning Materials</h3>
        <p className="text-sm text-muted-foreground mb-4">Drag and drop files here, or click to browse</p>
        <Button variant="outline">Browse Files</Button>
      </div>
    </div>
  );

  const renderTimetable = () => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const periods = ["08:00-08:40", "08:40-09:20", "09:20-10:00", "10:30-11:10", "11:10-11:50", "11:50-12:30", "14:00-14:40", "14:40-15:20"];

    const mySchedule: Record<string, Record<string, { class: string; room: string } | null>> = {
      "Monday": { "08:00-08:40": { class: "Form 4A", room: "Room 12" }, "10:30-11:10": { class: "Form 3B", room: "Room 8" } },
      "Tuesday": { "08:40-09:20": { class: "Form 4B", room: "Room 12" }, "14:00-14:40": { class: "Form 4A", room: "Room 12" } },
      "Wednesday": { "08:00-08:40": { class: "Form 3B", room: "Room 8" }, "11:10-11:50": { class: "Form 4B", room: "Room 12" } },
      "Thursday": { "09:20-10:00": { class: "Form 4A", room: "Room 12" }, "14:40-15:20": { class: "Form 3B", room: "Room 8" } },
      "Friday": { "08:00-08:40": { class: "Form 4B", room: "Room 12" }, "10:30-11:10": { class: "Form 4A", room: "Room 12" } },
    };

    return (
      <div className="space-y-6">
        <h2 className="font-heading text-xl font-bold text-foreground">My Timetable</h2>

        <div className="bg-card rounded-xl border border-border overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-secondary/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground border-r border-border">Time</th>
                {days.map(day => (
                  <th key={day} className="px-4 py-3 text-center text-sm font-medium text-foreground">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map((period, idx) => (
                <tr key={period} className="border-t border-border">
                  <td className="px-4 py-3 text-sm font-medium text-foreground border-r border-border bg-secondary/30">
                    {period}
                  </td>
                  {days.map(day => {
                    const slot = mySchedule[day]?.[period];
                    const isBreak = idx === 3 || idx === 6;
                    return (
                      <td key={day} className="px-2 py-2 text-center">
                        {isBreak ? (
                          <span className="text-xs text-muted-foreground">Break</span>
                        ) : slot ? (
                          <div className="p-2 rounded bg-primary/10 border border-primary/20">
                            <p className="text-xs font-medium text-primary">{slot.class}</p>
                            <p className="text-xs text-muted-foreground">{slot.room}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-bold text-foreground">Account Settings</h2>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">Profile Information</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Full Name</label>
              <input
                type="text"
                defaultValue="Mrs. Grace Moyo"
                className="w-full mt-1 px-4 py-2 rounded-lg border border-border bg-background text-foreground"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Email</label>
              <input
                type="email"
                defaultValue="grace.moyo@wenyasha.edu.zw"
                className="w-full mt-1 px-4 py-2 rounded-lg border border-border bg-background text-foreground"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Phone</label>
              <input
                type="tel"
                defaultValue="+263 77 123 4567"
                className="w-full mt-1 px-4 py-2 rounded-lg border border-border bg-background text-foreground"
              />
            </div>
            <Button variant="gold" className="w-full">Update Profile</Button>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">Change Password</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Current Password</label>
              <input
                type="password"
                className="w-full mt-1 px-4 py-2 rounded-lg border border-border bg-background text-foreground"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">New Password</label>
              <input
                type="password"
                className="w-full mt-1 px-4 py-2 rounded-lg border border-border bg-background text-foreground"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Confirm New Password</label>
              <input
                type="password"
                className="w-full mt-1 px-4 py-2 rounded-lg border border-border bg-background text-foreground"
              />
            </div>
            <Button variant="outline" className="w-full">Change Password</Button>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="font-semibold text-foreground mb-4">Notification Preferences</h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
            <span className="text-sm text-foreground">Email notifications for new assignments</span>
            <input type="checkbox" defaultChecked className="h-4 w-4 accent-primary" />
          </label>
          <label className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
            <span className="text-sm text-foreground">SMS reminders for class schedules</span>
            <input type="checkbox" className="h-4 w-4 accent-primary" />
          </label>
          <label className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
            <span className="text-sm text-foreground">Weekly grade submission reminders</span>
            <input type="checkbox" defaultChecked className="h-4 w-4 accent-primary" />
          </label>
        </div>
      </div>
    </div>
  );

  const renderContentSection = () => {
    switch (activeNav) {
      case "dashboard": return renderDashboard();
      case "classes": return renderClasses();
      case "subjects": return renderSubjects();
      case "grading": return renderGrading();
      case "attendance": return renderAttendance();
      case "content": return renderContent();
      case "timetable": return renderTimetable();
      case "settings": return renderSettings();
      default: return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-primary text-primary-foreground flex flex-col">
        <div className="p-6 border-b border-primary-foreground/10">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Wenyasha" className="h-10 w-10 rounded-lg object-contain bg-card" />
            <div>
              <h1 className="font-heading font-bold text-lg">Teacher Portal</h1>
              <p className="text-xs text-primary-foreground/70">Wenyasha International</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${activeNav === item.id
                ? "bg-accent text-accent-foreground font-medium"
                : "text-primary-foreground/80 hover:bg-primary-foreground/10"
                }`}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-primary-foreground/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-sm">{teacherName}</p>
              <p className="text-xs text-primary-foreground/70">{department}</p>
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
        <header className="bg-card border-b border-border p-6 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">
              {navigation.find(n => n.id === activeNav)?.name || "Dashboard"}
            </h1>
            <p className="text-muted-foreground text-sm">{department} Department</p>
          </div>
          <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
            <Bell className="h-6 w-6 text-muted-foreground" />
            <span className="absolute top-1 right-1 h-4 w-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
              2
            </span>
          </button>
        </header>

        <div className="p-6">
          {renderContentSection()}
        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard;
