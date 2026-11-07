import { schoolContact } from "@/lib/schoolContact";
import DashboardExtras from "@/components/dashboard/DashboardExtras";
import AIFeedbackSection from "@/components/teacher/AIFeedbackSection";
import { Fragment, useState, useEffect, useMemo } from "react";
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
  Share2,
  Check,
  X,
  Trash2,
  Sparkles,
  MessageSquare,
  ClipboardList
} from "lucide-react";
import logo from "/able-god-college-logo.png";
import { clearAuth, getErrorMessage } from "@/lib/api";
import MarkSheetSection from "@/components/teacher/MarkSheetSection";
import ClassRegisterSection from "@/components/teacher/ClassRegisterSection";
import LearningAssignmentsSection from "@/components/teacher/LearningAssignmentsSection";
import LearningMaterialsSection from "@/components/dashboard/LearningMaterialsSection";
import CommunicationSection from "@/components/dashboard/CommunicationSection";
import ProfileSection from "@/components/admin/ProfileSection";
import StudentSettingsSection from "@/components/student/StudentSettingsSection";
import { Button } from "@/components/ui/button";
import {
  useTeacherProfile,
  useAllocations,
  useStudents,
  useClasses,
  useSubjects,
  useExams,
  useExamMarks,
  useReportCardReviews,
  useSaveClassReportComments,
  useSubmitClassReports,
  EXAM_REPORT_TYPES,
  useAttendanceRecords,
  useUpdateAttendance,
  useBulkUpdateAttendance,
  useSchoolCalendarDays,
  useAttendanceSettings,
  useTimetable,
  useBooks,
} from "@/lib/hooks";
import type { ExamReportType } from "@/lib/hooks";
import { toast } from "sonner";
import { buildAttendancePdf, sharePdfToWhatsApp } from "@/lib/pdfExport";
import { calculateGrade } from "@/lib/grading";
import { getTeacherComment, TEACHER_COMMENT_LIBRARY } from "@/lib/reportComments";
import { formatLocalDateKey, getSchoolDateStatus } from "@/lib/zimbabweSchoolCalendar";
import { formatLocalDateTime, getExamDisplayName } from "@/lib/examDisplay";

const navigation = [
  { name: "Dashboard", icon: Home, id: "dashboard" },
  { name: "My Classes", icon: Users, id: "classes" },
  { name: "Class Register", icon: Users, id: "class-register" },
  { name: "Subjects", icon: BookOpen, id: "subjects" },
  { name: "Grading", icon: FileText, id: "grading" },
  { name: "AI Coach", icon: Sparkles, id: "ai-coach" },
  { name: "Attendance", icon: CheckSquare, id: "attendance" },
  { name: "Library & Notes", icon: Upload, id: "content" },
  { name: "Assignments", icon: ClipboardList, id: "assignments" },
  { name: "Messages", icon: MessageSquare, id: "messages" },
  { name: "Timetable", icon: Calendar, id: "timetable" },
  { name: "Settings", icon: Settings, id: "settings" },
  { name: "Profile", icon: User, id: "profile" },
];

const TeacherDashboard = () => {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedReportType, setSelectedReportType] = useState<ExamReportType | "">("");
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [gradeInputs, setGradeInputs] = useState<Record<number, string>>({});
  const [classTeacherComments, setClassTeacherComments] = useState<Record<number, string>>({});
  const [reportCardRows, setReportCardRows] = useState<Array<{
    studentId: number;
    studentName: string;
    score: number | null;
    totalMarks: number;
    percentage: number | null;
    grade: string;
    comment: string;
  }>>([]);
  const [attendanceDate, setAttendanceDate] = useState(formatLocalDateKey(new Date()));
  const [attendanceSession, setAttendanceSession] = useState<"morning" | "afternoon" | "evening">("morning");
  const [attendanceDrafts, setAttendanceDrafts] = useState<Array<{
    student: number;
    date: string;
    status: "present" | "absent" | "late";
    session: "morning" | "afternoon" | "evening";
    reason?: string;
  }>>([]);
  const [attendanceDraftKeyLoaded, setAttendanceDraftKeyLoaded] = useState<string | null>(null);

  // Data Hooks
  const { data: teacher, isLoading: isLoadingProfile } = useTeacherProfile();
  const { data: teacherTimetable = [] } = useTimetable(undefined, { teacher: teacher?.id });
  const { data: allocations = [], isLoading: isLoadingAllocations } = useAllocations({
    teacher: teacher?.id
  });

  const { data: students = [] } = useStudents();
  const { data: classes = [] } = useClasses();
  const { data: allSubjects = [] } = useSubjects();
  const { data: libraryBooks = [], isLoading: isLoadingLibraryBooks, error: libraryBooksError } = useBooks();

  const { data: exams = [], isLoading: isLoadingExams, error: examsError } = useExams();
  const { data: examMarks = [] } = useExamMarks(selectedExamId ? { exam: selectedExamId, subject: selectedSubjectId || undefined } : undefined);
  const { data: classExamMarks = [] } = useExamMarks(selectedExamId ? { exam: selectedExamId } : undefined);
  const { data: reportCardReviews = [], isLoading: loadingReportCardReviews, error: reportCardReviewsError } = useReportCardReviews(selectedExamId ?? undefined);
  const { data: attendanceRecords = [] } = useAttendanceRecords({
    date: attendanceDate,
    session: attendanceSession,
  });
  const { data: calendarOverrides = [] } = useSchoolCalendarDays({ date: attendanceDate });
  const { data: attendanceSettings } = useAttendanceSettings();

  const updateAttendanceMutation = useUpdateAttendance();
  const bulkAttendanceMutation = useBulkUpdateAttendance();
  const saveClassReportComments = useSaveClassReportComments();
  const submitClassReports = useSubmitClassReports();
  const allocatedClasses = allocations.map((allocation) => ({ id: allocation.school_class, name: allocation.class_name }));
  const classTeacherClasses = classes
    .filter((schoolClass) => schoolClass.class_teacher === teacher?.id)
    .map((schoolClass) => ({ id: schoolClass.id, name: schoolClass.name }));
  const managedClasses = classes.filter((schoolClass) =>
    schoolClass.class_teacher === teacher?.id ||
    (!schoolClass.class_teacher && allocations.some(a => a.school_class === schoolClass.id))
  );
  const uniqueClasses = Array.from(
    new Map([...allocatedClasses, ...classTeacherClasses].map((schoolClass) => [schoolClass.id, schoolClass])).values(),
  );

  const uniqueSubjects = Array.from(new Set(allocations.map(a => JSON.stringify({ id: a.subject, name: a.subject_name }))))
    .map(s => JSON.parse(s));
  const contentSubjects = managedClasses.length > 0 && allSubjects.length > 0 ? allSubjects : uniqueSubjects;
  const contentPairs = [
    ...allocations.map(allocation => ({ class_name: allocation.class_name, subject_name: allocation.subject_name })),
    ...managedClasses.flatMap(schoolClass => contentSubjects.map(subject => ({ class_name: schoolClass.name, subject_name: subject.name }))),
  ];

  const examsForSelectedPair = useMemo(() => exams.filter(exam =>
    !!selectedClassId && !!selectedSubjectId &&
    exam.classes.includes(selectedClassId) && exam.subjects.includes(selectedSubjectId),
  ), [exams, selectedClassId, selectedSubjectId]);
  const writableExamsForSelectedPair = useMemo(
    () => examsForSelectedPair.filter(exam => !exam.results_published),
    [examsForSelectedPair],
  );
  const matchingExams = useMemo(() => writableExamsForSelectedPair.filter(exam =>
    !!selectedReportType && exam.report_type === selectedReportType,
  ), [writableExamsForSelectedPair, selectedReportType]);
  const otherAvailableReportTypes = EXAM_REPORT_TYPES.filter(type =>
    type.value !== selectedReportType && writableExamsForSelectedPair.some(exam => exam.report_type === type.value),
  );

  // Keep this array stable across the parent re-renders caused by mark edits.
  // MarkSheetSection uses the student list to hydrate its draft rows; rebuilding
  // it on every score keystroke made that effect overwrite the active draft.
  const classStudents = useMemo(
    () => students.filter(student => student.school_class === selectedClassId),
    [students, selectedClassId],
  );

  useEffect(() => {
    if (selectedReportType && uniqueClasses.length > 0 && selectedClassId === null) {
      setSelectedClassId(uniqueClasses[0].id);
    }
  }, [selectedReportType, uniqueClasses, selectedClassId]);

  useEffect(() => {
    if (matchingExams.length === 0) {
      if (selectedExamId !== null) setSelectedExamId(null);
      return;
    }
    if (!matchingExams.some(exam => exam.id === selectedExamId)) {
      setSelectedExamId(matchingExams[0].id);
    }
  }, [matchingExams, selectedExamId]);

  useEffect(() => {
    if (!selectedReportType) return;
    const allocatedSubject = allocations.find(allocation => allocation.school_class === selectedClassId)?.subject;
    if (allocatedSubject && !allocations.some(allocation => allocation.school_class === selectedClassId && allocation.subject === selectedSubjectId)) {
      setSelectedSubjectId(allocatedSubject);
    }
  }, [allocations, selectedReportType, selectedClassId, selectedSubjectId]);

  const subjectStudents = selectedClassId && selectedSubjectId
    ? classStudents.filter(student => allocations.some(allocation => allocation.school_class === selectedClassId && allocation.subject === selectedSubjectId))
    : classStudents;

  useEffect(() => {
    setGradeInputs(Object.fromEntries(examMarks.map(mark => [mark.student, String(mark.scored)])));
  }, [examMarks]);
  useEffect(() => {
    setClassTeacherComments(Object.fromEntries(
      reportCardReviews.map(review => [review.student, review.class_teacher_comment]),
    ));
  }, [reportCardReviews]);

  const selectedClass = classes.find(classItem => classItem.id === selectedClassId) ?? null;
  const isClassTeacherForSelectedClass = Boolean(
    teacher && selectedClass && (
      selectedClass.class_teacher === teacher.id ||
      (!selectedClass.class_teacher && allocations.some(a => a.school_class === selectedClass.id))
    )
  );
  const reportPreviewExam = exams.find(exam => exam.id === selectedExamId);
  const reportPreviewType = reportPreviewExam?.report_type ?? selectedReportType;
  const reportIssuedAt = new Date();
  const reportIssuedDate = reportPreviewType === "monthly_report_card" || reportPreviewType === "fortnightly_tests"
    ? formatLocalDateTime(reportIssuedAt)
    : reportIssuedAt.toLocaleDateString("en-GB");
  const reportIssueMonthYear = reportIssuedAt.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const reportCardHeading = reportPreviewType === "monthly_report_card"
    ? "End-of-month Examination Report Card"
    : reportPreviewType === "fortnightly_tests"
      ? "Fortnightly Test Report Card"
      : "End-of-term Report Card";
  const classReportScoredRows = reportCardRows.filter(row => row.percentage !== null);
  const classReportAverage = classReportScoredRows.length
    ? classReportScoredRows.reduce((sum, row) => sum + (row.percentage ?? 0), 0) / classReportScoredRows.length
    : 0;

  const applyClassCommentTemplate = (studentId: number, percentage: number) => {
    setClassTeacherComments((current) => ({
      ...current,
      [studentId]: getTeacherComment(percentage),
    }));
  };

  const getStudentExamAverage = (studentId: number) => {
    const savedMarks = classExamMarks.filter(mark => mark.student === studentId);
    if (!savedMarks.length) return 0;
    return savedMarks.reduce((sum, mark) => (
      sum + (mark.total_marks > 0 ? Number(mark.scored) / mark.total_marks * 100 : 0)
    ), 0) / savedMarks.length;
  };

  const classTeacherSubmission = reportCardReviews.find(review =>
    review.exam === selectedExamId && review.school_class === selectedClassId && review.class_teacher_submitted_at,
  );
  const classCommentsSaved = classStudents.every(student => classTeacherComments[student.id]?.trim());
  const reportCardMarksComplete = classStudents.length > 0 && classStudents.every(student => {
    const assignedSubjects = allocations
      .filter(allocation => allocation.school_class === selectedClassId && exams.find(exam => exam.id === selectedExamId)?.subjects.includes(allocation.subject))
      .map(allocation => allocation.subject);
    const expectedSubjects = assignedSubjects.length
      ? assignedSubjects
      : exams.find(exam => exam.id === selectedExamId)?.subjects ?? [];
    const savedSubjects = new Set(classExamMarks.filter(mark => mark.student === student.id).map(mark => mark.subject));
    return expectedSubjects.length > 0 && expectedSubjects.every(subjectId => savedSubjects.has(subjectId));
  });

  const saveClassTeacherComments = async () => {
    if (!selectedExamId || !selectedClassId) return;
    if (!classCommentsSaved) {
      toast.error("Add a class-teacher comment for every learner before saving.");
      return;
    }
    try {
      await saveClassReportComments.mutateAsync({
        exam: selectedExamId,
        school_class: selectedClassId,
        comments: classStudents.map(student => ({
          student: student.id,
          comment: classTeacherComments[student.id].trim(),
        })),
      });
      toast.success("Class-teacher comments saved.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const submitCompletedClassReports = async () => {
    if (!selectedExamId || !selectedClassId) return;
    if (!classCommentsSaved) {
      toast.error("Add a class-teacher comment for every learner before submitting.");
      return;
    }
    if (!reportCardMarksComplete) {
      toast.error("Complete each learner's marks for all subjects assigned to this class first.");
      return;
    }
    try {
      await saveClassReportComments.mutateAsync({
        exam: selectedExamId,
        school_class: selectedClassId,
        comments: classStudents.map(student => ({
          student: student.id,
          comment: classTeacherComments[student.id].trim(),
        })),
      });
      await submitClassReports.mutateAsync({ exam: selectedExamId, school_class: selectedClassId });
      toast.success("Completed class report cards sent to the principal.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
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
      const draftScore = gradeInputs[student.id]?.trim();
      const score = draftScore ? Number(draftScore) : mark ? Number(mark.scored) : null;
      const total = mark ? Number(mark.total_marks) : 100;
      const percentage = score !== null && total > 0 ? (score / total) * 100 : null;
      return {
        studentId: student.id,
        studentName: student.name,
        score,
        totalMarks: total,
        percentage,
        grade: percentage === null ? "—" : calculateGrade(percentage).grade,
        comment: classTeacherComments[student.id] || (percentage === null ? "" : getTeacherComment(percentage)),
      };
    });

    if (rows.every(row => row.score === null)) {
      setReportCardRows([]);
      toast.error("No student marks have been entered yet for this class and subject.");
      return;
    }

    setReportCardRows(rows);
    toast.success("Report card preview generated.");
  };

  const teacherName = teacher?.name || "Teacher";
  const department = teacher?.department || "General";
  const calendarOverride = calendarOverrides.find(day => day.date === attendanceDate);
  const defaultAttendanceDateStatus = getSchoolDateStatus(attendanceDate);
  const attendanceDateStatus = calendarOverride
    ? {
      isSchoolDay: calendarOverride.day_type === "school_day" && attendanceDate <= formatLocalDateKey(new Date()),
      reason: calendarOverride.day_type === "school_day" ? undefined : calendarOverride.note || `This date is marked as ${calendarOverride.day_type.replace("_", " ")}.`,
    }
    : defaultAttendanceDateStatus;
  const attendanceDraftKey = `attendance-drafts:${teacher?.id ?? "teacher"}:${selectedClassId ?? "class"}:${attendanceDate}:${attendanceSession}`;
  const syncAttendanceDrafts = bulkAttendanceMutation.mutateAsync;
  const attendanceByStudent = new Map(attendanceRecords.map((record) => [record.student, record]));
  const attendanceDraftByStudent = new Map(attendanceDrafts.map(draft => [draft.student, draft]));
  const classAttendance = classStudents.map(student => ({
    student,
    status: attendanceDraftByStudent.get(student.id)?.status || attendanceByStudent.get(student.id)?.status || "unmarked",
  }));
  const anyAttendanceMarked = classAttendance.some(({ status }) => status !== "unmarked");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(attendanceDraftKey);
      const parsed: unknown = saved ? JSON.parse(saved) : [];
      const validDrafts = Array.isArray(parsed) ? parsed.filter(item =>
        item && typeof item.student === "number" &&
        item.date === attendanceDate &&
        item.session === attendanceSession &&
        ["present", "absent", "late"].includes(item.status),
      ) : [];
      setAttendanceDrafts(validDrafts);
    } catch (error) {
      console.error("Could not read saved attendance drafts.", error);
      setAttendanceDrafts([]);
    }
    setAttendanceDraftKeyLoaded(attendanceDraftKey);
  }, [attendanceDate, attendanceDraftKey, attendanceSession]);

  useEffect(() => {
    if (attendanceDraftKeyLoaded !== attendanceDraftKey) return;
    if (attendanceDrafts.length) localStorage.setItem(attendanceDraftKey, JSON.stringify(attendanceDrafts));
    else localStorage.removeItem(attendanceDraftKey);
  }, [attendanceDraftKey, attendanceDraftKeyLoaded, attendanceDrafts]);

  useEffect(() => {
    if (!attendanceDrafts.length || !attendanceDateStatus.isSchoolDay) return;
    const syncDrafts = async () => {
      if (!navigator.onLine) return;
      try {
        await syncAttendanceDrafts(attendanceDrafts);
        setAttendanceDrafts([]);
        toast.success("Offline attendance drafts synced.");
      } catch (error) {
        toast.error(`Attendance drafts could not sync: ${getErrorMessage(error)}`);
      }
    };
    window.addEventListener("online", syncDrafts);
    if (navigator.onLine) void syncDrafts();
    return () => window.removeEventListener("online", syncDrafts);
  }, [attendanceDateStatus.isSchoolDay, attendanceDrafts, syncAttendanceDrafts]);

  const saveAttendanceStatus = async (studentId: number, status: "present" | "absent" | "late") => {
    if (!attendanceDateStatus.isSchoolDay) return;
    const existing = attendanceByStudent.get(studentId);
    const cutoffHours = Number(attendanceSettings?.edit_cutoff_hours ?? 24);
    const isPastCutoff = existing && Date.now() - new Date(existing.marked_at).getTime() > cutoffHours * 60 * 60 * 1000;
    const reason = isPastCutoff ? window.prompt("This attendance entry is past the edit cutoff. Enter a reason for the correction:")?.trim() : undefined;
    if (isPastCutoff && !reason) return;
    const draft = { student: studentId, date: attendanceDate, session: attendanceSession, status, ...(reason ? { reason } : {}) };
    try {
      await updateAttendanceMutation.mutateAsync(draft);
      setAttendanceDrafts(current => current.filter(item => item.student !== studentId));
    } catch (error) {
      if (!navigator.onLine) {
        setAttendanceDrafts(current => [...current.filter(item => item.student !== studentId), draft]);
        toast.warning("No connection. Attendance saved as an offline draft.");
      } else {
        toast.error(getErrorMessage(error));
      }
    }
  };

  const markClassPresent = async () => {
    if (!attendanceDateStatus.isSchoolDay || classStudents.length === 0) return;
    const drafts = classStudents.map(student => ({
      student: student.id,
      date: attendanceDate,
      session: attendanceSession,
      status: "present" as const,
    }));
    const cutoffHours = Number(attendanceSettings?.edit_cutoff_hours ?? 24);
    const hasPastCutoffCorrection = classStudents.some(student => {
      const existing = attendanceByStudent.get(student.id);
      return existing && existing.status !== "present" &&
        Date.now() - new Date(existing.marked_at).getTime() > cutoffHours * 60 * 60 * 1000;
    });
    const reason = hasPastCutoffCorrection
      ? window.prompt("Some entries are past the edit cutoff. Enter a reason for marking this register:")?.trim()
      : undefined;
    if (hasPastCutoffCorrection && !reason) return;
    const updates = drafts.map(draft => ({ ...draft, ...(reason ? { reason } : {}) }));
    try {
      await bulkAttendanceMutation.mutateAsync(updates);
      setAttendanceDrafts([]);
      toast.success(`Marked ${classStudents.length} learners present.`);
    } catch (error) {
      if (!navigator.onLine) {
        setAttendanceDrafts(drafts);
        toast.warning("No connection. The class register is saved as an offline draft.");
      } else toast.error(getErrorMessage(error));
    }
  };
  const buildClassAttendancePdf = () => buildAttendancePdf({
    className: selectedClass?.name || "Class",
    date: attendanceDate,
    teacherName,
    rows: classAttendance.map(({ student, status }) => ({ name: student.name, status })),
  });

  const exportClassAttendance = () => {
    if (!attendanceDateStatus.isSchoolDay || !anyAttendanceMarked) {
      toast.error(attendanceDateStatus.reason || "Mark at least one learner before exporting attendance.");
      return;
    }
    const fileName = `${selectedClass?.name || "class"}-attendance-${attendanceDate}.pdf`.replace(/\s+/g, "_");
    buildClassAttendancePdf().save(fileName);
    toast.success("Attendance PDF downloaded.");
  };

  const shareAttendanceToParents = async () => {
    if (!isClassTeacherForSelectedClass) {
      toast.error("Only the class teacher can send attendance to the parents WhatsApp group.");
      return;
    }
    if (!attendanceDateStatus.isSchoolDay || !anyAttendanceMarked) {
      toast.error(attendanceDateStatus.reason || "Mark attendance for at least one learner first.");
      return;
    }
    const className = selectedClass?.name || "Class";
    const pdf = buildClassAttendancePdf();
    const result = await sharePdfToWhatsApp({
      pdf,
      fileName: `${className}-attendance-${attendanceDate}.pdf`.replace(/\s+/g, "_"),
      text: `${className} marked attendance for ${attendanceDate} from ${teacherName}.`,
      groupUrl: selectedClass?.parents_whatsapp_group,
    });
    if (result === "shared") {
      toast.success("Attendance PDF sent.");
      return;
    }
    toast.info(
      selectedClass?.parents_whatsapp_group
        ? "Attendance PDF downloaded. Attach it in the parents WhatsApp group that just opened."
        : "Attendance PDF downloaded. Ask admin to save this class parents WhatsApp group link, then attach the PDF in the group."
    );
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <DashboardExtras role="Teacher" actions={[{ label: "Message a class", onClick: () => setActiveNav("messages") }]} />
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
                  <h4 className="font-medium text-foreground">{getExamDisplayName(exam)}</h4>
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
            aria-label="Select report type before entering marks"
            value={selectedReportType}
            onChange={event => {
              setSelectedReportType(event.target.value as ExamReportType | "");
              setSelectedExamId(null);
              setReportCardRows([]);
            }}
            className="px-4 py-2 rounded-lg border border-border bg-background text-foreground"
          >
            <option value="">Select report type first</option>
            {EXAM_REPORT_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
          </select>
          <select
            value={selectedClassId || ""}
            onChange={(e) => { setSelectedClassId(Number(e.target.value)); setReportCardRows([]); }}
            disabled={!selectedReportType}
            className="px-4 py-2 rounded-lg border border-border bg-background text-foreground"
          >
            <option value="">Select Class</option>
            {uniqueClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={selectedSubjectId || ""} onChange={e => { setSelectedSubjectId(Number(e.target.value)); setReportCardRows([]); }} disabled={!selectedReportType || !selectedClassId} className="px-4 py-2 rounded-lg border border-border bg-background text-foreground">
            <option value="">Select Subject</option>
            {allocations.filter(allocation => allocation.school_class === selectedClassId).map(allocation => <option key={allocation.subject} value={allocation.subject}>{allocation.subject_name}</option>)}
          </select>
          <select value={selectedExamId || ""} onChange={e => { setSelectedExamId(Number(e.target.value)); setReportCardRows([]); }} disabled={!selectedReportType || !selectedClassId || !selectedSubjectId || matchingExams.length === 0} className="px-4 py-2 rounded-lg border border-border bg-background text-foreground">
            <option value="">{matchingExams.length ? "Select exam" : "No exam for this report"}</option>
            {matchingExams.map(e => <option key={e.id} value={e.id}>{getExamDisplayName(e)}</option>)}
          </select>
          <Button variant="outline" onClick={generateReportCardPreview} disabled={!selectedExamId}>Generate Report Card</Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Choose the prepared exam for your class, then enter your subject marks. Use the same exam across subjects so the learner&apos;s published report card can combine every teacher&apos;s marks.
      </p>

      {examsError ? <p role="alert" className="rounded-xl border border-destructive/30 p-5 text-destructive">Could not load exams: {getErrorMessage(examsError)}</p>
        : isLoadingExams ? <p className="rounded-xl border border-dashed p-6 text-center text-muted-foreground">Loading exams…</p>
        : !selectedReportType ? <p className="rounded-xl border border-dashed p-6 text-center text-muted-foreground">Choose a report type to begin mark entry.</p>
        : selectedClassId && selectedSubjectId && !selectedExamId ? <div role="status" className="rounded-xl border border-dashed p-6 text-center">
          {examsForSelectedPair.length === 0 ? <>
            <p className="font-medium text-foreground">No exam is set up for this class and subject.</p>
            <p className="mt-2 text-sm text-muted-foreground">Ask an administrator to create an exam and include {uniqueClasses.find(item => item.id === selectedClassId)?.name} and {uniqueSubjects.find(item => item.id === selectedSubjectId)?.name}.</p>
          </> : writableExamsForSelectedPair.length === 0 ? <>
            <p className="font-medium text-foreground">The exams for this class and subject are already published.</p>
            <p className="mt-2 text-sm text-muted-foreground">Ask an administrator to unpublish the results or create a new exam before entering marks.</p>
          </> : <>
            <p className="font-medium text-foreground">No {EXAM_REPORT_TYPES.find(type => type.value === selectedReportType)?.label} exam is set up for this class and subject.</p>
            {otherAvailableReportTypes.length > 0 ? <>
              <p className="mt-2 text-sm text-muted-foreground">There are writable exams for this class and subject under another report type. Choose one to enter marks in that report.</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {otherAvailableReportTypes.map(type => <Button key={type.value} variant="outline" onClick={() => { setSelectedReportType(type.value); setSelectedExamId(null); }}>
                  Use {type.label} ({writableExamsForSelectedPair.filter(exam => exam.report_type === type.value).length} exams)
                </Button>)}
              </div>
            </> : <p className="mt-2 text-sm text-muted-foreground">Ask an administrator to create an exam with this report type and include this class and subject.</p>}
          </>}
        </div>
        : selectedClassId && selectedSubjectId && selectedExamId && (
        <div className="space-y-4">
          <MarkSheetSection
            students={classStudents}
            marks={examMarks}
            examId={selectedExamId}
            examName={exams.find(e => e.id === selectedExamId)?.name || ""}
            reportType={selectedReportType}
            subjectId={selectedSubjectId}
            subjectName={uniqueSubjects.find(subject => subject.id === selectedSubjectId)?.name || "Subject"}
            classId={selectedClassId}
            className={uniqueClasses.find(c => c.id === selectedClassId)?.name || "Class"}
            teacherName={teacher?.name || "Teacher"}
            onGradeChange={(studentId, score) => setGradeInputs(current => ({ ...current, [studentId]: score }))}
          />

          {isClassTeacherForSelectedClass && classStudents.length > 0 && (
            <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/30 p-4 space-y-4">
              {reportCardReviewsError && (
                <p role="alert" className="text-sm text-destructive">
                  Could not load saved report comments: {getErrorMessage(reportCardReviewsError)}
                </p>
              )}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">Class Teacher Comments</p>
                  <p className="text-xs text-muted-foreground">
                    Required for every learner in {selectedClass?.name ?? "this class"}.
                    {classTeacherSubmission ? " Submitted to the principal for review." : " Save comments, then submit completed reports to the principal."}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={Boolean(classTeacherSubmission) || loadingReportCardReviews}
                    onClick={() => classStudents.forEach((student) => applyClassCommentTemplate(student.id, getStudentExamAverage(student.id)))}
                  >
                    Apply Built-in Comments
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={Boolean(classTeacherSubmission) || loadingReportCardReviews || saveClassReportComments.isPending}
                    onClick={() => void saveClassTeacherComments()}
                  >
                    {saveClassReportComments.isPending ? "Saving…" : "Save comments"}
                  </Button>
                  <Button
                    size="sm"
                    disabled={Boolean(classTeacherSubmission) || loadingReportCardReviews || saveClassReportComments.isPending || submitClassReports.isPending}
                    onClick={() => void submitCompletedClassReports()}
                  >
                    {submitClassReports.isPending ? "Submitting…" : "Send completed reports to admin"}
                  </Button>
                </div>
              </div>

              <div className="grid gap-3">
                {classStudents.map((student) => {
                  return (
                    <div key={student.id} className="grid md:grid-cols-[1fr_2fr] gap-3 items-start rounded-lg border border-border bg-background/80 p-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{student.name}</p>
                        <select
                          className="mt-2 w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                          value={TEACHER_COMMENT_LIBRARY.find(template => template.text === classTeacherComments[student.id])?.label ?? ""}
                          disabled={Boolean(classTeacherSubmission) || loadingReportCardReviews}
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
                          {Array.from(new Set(TEACHER_COMMENT_LIBRARY.map((template) => template.category ?? "General"))).map((category) => (
                            <optgroup key={category} label={category}>
                              {TEACHER_COMMENT_LIBRARY
                                .filter((template) => (template.category ?? "General") === category)
                                .map((template) => (
                                  <option key={template.label} value={template.label}>{template.label}</option>
                                ))}
                            </optgroup>
                          ))}
                        </select>
                      </div>

                      <textarea
                        value={classTeacherComments[student.id] ?? ""}
                        disabled={Boolean(classTeacherSubmission) || loadingReportCardReviews}
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
        <div className="report-card bg-card rounded-lg border border-border overflow-hidden shadow-elegant print:border-none print:shadow-none">
          <div className="relative bg-primary text-primary-foreground px-6 py-8 border-b-4 border-accent">
            <div className="relative flex flex-col md:flex-row items-center gap-6">
              <img src={logo} alt="School Logo" className="h-20 w-20 rounded-md object-contain bg-card p-2 ring-1 ring-primary-foreground/20" />
              <div className="flex-1 text-center md:text-left">
                <p className="text-base text-primary-foreground font-semibold">Able God College</p>
                <h1 className="mt-1 font-heading text-2xl md:text-3xl font-bold tracking-wide">{reportCardHeading}</h1>
                <p className="mt-1 text-sm text-primary-foreground/80">{schoolContact.address} · {teacher?.phone || schoolContact.phones.map((phone) => phone.label).join(" / ")}</p>
              </div>
              <div className="text-center rounded-md bg-primary-foreground/10 border border-primary-foreground/20 px-5 py-4">
                <p className="text-xs uppercase tracking-widest text-primary-foreground/70">Class average</p>
                <p className="text-3xl font-bold text-primary-foreground">{calculateGrade(classReportAverage).grade}</p>
                <p className="text-sm text-primary-foreground/80">{classReportAverage.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-px bg-accent/30 sm:grid-cols-3 xl:grid-cols-7">
            {[
              ["Learners", `${reportCardRows.length} in class`],
              ["Class", uniqueClasses.find(c => c.id === selectedClassId)?.name || "Class"],
              ["Exam", reportPreviewExam ? getExamDisplayName(reportPreviewExam) : "Selected exam"],
              ["Subject", uniqueSubjects.find(subject => subject.id === selectedSubjectId)?.name || "Subject"],
              ["Report type", EXAM_REPORT_TYPES.find(type => type.value === reportPreviewType)?.label || "Report card"],
              ["Passed", `${classReportScoredRows.filter(row => (row.percentage ?? 0) >= 40).length} of ${classReportScoredRows.length}`],
              ["Issued", `${reportPreviewType === "monthly_report_card" ? `${reportIssueMonthYear} · ` : ""}${reportIssuedDate}`],
            ].map(([k, v]) => (
              <div key={k} className="bg-card px-4 py-3">
                <p className="text-[11px] uppercase tracking-widest text-primary font-semibold">{k}</p>
                <p className="mt-0.5 text-sm font-semibold text-foreground break-words">{v}</p>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-primary text-primary-foreground border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">LEARNER</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">SCORED</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">OUT OF</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">PERC(%)</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">GRADE</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">COMMENT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reportCardRows.map((row) => {
                  const percentage = row.percentage ?? 0;
                  const gradeInfo = calculateGrade(percentage);
                  return (
                    <tr key={row.studentId} className="odd:bg-card even:bg-primary/5 hover:bg-accent/10 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{row.studentName}</td>
                      <td className="px-4 py-3 text-sm text-center font-medium text-foreground">{row.score === null ? "—" : row.score.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-center text-muted-foreground">{row.score === null ? "—" : row.totalMarks}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {row.percentage !== null && <div className="flex items-center gap-2 justify-center">
                          <div className="h-2 w-20 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(percentage, 100)}%` }} /></div>
                          <span>{percentage.toFixed(1)}%</span>
                        </div>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {row.percentage === null ? "—" : <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold bg-secondary text-secondary-foreground`}>
                          {gradeInfo.grade}
                        </span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{row.comment || (row.percentage === null ? "—" : gradeInfo.meaning)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-6 border-t border-border bg-primary/5 space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="border-l-2 border-accent pl-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Teacher comments</p>
                <p className="mt-1 text-sm text-foreground">Each learner&apos;s comment is shown beside their mark above.</p>
              </div>
              <div className="border-l-2 border-accent pl-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Principal comment</p>
                <p className="mt-1 text-sm text-foreground">Awaiting principal review after the class teacher submits completed reports.</p>
              </div>
              <div className="border-l-2 border-accent pl-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Attendance</p>
                <p className="mt-1 text-sm text-foreground">{classStudents.filter(student => attendanceRecords.some(record => record.student === student.id && record.status === "present")).length} / {classStudents.length} present on {attendanceDate}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">This report is electronically generated, follow the link to verify the report.</p>
              <div className="text-center">
                <div className="h-px w-40 bg-foreground/40 mb-1" />
                <p className="text-xs text-muted-foreground">Head's signature</p>
              </div>
            </div>
          </div>
        </div>
      )}

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
            aria-label="Attendance date"
            className="px-4 py-2 rounded-lg border border-border bg-background text-foreground"
          />
          <select
            value={attendanceSession}
            onChange={(event) => setAttendanceSession(event.target.value as typeof attendanceSession)}
            aria-label="Attendance session"
            className="px-4 py-2 rounded-lg border border-border bg-background text-foreground"
          >
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
            <option value="evening">Evening</option>
          </select>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-secondary/30 flex items-center justify-between">
          <div>
            <h3 className="font-medium text-foreground">{uniqueClasses.find(c => c.id === selectedClassId)?.name || "Select Class"} - Attendance</h3>
            <p className="text-sm text-muted-foreground">{new Date(`${attendanceDate}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">
              {attendanceDrafts.length ? `${attendanceDrafts.length} offline draft${attendanceDrafts.length === 1 ? "" : "s"} saved on this device.` : "Register changes save immediately."}
            </p>
            <Button size="sm" onClick={() => void markClassPresent()} disabled={!attendanceDateStatus.isSchoolDay || !classStudents.length || bulkAttendanceMutation.isPending}>
              {bulkAttendanceMutation.isPending ? "Saving…" : "Mark all present"}
            </Button>
          </div>
          <div className="flex gap-4 text-sm">
            <span className="text-green-600">Present: {classAttendance.filter(item => item.status === "present").length}</span>
            <span className="text-red-500">Absent: {classAttendance.filter(item => item.status === "absent").length}</span>
            <span className="text-amber-600">Late: {classAttendance.filter(item => item.status === "late").length}</span>
            <span className="text-muted-foreground">Unmarked: {classAttendance.filter(item => item.status === "unmarked").length}</span>
          </div>
        </div>
        {!attendanceDateStatus.isSchoolDay && (
          <p role="status" className="border-b border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            {attendanceDateStatus.reason} Attendance controls are disabled for this date.
          </p>
        )}
        {attendanceDateStatus.isSchoolDay && attendanceDateStatus.sessionLabel && (
          <p className="border-b border-border px-4 py-2 text-xs text-muted-foreground">{attendanceDateStatus.sessionLabel}</p>
        )}
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
              const status = attendanceDraftByStudent.get(student.id)?.status || attendanceByStudent.get(student.id)?.status || "unmarked";

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
                      <span className="min-w-20 self-center text-center text-xs text-muted-foreground">
                        {status === "unmarked" ? "Not marked" : status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                      <button
                        onClick={() => void saveAttendanceStatus(student.id, "present")}
                        disabled={!attendanceDateStatus.isSchoolDay || updateAttendanceMutation.isPending}
                        aria-label={`Mark ${student.name} present`}
                        className={`p-1.5 rounded-lg transition-colors ${status === "present" ? "bg-green-500 text-white" : "bg-secondary text-muted-foreground hover:bg-green-100"}`}
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => void saveAttendanceStatus(student.id, "absent")}
                        disabled={!attendanceDateStatus.isSchoolDay || updateAttendanceMutation.isPending}
                        aria-label={`Mark ${student.name} absent`}
                        className={`p-1.5 rounded-lg transition-colors ${status === "absent" ? "bg-destructive text-white" : "bg-secondary text-muted-foreground hover:bg-red-100"}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => void saveAttendanceStatus(student.id, "late")}
                        disabled={!attendanceDateStatus.isSchoolDay || updateAttendanceMutation.isPending}
                        aria-label={`Mark ${student.name} late`}
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
        <div className="p-4 border-t border-border flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={() => void shareAttendanceToParents()} disabled={!attendanceDateStatus.isSchoolDay || !anyAttendanceMarked}>Share PDF to WhatsApp</Button>
          <Button variant="gold" onClick={exportClassAttendance} disabled={!attendanceDateStatus.isSchoolDay || !anyAttendanceMarked}>Download Attendance PDF</Button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => (
    <div className="space-y-6">
      <LearningMaterialsSection
        classes={uniqueClasses}
        subjects={contentSubjects.length > 0 ? contentSubjects : [{ id: 0, name: "General" }]}
        allowedPairs={contentPairs}
        uploadedBy={teacher ? `Teacher ${teacher.name}` : "Teacher"}
        emptyHint="No notes or materials have been uploaded yet. Choose a file from this computer to share with the class."
      />
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-heading text-lg font-bold text-foreground">School library books</h2>
        <p className="mt-1 text-sm text-muted-foreground">Browse the digital books shared by the school administrator.</p>
        {isLoadingLibraryBooks ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading books…</p>
        ) : libraryBooksError ? (
          <p role="alert" className="mt-4 text-sm text-destructive">Could not load library books: {getErrorMessage(libraryBooksError)}</p>
        ) : libraryBooks.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No books have been added to the library yet.</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {libraryBooks.map((book) => (
              <article key={book.id} className="rounded-lg border border-border p-3">
                <p className="font-medium text-foreground">{book.title}</p>
                <p className="text-sm text-muted-foreground">{book.author}{book.category ? ` · ${book.category}` : ""}</p>
                {book.digital_file_url && (
                  <a className="mt-2 inline-block text-sm text-primary underline underline-offset-2" href={book.digital_file_url} target="_blank" rel="noreferrer">
                    Open or download digital book
                  </a>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );

  const renderAssignments = () => <LearningAssignmentsSection allocations={allocations} />;

  const renderMessages = () => (
    <CommunicationSection
      role="teacher"
      classes={uniqueClasses}
      students={students.filter((student) => uniqueClasses.some((schoolClass) => schoolClass.id === student.school_class))}
    />
  );

  const renderTimetable = () => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const lessonSlots = [
      ["07:40", "08:40"], ["08:40", "09:40"], ["09:40", "10:40"],
      ["11:10", "12:10"], ["12:10", "13:10"], ["14:00", "15:00"], ["15:00", "16:00"],
    ];

    return (
      <div className="space-y-6">
        <h2 className="font-heading text-xl font-bold text-foreground">My Timetable</h2>
        <p className="text-sm text-muted-foreground">Lessons: 07:40–10:40, 11:10–13:10, and 14:00–16:00 · Break: 10:40–11:10 · Lunch: 13:10–14:00</p>

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
              {lessonSlots.map(([start, end], idx) => <Fragment key={`${start}-${end}`}>
                {idx === 3 && <tr key="morning-break" className="border-t border-border bg-secondary/30"><td className="px-4 py-2 text-sm font-medium border-r border-border">10:40–11:10</td><td colSpan={5} className="px-2 py-2 text-center text-xs text-muted-foreground">Morning break</td></tr>}
                {idx === 5 && <tr key="lunch" className="border-t border-border bg-secondary/30"><td className="px-4 py-2 text-sm font-medium border-r border-border">13:10–14:00</td><td colSpan={5} className="px-2 py-2 text-center text-xs text-muted-foreground">Lunch</td></tr>}
                <tr key={`${start}-${end}`} className="border-t border-border">
                  <td className="px-4 py-3 text-sm font-medium text-foreground border-r border-border bg-secondary/30">{start}–{end}</td>
                  {days.map(day => {
                    const entry = teacherTimetable.find(period => period.day_of_week === day && period.period_start.slice(0, 5) === start && period.period_end.slice(0, 5) === end);
                    return <td key={day} className="px-2 py-2 text-center">{entry ? <div className="rounded border border-primary/20 bg-primary/10 p-2"><p className="text-xs font-semibold text-primary">{entry.class_name}</p><p className="text-xs text-foreground">{entry.subject_name}</p><p className="text-xs text-muted-foreground">{entry.room || "Room not assigned"}</p></div> : <span className="text-xs text-muted-foreground">—</span>}</td>;
                  })}
                </tr>
              </Fragment>)}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderContentSection = () => {
    switch (activeNav) {
      case "dashboard": return renderDashboard();
      case "classes": return renderClasses();
      case "class-register": return <ClassRegisterSection classes={managedClasses} students={students} />;
      case "subjects": return renderSubjects();
      case "grading": return renderGrading();
      case "ai-coach": return <AIFeedbackSection students={students} />;
      case "attendance": return renderAttendance();
      case "content": return renderContent();
      case "assignments": return renderAssignments();
      case "messages": return renderMessages();
      case "timetable": return renderTimetable();
      case "settings": return <StudentSettingsSection studentContext={false} />;
      case "profile": return <ProfileSection />;
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
          {navigation.filter(item => item.id !== "class-register" || managedClasses.length > 0).map((item) => (
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
              <div className="flex items-center gap-2">
                <p className="text-[10px] text-accent font-bold uppercase tracking-tight">{department}</p>
                {teacher?.employee_id && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-white/10 text-white/90 border border-white/20">
                    {teacher.employee_id}
                  </span>
                )}
              </div>
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
          <div className="flex items-center gap-2">
            <button aria-label="Open messages" onClick={() => setActiveNav("messages")} className="relative p-2 rounded-xl hover:bg-white/10 transition-colors">
              <Bell className="h-6 w-6 text-white/60" />
            </button>
            <Link to="/portal" onClick={clearAuth} className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/20">
              <LogOut className="h-4 w-4" />Sign Out
            </Link>
          </div>
        </header>

        <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
          {renderContentSection()}
        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard;
