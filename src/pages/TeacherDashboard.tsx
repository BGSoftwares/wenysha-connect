import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Home,
  BookOpen,
  Menu as MenuIcon,
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
import logo from "/able-god-college-logo.png";
import { clearAuth } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  useTeacherProfile,
  useAllocations,
  useStudents,
  useClasses,
  useExams,
  useExamMarks,
  useSaveExamMark,
  useAttendanceRecords,
  useUpdateAttendance
} from "@/lib/hooks";
import { toast } from "sonner";
import { calculateGrade } from "@/lib/grading";
import { getPrincipalComment, getTeacherComment, TEACHER_COMMENT_LIBRARY } from "@/lib/reportComments";

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

const contentMaterials = [
  { id: 1, title: "Quadratic Equations Notes", subject: "Mathematics", type: "PDF", uploadDate: "Dec 10, 2024", downloads: 38 },
  { id: 2, title: "Statistics Formulas", subject: "Statistics", type: "PDF", uploadDate: "Dec 8, 2024", downloads: 25 },
  { id: 3, title: "Practice Problems Set 5", subject: "Mathematics", type: "PDF", uploadDate: "Dec 5, 2024", downloads: 42 },
];

const TeacherDashboard = () => {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [gradeInputs, setGradeInputs] = useState<Record<number, string>>({});
  const [classTeacherComments, setClassTeacherComments] = useState<Record<number, string>>({});
  const [reportCardRows, setReportCardRows] = useState<Array<{ studentId: number; studentName: string; score: number; percentage: number; grade: string }>>([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);

  // Data Hooks
  const { data: teacher, isLoading: isLoadingProfile } = useTeacherProfile();
  const { data: allocations = [], isLoading: isLoadingAllocations } = useAllocations({
    teacher: teacher?.id
  });

  const { data: students = [] } = useStudents();
  const { data: classes = [] } = useClasses();

  const { data: exams = [] } = useExams();
  const { data: examMarks = [] } = useExamMarks(selectedExamId ? { exam: selectedExamId, subject: selectedSubjectId || undefined } : undefined);
  const { data: attendanceRecords = [] } = useAttendanceRecords({
    date: attendanceDate
  });

  const updateAttendanceMutation = useUpdateAttendance();
  const saveExamMarkMutation = useSaveExamMark();

  const uniqueClasses = Array.from(new Set(allocations.map(a => JSON.stringify({ id: a.school_class, name: a.class_name }))))
    .map(s => JSON.parse(s));

  const uniqueSubjects = Array.from(new Set(allocations.map(a => JSON.stringify({ id: a.subject, name: a.subject_name }))))
    .map(s => JSON.parse(s));

  const classStudents = students.filter(student => student.school_class === selectedClassId);

  useEffect(() => {
    if (uniqueClasses.length > 0 && selectedClassId === null) {
      setSelectedClassId(uniqueClasses[0].id);
    }
  }, [uniqueClasses, selectedClassId]);

  useEffect(() => {
    if (selectedExamId === null && exams.length > 0) setSelectedExamId(exams[0].id);
  }, [exams, selectedExamId]);

  useEffect(() => {
    const allocatedSubject = allocations.find(allocation => allocation.school_class === selectedClassId)?.subject;
    if (allocatedSubject && !allocations.some(allocation => allocation.school_class === selectedClassId && allocation.subject === selectedSubjectId)) {
      setSelectedSubjectId(allocatedSubject);
    }
  }, [allocations, selectedClassId, selectedSubjectId]);

  const subjectStudents = selectedClassId && selectedSubjectId
    ? classStudents.filter(student => allocations.some(allocation => allocation.school_class === selectedClassId && allocation.subject === selectedSubjectId))
    : classStudents;

  useEffect(() => {
    if (!selectedClassId || !selectedSubjectId) {
      setSelectedStudentId(null);
      return;
    }

    if (subjectStudents.length === 0) {
      setSelectedStudentId(null);
      return;
    }

    const currentStudentIsValid = subjectStudents.some(student => student.id === selectedStudentId);
    if (!currentStudentIsValid) {
      setSelectedStudentId(subjectStudents[0].id);
    }
  }, [selectedClassId, selectedSubjectId, selectedStudentId, subjectStudents]);

  useEffect(() => {
    setGradeInputs(Object.fromEntries(examMarks.map(mark => [mark.student, String(mark.scored)])));
  }, [examMarks]);

  const saveGrade = async (studentId: number) => {
    if (gradeInputs[studentId]?.trim() === "") {
      toast.error("Enter a score before saving.");
      return;
    }
    const score = Number(gradeInputs[studentId]);
    if (!selectedExamId || !selectedSubjectId) {
      toast.error("Select an exam and an allocated subject first.");
      return;
    }
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      toast.error("Enter a score between 0 and 100.");
      return;
    }
    try {
      await saveExamMarkMutation.mutateAsync({ exam: selectedExamId, student: studentId, subject: selectedSubjectId, total_marks: 100, scored: score });
      toast.success("Grade saved");
    } catch {
      toast.error("Could not save this grade");
    }
  };

  const saveAllGrades = async () => {
    const enteredStudentIds = classStudents.filter(student => gradeInputs[student.id] !== undefined && gradeInputs[student.id] !== "").map(student => student.id);
    if (enteredStudentIds.length === 0) {
      toast.error("Enter at least one grade to save.");
      return;
    }
    for (const studentId of enteredStudentIds) await saveGrade(studentId);
  };

  const currentStudent = subjectStudents.find(student => student.id === selectedStudentId) ?? subjectStudents[0] ?? null;
  const selectedStudentScore = currentStudent ? gradeInputs[currentStudent.id] ?? examMarks.find(mark => mark.student === currentStudent.id && mark.subject === selectedSubjectId)?.scored ?? "" : "";
  const selectedStudentGrade = currentStudent && selectedStudentScore !== "" ? calculateGrade(Number(selectedStudentScore)).grade : "—";
  const selectedClass = classes.find(classItem => classItem.id === selectedClassId) ?? null;
  const isClassTeacherForSelectedClass = Boolean(teacher && selectedClass && selectedClass.class_teacher === teacher.id);
  const currentStudentTeacherComment = currentStudent ? classTeacherComments[currentStudent.id] || getTeacherComment(Number(selectedStudentScore) || 0) : getTeacherComment(0);

  const applyClassCommentTemplate = (studentId: number, percentage: number) => {
    setClassTeacherComments((current) => ({
      ...current,
      [studentId]: getTeacherComment(percentage),
    }));
  };

  const validateSelectedClassComments = () => {
    if (!selectedClassId || !isClassTeacherForSelectedClass) return true;

    const missingStudents = classStudents.filter((student) => !classTeacherComments[student.id]?.trim());
    if (missingStudents.length > 0) {
      toast.error(`Every student in ${selectedClass?.name ?? "this class"} must have a class-teacher comment before the report card can be generated.`);
      return false;
    }
    return true;
  };

  const generateReportCardPreview = () => {
    if (!selectedClassId || !selectedSubjectId || !selectedExamId) {
      toast.error("Select a class, subject, and exam to generate a report card.");
      return;
    }

    if (!validateSelectedClassComments()) {
      return;
    }

    const rows = subjectStudents.map(student => {
      const mark = examMarks.find(item => item.student === student.id && item.subject === selectedSubjectId);
      const score = mark ? Number(mark.scored) : 0;
      const total = mark ? Number(mark.total_marks) : 100;
      const percentage = total > 0 ? (score / total) * 100 : 0;
      return {
        studentId: student.id,
        studentName: student.name,
        score,
        percentage,
        grade: calculateGrade(percentage).grade,
      };
    });

    setReportCardRows(rows);

    if (rows.every(row => row.score === 0)) {
      toast.error("No student marks have been entered yet for this class and subject.");
      return;
    }

    toast.success("Report card preview generated.");
  };

  const teacherName = teacher?.name || "Teacher";
  const department = teacher?.department || "General";
  const classAttendance = classStudents.map(student => ({
    student,
    status: attendanceRecords.find(record => record.student === student.id)?.status || "present",
  }));
  const exportClassAttendance = () => {
    const rows = [["Student", "Class", "Date", "Status"], ...classAttendance.map(({ student, status }) => [student.name, student.class_name || "", attendanceDate, status])];
    const csv = rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `class-attendance-${attendanceDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">My Classes</p>
              <p className="text-3xl font-bold text-foreground mt-1">{uniqueClasses.length}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">{students.filter(student => uniqueClasses.some(cls => cls.id === student.school_class)).length} students across assigned classes</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Subjects Teaching</p>
              <p className="text-3xl font-bold text-foreground mt-1">{uniqueSubjects.length}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-accent-foreground" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Assigned subjects</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Grades</p>
              <p className="text-3xl font-bold text-foreground mt-1">{exams.filter(exam => exam.status === "grading").length}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
              <FileText className="h-6 w-6 text-amber-600" />
            </div>
          </div>
          <p className="text-xs text-amber-600 mt-2">Exams awaiting grading</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg. Class Performance</p>
              <p className="text-3xl font-bold text-foreground mt-1">{examMarks.length ? `${Math.round(examMarks.reduce((sum, mark) => sum + mark.scored / Math.max(mark.total_marks, 1) * 100, 0) / examMarks.length)}%` : "—"}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-green-600 mt-2">Current exam records</p>
        </div>
      </div>

      {/* Today's Schedule & Pending Tasks */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="font-heading font-bold text-lg text-foreground mb-4">Teaching Allocations</h2>
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
            {exams.map((exam) => (
              <div key={exam.id} className="p-4 rounded-lg bg-secondary/30">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-foreground">{exam.name}</h4>
                  <span className="text-xs text-amber-600">{exam.status}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{exam.term} {exam.year}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{exam.status === "grading" ? "Grades required" : "Open exam"}</span>
                  <Button size="sm" variant="outline" className="h-7" onClick={() => { setSelectedExamId(exam.id); setActiveNav("grading"); }}>
                    <Edit className="h-3 w-3 mr-1" />
                    Grade
                  </Button>
                </div>
              </div>
            ))}
            {exams.length === 0 && <p className="text-sm text-muted-foreground">No exams have been created yet.</p>}
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-heading text-xl font-bold text-foreground">Grading</h2>
        <div className="flex flex-wrap gap-3">
          <select
            value={selectedClassId || ""}
            onChange={(e) => setSelectedClassId(Number(e.target.value))}
            className="px-4 py-2 rounded-lg border border-border bg-background text-foreground"
          >
            <option value="">Select Class</option>
            {uniqueClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={selectedSubjectId || ""} onChange={e => setSelectedSubjectId(Number(e.target.value))} className="px-4 py-2 rounded-lg border border-border bg-background text-foreground">
            <option value="">Select Subject</option>
            {allocations.filter(allocation => allocation.school_class === selectedClassId).map(allocation => <option key={allocation.subject} value={allocation.subject}>{allocation.subject_name}</option>)}
          </select>
          <select value={selectedExamId || ""} onChange={e => setSelectedExamId(Number(e.target.value))} className="px-4 py-2 rounded-lg border border-border bg-background text-foreground">
            <option value="">Select Exam</option>
            {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <Button variant="outline" onClick={generateReportCardPreview}>Generate Report Card</Button>
        </div>
      </div>

      {selectedClassId && selectedSubjectId && (
        <div className="bg-card rounded-xl border border-border p-5 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Student in {uniqueSubjects.find(subject => subject.id === selectedSubjectId)?.name || "subject"}</p>
              <h3 className="font-semibold text-foreground">Mark Entry</h3>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={currentStudent?.id ?? ""}
                onChange={(e) => setSelectedStudentId(Number(e.target.value))}
                className="px-4 py-2 rounded-lg border border-border bg-background text-foreground"
              >
                <option value="">Select student</option>
                {subjectStudents.map(student => <option key={student.id} value={student.id}>{student.name}</option>)}
              </select>
              <input
                type="number"
                min="0"
                max="100"
                placeholder="Score"
                value={selectedStudentScore}
                onChange={event => currentStudent && setGradeInputs(current => ({ ...current, [currentStudent.id]: event.target.value }))}
                className="w-24 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-center"
              />
            </div>
          </div>

          {currentStudent && selectedStudentScore !== "" && (
            <div className="rounded-xl border border-border bg-secondary/20 p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Auto grade</p>
                <p className="text-lg font-bold text-foreground">{selectedStudentGrade}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Percentage</p>
                <p className="text-lg font-bold text-foreground">{((Number(selectedStudentScore) / 100) * 100).toFixed(1)}%</p>
              </div>
            </div>
          )}

          {isClassTeacherForSelectedClass && classStudents.length > 0 && (
            <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/30 p-4 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">Class Teacher Comments</p>
                  <p className="text-xs text-muted-foreground">Required for every learner in {selectedClass?.name ?? "this class"}.</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    classStudents.forEach((student) => {
                      const score = Number(gradeInputs[student.id] ?? examMarks.find(mark => mark.student === student.id && mark.subject === selectedSubjectId)?.scored ?? 0);
                      applyClassCommentTemplate(student.id, Number.isFinite(score) ? score : 0);
                    });
                  }}
                >
                  Apply Built-in Comments
                </Button>
              </div>

              <div className="grid gap-3">
                {classStudents.map((student) => {
                  const percentage = Number(gradeInputs[student.id] ?? examMarks.find(mark => mark.student === student.id && mark.subject === selectedSubjectId)?.scored ?? 0);
                  return (
                    <div key={student.id} className="grid md:grid-cols-[1fr_2fr] gap-3 items-start rounded-lg border border-border bg-background/80 p-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{student.name}</p>
                        <select
                          className="mt-2 w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                          defaultValue=""
                          onChange={(event) => {
                            const selectedTemplate = TEACHER_COMMENT_LIBRARY.find((template) => template.label === event.target.value);
                            if (selectedTemplate) {
                              setClassTeacherComments((current) => ({
                                ...current,
                                [student.id]: selectedTemplate.text,
                              }));
                            }
                          }}
                        >
                          <option value="">Choose built-in comment</option>
                          {TEACHER_COMMENT_LIBRARY.map((template) => (
                            <option key={template.label} value={template.label}>{template.label}</option>
                          ))}
                        </select>
                      </div>

                      <textarea
                        value={classTeacherComments[student.id] ?? ""}
                        onChange={(event) => setClassTeacherComments((current) => ({
                          ...current,
                          [student.id]: event.target.value,
                        }))}
                        placeholder={`Comment for ${student.name}...`}
                        className="w-full min-h-[80px] px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {reportCardRows.length > 0 && (
        <div className="bg-card rounded-xl border border-border overflow-hidden print:border-none">
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6 border-b border-border">
            <div className="text-center mb-6">
              <h1 className="font-heading text-2xl font-bold text-foreground tracking-wide">
                STUDENT ONLINE REPORT CARD
              </h1>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <p className="text-sm"><span className="font-semibold text-foreground">{currentStudent?.name || "Student"}</span></p>
                <p className="text-sm text-muted-foreground">Grade: {uniqueClasses.find(c => c.id === selectedClassId)?.name || "Class"}</p>
                <p className="text-sm text-muted-foreground">Exam: {exams.find(exam => exam.id === selectedExamId)?.name || "Selected exam"}</p>
                <p className="text-sm text-muted-foreground">Passed: {reportCardRows.filter(row => row.percentage >= 40).length} out of {reportCardRows.length}</p>
                <p className="text-sm text-muted-foreground">Date: {new Date().toLocaleDateString()}</p>
              </div>

              <div className="flex justify-center">
                <img src={logo} alt="School Logo" className="h-24 w-24 mx-auto rounded-lg object-contain border border-border bg-white p-2" />
              </div>

              <div className="text-right space-y-1">
                <p className="font-semibold text-foreground">Able God College</p>
                <p className="text-sm text-muted-foreground">Phone: {teacher?.phone || schoolContact.phones.map((phone) => phone.label).join(" / ")}</p>
                <p className="text-sm text-muted-foreground">{schoolContact.address}</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[hsl(220,25%,18%)] text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">SUBJECT</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">MARKS</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">SCORED</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">PERC(%)</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">GRADE</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">COMMENT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reportCardRows.map((row) => {
                  const percentage = row.percentage;
                  const gradeInfo = calculateGrade(percentage);
                  return (
                    <tr key={row.studentId} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{uniqueSubjects.find(subject => subject.id === selectedSubjectId)?.name || "Subject"}</td>
                      <td className="px-4 py-3 text-sm text-center text-muted-foreground">100</td>
                      <td className="px-4 py-3 text-sm text-center font-medium text-foreground">{row.score.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-center text-muted-foreground">{percentage.toFixed(2)}%</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${gradeInfo.bgColor} ${gradeInfo.color}`}>
                          {gradeInfo.grade}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{gradeInfo.meaning}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-6 border-t border-border bg-secondary/10 space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="rounded-lg border border-border bg-white p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Teacher comment</p>
                <p className="mt-1 text-sm text-foreground italic">{currentStudentTeacherComment}</p>
              </div>
              <div className="rounded-lg border border-border bg-white p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Principal comment</p>
                <p className="mt-1 text-sm text-foreground italic">{getPrincipalComment(reportCardRows.reduce((sum, row) => sum + row.percentage, 0) / Math.max(reportCardRows.length, 1))}</p>
              </div>
              <div className="rounded-lg border border-border bg-white p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Attendance</p>
                <p className="mt-1 text-sm text-foreground">{classStudents.filter(student => attendanceRecords.some(record => record.student === student.id && record.status === "present")).length} / {classStudents.length} present this term</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">This report is electronically generated, follow the link to verify the report.</p>
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileText className="h-16 w-16" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-secondary/30">
          <h3 className="font-medium text-foreground">{uniqueClasses.find(c => c.id === selectedClassId)?.name || "Select Class"} - {uniqueSubjects.find(subject => subject.id === selectedSubjectId)?.name || "Select Subject"}</h3>
          <p className="text-sm text-muted-foreground">{exams.find(exam => exam.id === selectedExamId)?.name || "Select an exam"}</p>
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
            {subjectStudents.map((student) => (
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
                    value={gradeInputs[student.id] ?? examMarks.find(mark => mark.student === student.id && mark.subject === selectedSubjectId)?.scored ?? ""}
                    onChange={event => setGradeInputs(current => ({ ...current, [student.id]: event.target.value }))}
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-xs px-2 py-1 rounded font-medium bg-secondary text-muted-foreground">
                    {gradeInputs[student.id] !== undefined && gradeInputs[student.id] !== "" ? calculateGrade(Number(gradeInputs[student.id])).grade : "-"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="outline" size="sm" onClick={() => saveGrade(student.id)} disabled={saveExamMarkMutation.isPending || !selectedExamId || !selectedSubjectId}>Save</Button>
                </td>
              </tr>
            ))}
            {subjectStudents.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-muted-foreground italic">
                  No students found for the selected class and subject combination.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="p-4 border-t border-border flex justify-end">
          <Button variant="gold" onClick={saveAllGrades} disabled={saveExamMarkMutation.isPending || !selectedExamId || !selectedSubjectId}>{saveExamMarkMutation.isPending ? "Saving…" : "Save All Grades"}</Button>
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
            <span className="text-green-600">Present: {classAttendance.filter(item => item.status === "present").length}</span>
            <span className="text-red-500">Absent: {classAttendance.filter(item => item.status === "absent").length}</span>
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
            {classStudents.map((student) => {
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
          <Button variant="gold" onClick={exportClassAttendance} disabled={classAttendance.length === 0}>Download Attendance</Button>
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
                defaultValue=""
                className="w-full mt-1 px-4 py-2 rounded-lg border border-border bg-background text-foreground"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Phone</label>
              <input
                type="tel"
                defaultValue=""
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
    <div className="min-h-screen flex bg-background dashboard-3d portal-dashboard">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`portal-sidebar fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[hsl(var(--forest-dark))] text-white/90 flex flex-col transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-accent to-gold-dark p-[2px] shadow-lg shadow-accent/20">
              <div className="h-full w-full rounded-[10px] bg-forest flex items-center justify-center border border-white/10">
                <img src={logo} alt="Able God College" className="h-7 w-7 object-contain" />
              </div>
            </div>
            <div>
              <h1 className="font-heading font-bold text-lg text-white">Teacher Portal</h1>
              <p className="text-[10px] text-accent font-bold uppercase tracking-[0.2em]">Able God College</p>
            </div>
          </div>
        </div>

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

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 mb-4 p-2 rounded-2xl bg-white/5 border border-white/5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-accent to-gold-dark flex items-center justify-center shadow-lg shadow-accent/20">
              <User className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="font-bold text-sm text-white">{teacherName}</p>
              <p className="text-[10px] text-accent font-bold uppercase tracking-tight">{department}</p>
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
        <header className="portal-header bg-[hsl(var(--forest-dark))] border-b border-white/5 p-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-white/10 transition-colors">
              <MenuIcon className="h-5 w-5 text-white" />
            </button>
            <div>
              <h1 className="font-heading text-2xl font-bold text-white">
                {navigation.find(n => n.id === activeNav)?.name || "Dashboard"}
              </h1>
              <p className="text-white/50 text-sm">{department} Department</p>
            </div>
          </div>
          <button className="relative p-2 rounded-xl hover:bg-white/10 transition-colors">
            <Bell className="h-6 w-6 text-white/60" />
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
