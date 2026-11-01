import { useEffect, useState } from "react";
import {
  useStudents, useClasses, useAttendanceRecords, useUpdateAttendance,
  useAttendanceExcuses, useAttendanceSettings, useAttendanceTermSummaries,
  useReviewAttendanceExcuse, useSaveAttendanceSettings, useSaveSchoolCalendarDay,
  useSchoolCalendarDays, useAttendanceAuditLog, type AttendanceExcuse,
  useAcademicYears, useSchoolTerms, useSaveAcademicYear, useSaveSchoolTerm,
} from "@/lib/hooks";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Clock, Calendar, Search, Users, TrendingUp, AlertCircle, Share2, Download } from "lucide-react";
import { buildAttendancePdf, sharePdfToWhatsApp } from "@/lib/pdfExport";
import { formatLocalDateKey, getSchoolDateStatus, ZIMBABWE_2026_PUBLIC_HOLIDAYS, ZIMBABWE_2026_TERMS } from "@/lib/zimbabweSchoolCalendar";
import { getErrorMessage } from "@/lib/api";

const formatCalendarDate = (dateKey: string) => new Date(`${dateKey}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

const AttendanceSection = () => {
  const { data: students = [] } = useStudents();
  const { data: classes = [] } = useClasses();
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(formatLocalDateKey(new Date()));
  const [selectedSession, setSelectedSession] = useState<"morning" | "afternoon" | "evening">("morning");
  const [searchQuery, setSearchQuery] = useState("");
  const [calendarDate, setCalendarDate] = useState("");
  const [calendarType, setCalendarType] = useState<"school_day" | "holiday" | "closed">("holiday");
  const [calendarNote, setCalendarNote] = useState("");
  const [riskThreshold, setRiskThreshold] = useState("");
  const [absenceThreshold, setAbsenceThreshold] = useState("");
  const [editCutoff, setEditCutoff] = useState("");
  const [auditStudentFilter, setAuditStudentFilter] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [selectedTermId, setSelectedTermId] = useState("");
  const [isCreatingTerm, setIsCreatingTerm] = useState(false);
  const [termName, setTermName] = useState("");
  const [termStartDate, setTermStartDate] = useState("");
  const [termEndDate, setTermEndDate] = useState("");
  const [termIsActive, setTermIsActive] = useState(false);
  const [newAcademicYearName, setNewAcademicYearName] = useState("");
  const [newAcademicYearStart, setNewAcademicYearStart] = useState("");
  const [newAcademicYearEnd, setNewAcademicYearEnd] = useState("");
  const [newAcademicYearCurrent, setNewAcademicYearCurrent] = useState(false);

  // Set initial class when data loads
  if (classes.length > 0 && !selectedClassId) {
    setSelectedClassId(classes[0].id);
  }

  const { data: attendanceRecords = [], isLoading: isLoadingAttendance } = useAttendanceRecords({
    date: selectedDate,
    session: selectedSession,
  });
  const { data: absenceHistory = [] } = useAttendanceRecords({ status: "absent" });
  const { data: summaries = [] } = useAttendanceTermSummaries();
  const { data: academicYears = [] } = useAcademicYears();
  const { data: academicTerms = [] } = useSchoolTerms(academicYearId ? { academic_year: Number(academicYearId) } : undefined);
  const { data: settings } = useAttendanceSettings();
  const { data: calendarDays = [] } = useSchoolCalendarDays();
  const { data: pendingExcuses = [] } = useAttendanceExcuses({ status: "pending" });
  const { data: auditEntries = [], isLoading: auditLoading } = useAttendanceAuditLog({
    student: auditStudentFilter ? Number(auditStudentFilter) : undefined,
  });
  const reviewExcuse = useReviewAttendanceExcuse();
  const saveSettings = useSaveAttendanceSettings();
  const saveCalendarDay = useSaveSchoolCalendarDay();
  const saveAcademicYear = useSaveAcademicYear();
  const saveSchoolTerm = useSaveSchoolTerm();
  const updateAttendanceMutation = useUpdateAttendance();
  const schoolYears = Array.from(new Set(summaries.map(summary => summary.academic_year))).sort((a, b) => b.localeCompare(a));
  const selectedYearValue = selectedYear || schoolYears[0] || "";
  const selectedYearSummaries = summaries.filter(summary => !selectedYearValue || summary.academic_year === selectedYearValue);
  const availableTerms = Array.from(new Set(selectedYearSummaries.map(summary => summary.term_name)));
  const selectedTermValue = selectedTerm || availableTerms[0] || "";
  const activeTermId = selectedYearSummaries.find(summary => summary.term_name === selectedTermValue)?.term;
  const historyRecords = useAttendanceRecords({
    school_class: selectedClassId ?? undefined,
    term: activeTermId,
  });
  const attendanceTermRecords = useAttendanceRecords({ school_class: selectedClassId ?? undefined, term: activeTermId });

  const selectedClass = classes.find(c => c.id === selectedClassId) || classes[0];
  useEffect(() => {
    if (!academicYearId && academicYears.length) setAcademicYearId(String(academicYears[0].id));
  }, [academicYearId, academicYears]);
  useEffect(() => {
    if (!selectedTermId && academicTerms.length && !isCreatingTerm) {
      const firstTerm = academicTerms[0];
      setSelectedTermId(String(firstTerm.id));
      setTermName(firstTerm.name);
      setTermStartDate(firstTerm.start_date);
      setTermEndDate(firstTerm.end_date);
      setTermIsActive(firstTerm.is_active);
    }
  }, [academicTerms, isCreatingTerm, selectedTermId]);
  const attendanceByStudent = new Map(attendanceRecords.map((record) => [record.student, record]));
  const dailyClassRegister = classes.map(schoolClass => {
    const records = attendanceRecords.filter(record => record.school_class === schoolClass.id);
    const classStudents = students.filter(student => student.school_class === schoolClass.id);
    return {
      id: schoolClass.id,
      name: schoolClass.name,
      learners: classStudents.length,
      marked: new Set(records.map(record => record.student)).size,
      present: records.filter(record => record.status === "present").length,
      absent: records.filter(record => record.status === "absent").length,
      late: records.filter(record => record.status === "late").length,
    };
  });
  const activeTermSummaries = selectedYearSummaries.filter(summary => !selectedTermValue || summary.term_name === selectedTermValue);
  const attendanceTrend = Array.from(selectedYearSummaries.reduce((trend, summary) => {
    const item = trend.get(summary.term_name) ?? { total: 0, count: 0 };
    item.total += Number(summary.attendance_percentage);
    item.count += 1;
    trend.set(summary.term_name, item);
    return trend;
  }, new Map<string, { total: number; count: number }>()).entries())
    .map(([term, value]) => ({ term, average: value.count ? value.total / value.count : 0 }))
    .sort((a, b) => a.term.localeCompare(b.term, undefined, { numeric: true }));
  const markedDates = Array.from(new Set((attendanceTermRecords.data ?? []).map(record => record.date))).sort((a, b) => b.localeCompare(a));
  const consecutiveAbsenceCounts = new Map<number, number>();
  const statusesByStudentAndDate = new Map<number, Map<string, string[]>>();
  (attendanceTermRecords.data ?? []).forEach(record => {
    let statusesByDate = statusesByStudentAndDate.get(record.student);
    if (!statusesByDate) {
      statusesByDate = new Map();
      statusesByStudentAndDate.set(record.student, statusesByDate);
    }
    const statuses = statusesByDate.get(record.date) ?? [];
    statuses.push(record.status);
    statusesByDate.set(record.date, statuses);
  });
  const thresholdDays = Number(settings?.consecutive_absence_threshold ?? absenceThreshold ?? 3);
  if (markedDates.length) {
    for (const student of students.filter(item => item.school_class === selectedClassId)) {
      let consecutive = 0;
      const statusesByDate = statusesByStudentAndDate.get(student.id);
      for (const markedDate of markedDates) {
        const statuses = statusesByDate?.get(markedDate) ?? [];
        if (statuses.length && statuses.every(status => status === "absent")) consecutive += 1;
        else break;
      }
      if (consecutive >= thresholdDays) consecutiveAbsenceCounts.set(student.id, consecutive);
    }
  }
  const atRiskSummaries = activeTermSummaries
    .filter(summary => Number(summary.attendance_percentage) < Number(settings?.at_risk_percentage ?? 85) || consecutiveAbsenceCounts.has(summary.student))
    .sort((a, b) => Number(a.attendance_percentage) - Number(b.attendance_percentage));

  const attendanceData = students
    .filter(s => s.school_class === selectedClassId)
    .map(student => {
      const record = attendanceByStudent.get(student.id);
      return {
        ...student,
        status: record?.status || "unmarked"
      };
    });

  const defaultDateStatus = getSchoolDateStatus(selectedDate);
  const selectedDateOverride = calendarDays.find(day => day.date === selectedDate);
  const attendanceDateStatus = selectedDateOverride
    ? {
      isSchoolDay: selectedDateOverride.day_type === "school_day" && selectedDate <= formatLocalDateKey(new Date()),
      reason: selectedDateOverride.day_type === "school_day" ? undefined : selectedDateOverride.note || `This date is marked as ${selectedDateOverride.day_type.replace("_", " ")}.`,
    }
    : defaultDateStatus;

  const filteredStudents = attendanceData.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpdateAttendance = async (studentId: number, status: "present" | "absent" | "late" | "excused" | "sick_bay" | "suspended") => {
    if (!attendanceDateStatus.isSchoolDay) {
      toast.error(attendanceDateStatus.reason || "Attendance cannot be recorded on this date.");
      return;
    }
    try {
      const existing = attendanceByStudent.get(studentId);
      if (existing?.status === status) return;
      const reason = existing ? window.prompt("Enter the reason for correcting this attendance record:")?.trim() : "";
      if (existing && !reason) return;
      await updateAttendanceMutation.mutateAsync({
        student: studentId,
        date: selectedDate,
        session: selectedSession,
        status,
        ...(status === "excused" ? { excuse_reason: "other" } : {}),
        ...(reason ? { reason } : {}),
      });
      toast.success("Attendance updated");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const exportHistoryCsv = () => {
    const records = historyRecords.data ?? [];
    if (!records.length) {
      toast.error("There are no attendance records for this class and term.");
      return;
    }
    const rows = [
      ["Student", "Class at marking", "Date", "Session", "Status", "Late minutes", "Excuse reason"],
      ...records.map(record => [
        record.student_name, record.class_name, record.date, record.session, record.status,
        String(record.late_minutes), record.excuse_reason,
      ]),
    ];
    const csv = rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `attendance-${selectedClass?.name ?? "class"}-${selectedYearValue || "all-years"}-${selectedTermValue || "all-terms"}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const saveCalendarOverride = async () => {
    if (!calendarDate) {
      toast.error("Choose a calendar date.");
      return;
    }
    try {
      const existing = calendarDays.find(day => day.date === calendarDate);
      await saveCalendarDay.mutateAsync({
        ...(existing ? { id: existing.id } : {}),
        date: calendarDate,
        day_type: calendarType,
        note: calendarNote.trim(),
        term: existing?.term ?? null,
      });
      setCalendarNote("");
      toast.success("School calendar updated.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleReviewExcuse = async (excuse: AttendanceExcuse, status: "approved" | "rejected") => {
    try {
      await reviewExcuse.mutateAsync({ id: excuse.id, status });
      toast.success(`Absence excuse ${status}.`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const saveAttendancePolicy = async () => {
    try {
      await saveSettings.mutateAsync({
        at_risk_percentage: Number(riskThreshold || settings?.at_risk_percentage || 85),
        consecutive_absence_threshold: Number(absenceThreshold || settings?.consecutive_absence_threshold || 3),
        edit_cutoff_hours: Number(editCutoff || settings?.edit_cutoff_hours || 24),
      });
      toast.success("Attendance risk thresholds saved.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const updateAttendanceSetting = async (data: { sessions_enabled?: boolean; lesson_attendance_enabled?: boolean }) => {
    try {
      await saveSettings.mutateAsync(data);
      toast.success("Attendance setting updated.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const saveAcademicYearDates = async () => {
    if (!newAcademicYearName.trim() || !newAcademicYearStart || !newAcademicYearEnd || newAcademicYearEnd < newAcademicYearStart) {
      toast.error("Enter a valid academic year name, opening date, and closing date.");
      return;
    }
    try {
      if (newAcademicYearCurrent) {
        await Promise.all(academicYears.filter(year => year.is_current).map(year =>
          saveAcademicYear.mutateAsync({ ...year, is_current: false }),
        ));
      }
      const year = await saveAcademicYear.mutateAsync({
        name: newAcademicYearName.trim(),
        start_date: newAcademicYearStart,
        end_date: newAcademicYearEnd,
        is_current: newAcademicYearCurrent,
      });
      setAcademicYearId(String(year.id));
      setSelectedTermId("");
      setIsCreatingTerm(true);
      setNewAcademicYearName("");
      setNewAcademicYearStart("");
      setNewAcademicYearEnd("");
      toast.success("Academic year dates saved.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const saveTermDates = async () => {
    if (!academicYearId || !termName.trim() || !termStartDate || !termEndDate || termEndDate < termStartDate) {
      toast.error("Choose an academic year and enter valid term dates.");
      return;
    }
    try {
      if (termIsActive) {
        await Promise.all(academicTerms
          .filter(term => term.is_active && term.id !== Number(selectedTermId))
          .map(term => saveSchoolTerm.mutateAsync({ ...term, is_active: false })));
      }
      const term = await saveSchoolTerm.mutateAsync({
        ...(selectedTermId ? { id: Number(selectedTermId) } : {}),
        name: termName.trim(),
        academic_year: Number(academicYearId),
        start_date: termStartDate,
        end_date: termEndDate,
        is_active: termIsActive,
      });
      setSelectedTermId(String(term.id));
      setIsCreatingTerm(false);
      toast.success("Term dates saved.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const presentCount = attendanceData.filter(s => s.status === "present").length;
  const absentCount = attendanceData.filter(s => s.status === "absent").length;
  const lateCount = attendanceData.filter(s => s.status === "late").length;
  const markedCount = attendanceData.filter(s => s.status !== "unmarked").length;
  const unmarkedCount = Math.max(0, attendanceData.length - markedCount);
  const anyAttendanceMarked = markedCount > 0;
  const avgAttendance = markedCount > 0 ? (((presentCount + lateCount) / markedCount) * 100).toFixed(0) : "0";

  const attendancePdf = () => buildAttendancePdf({
    className: selectedClass?.name || "Class",
    date: selectedDate,
    teacherName: selectedClass?.class_teacher_name || "School Administration",
    rows: attendanceData.map(record => ({ name: record.name, status: record.status })),
  });

  const exportAttendance = () => {
    if (!attendanceDateStatus.isSchoolDay || !anyAttendanceMarked) {
      toast.error(attendanceDateStatus.reason || "Mark at least one learner before exporting attendance.");
      return;
    }
    attendancePdf().save(`${selectedClass?.name || "class"}-attendance-${selectedDate}.pdf`.replace(/\s+/g, "_"));
    toast.success("Attendance PDF downloaded");
  };

  const shareAttendance = async () => {
    if (!selectedClass || !attendanceDateStatus.isSchoolDay || !anyAttendanceMarked) {
      toast.error(attendanceDateStatus.reason || "Select a class and mark at least one learner first.");
      return;
    }
    try {
      const result = await sharePdfToWhatsApp({
        pdf: attendancePdf(),
        fileName: `${selectedClass.name}-attendance-${selectedDate}.pdf`.replace(/\s+/g, "_"),
        text: `${selectedClass.name} attendance for ${selectedDate}.`,
        groupUrl: selectedClass.parents_whatsapp_group,
      });
      toast.success(result === "shared" ? "Attendance PDF shared." : "Attendance PDF downloaded. Attach it in WhatsApp.");
    } catch (error) {
      toast.error("Could not share the attendance PDF.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">Attendance Management</h2>
          <p className="text-sm text-muted-foreground">Track and manage student attendance</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="gold" onClick={exportAttendance} disabled={isLoadingAttendance || !attendanceDateStatus.isSchoolDay || !anyAttendanceMarked}>
            <Calendar className="h-4 w-4 mr-2" />Download PDF
          </Button>
          <Button variant="outline" onClick={() => void shareAttendance()} disabled={isLoadingAttendance || !attendanceDateStatus.isSchoolDay || !anyAttendanceMarked}>
            <Share2 className="mr-2 h-4 w-4" />Share PDF to WhatsApp
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Check className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{presentCount}</p>
                <p className="text-xs text-muted-foreground">Present on selected date</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <X className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{absentCount}</p>
                <p className="text-xs text-muted-foreground">Absent on selected date</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{lateCount}</p>
                <p className="text-xs text-muted-foreground">Late on selected date</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{avgAttendance}%</p>
                <p className="text-xs text-muted-foreground">Rate of marked learners</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="mark" className="w-full">
        <TabsList>
          <TabsTrigger value="mark">Mark Attendance</TabsTrigger>
          <TabsTrigger value="history">Absence History</TabsTrigger>
          <TabsTrigger value="calendar">2026 School Sessions</TabsTrigger>
          <TabsTrigger value="overview">Term & At-risk</TabsTrigger>
          <TabsTrigger value="excuses">Parent Excuses ({pendingExcuses.length})</TabsTrigger>
          <TabsTrigger value="audit">Audit log</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="flex flex-wrap items-end gap-3">
                <label className="grid gap-1 text-sm">
                  Academic year
                  <select value={selectedYearValue} onChange={event => { setSelectedYear(event.target.value); setSelectedTerm(""); }} className="rounded-lg border border-border bg-background px-3 py-2">
                    {schoolYears.map(year => <option key={year} value={year}>{year}</option>)}
                  </select>
                </label>
                <label className="grid gap-1 text-sm">
                  Term
                  <select value={selectedTermValue} onChange={event => setSelectedTerm(event.target.value)} className="rounded-lg border border-border bg-background px-3 py-2">
                    {availableTerms.map(term => <option key={term} value={term}>{term}</option>)}
                  </select>
                </label>
                <Button variant="outline" onClick={exportHistoryCsv} disabled={historyRecords.isLoading}>
                  <Download className="mr-2 h-4 w-4" /> Export selected class/term CSV
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {activeTermSummaries.slice(0, 3).map(summary => (
                  <article key={summary.id} className="rounded-xl border border-border bg-secondary/20 p-3">
                    <div className="flex justify-between gap-2 text-sm"><strong>{summary.term_name}</strong><span>{Number(summary.attendance_percentage).toFixed(1)}%</span></div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Number(summary.attendance_percentage))}%` }} />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{summary.days_present} present · {summary.days_absent} absent · {summary.days_late} late of {summary.total_school_days} scheduled days</p>
                  </article>
                ))}
                {activeTermSummaries.length === 0 && <p className="text-sm text-muted-foreground">Term summaries will appear once attendance is recorded.</p>}
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold">Attendance trend · average learner rate by term</h3>
                <div className="flex min-h-36 items-end gap-3 rounded-lg border border-border bg-background p-3" role="img" aria-label="Average attendance percentage by term">
                  {attendanceTrend.map(item => (
                    <div key={item.term} className="flex h-32 min-w-12 flex-1 flex-col items-center justify-end gap-1">
                      <span className="text-[10px]">{item.average.toFixed(0)}%</span>
                      <div className="w-full max-w-16 rounded-t bg-primary" style={{ height: `${Math.min(100, Math.max(item.average, 2))}%` }} />
                      <span className="text-[10px] text-muted-foreground">{item.term}</span>
                    </div>
                  ))}
                  {attendanceTrend.length === 0 && <p className="self-center text-sm text-muted-foreground">No term trend data yet.</p>}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
                <label className="grid gap-1 text-sm">
                  At-risk threshold (%)
                  <Input type="number" min="0" max="100" value={riskThreshold || settings?.at_risk_percentage || 85} onChange={event => setRiskThreshold(event.target.value)} />
                </label>
                <label className="grid gap-1 text-sm">
                  Consecutive absence alert
                  <Input type="number" min="1" value={absenceThreshold || settings?.consecutive_absence_threshold || 3} onChange={event => setAbsenceThreshold(event.target.value)} />
                </label>
                <label className="grid gap-1 text-sm">
                  Teacher edit cutoff (hours)
                  <Input type="number" min="0" value={editCutoff || settings?.edit_cutoff_hours || 24} onChange={event => setEditCutoff(event.target.value)} />
                </label>
                <Button onClick={() => void saveAttendancePolicy()} disabled={saveSettings.isPending}>Save policy</Button>
              </div>
              <div className="flex flex-wrap gap-5 border-t border-border pt-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={settings?.sessions_enabled ?? false} disabled={saveSettings.isPending} onChange={event => void updateAttendanceSetting({ sessions_enabled: event.target.checked })} />
                  Enable morning/afternoon/evening sessions
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={settings?.lesson_attendance_enabled ?? false} disabled={saveSettings.isPending} onChange={event => void updateAttendanceSetting({ lesson_attendance_enabled: event.target.checked })} />
                  Enable per-lesson attendance
                </label>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-5 p-5">
              <div>
                <h3 className="font-semibold text-foreground">Academic year and term dates</h3>
                <p className="text-sm text-muted-foreground">These dates define term summaries and report-card attendance periods.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1 text-sm">
                  Academic year
                  <select
                    value={academicYearId}
                    onChange={event => {
                      setAcademicYearId(event.target.value);
                      setSelectedTermId("");
                      setIsCreatingTerm(false);
                      setTermName("");
                      setTermStartDate("");
                      setTermEndDate("");
                      setTermIsActive(false);
                    }}
                    className="rounded-lg border border-border bg-background px-3 py-2"
                  >
                    {academicYears.map(year => <option key={year.id} value={year.id}>{year.name} ({year.start_date} – {year.end_date})</option>)}
                  </select>
                </label>
                <label className="grid gap-1 text-sm">
                  Term to edit
                  <select
                    value={selectedTermId}
                    onChange={event => {
                      const term = academicTerms.find(item => item.id === Number(event.target.value));
                      setSelectedTermId(event.target.value);
                      setIsCreatingTerm(!event.target.value);
                      setTermName(term?.name ?? "");
                      setTermStartDate(term?.start_date ?? "");
                      setTermEndDate(term?.end_date ?? "");
                      setTermIsActive(term?.is_active ?? false);
                    }}
                    className="rounded-lg border border-border bg-background px-3 py-2"
                  >
                    <option value="">Create a term</option>
                    {academicTerms.map(term => <option key={term.id} value={term.id}>{term.name}</option>)}
                  </select>
                </label>
                <label className="grid gap-1 text-sm">
                  Term name
                  <Input value={termName} onChange={event => setTermName(event.target.value)} placeholder="Term 1" maxLength={64} />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1 text-sm">Opening date<Input type="date" value={termStartDate} onChange={event => setTermStartDate(event.target.value)} /></label>
                  <label className="grid gap-1 text-sm">Closing date<Input type="date" value={termEndDate} onChange={event => setTermEndDate(event.target.value)} /></label>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={termIsActive} onChange={event => setTermIsActive(event.target.checked)} />
                  Set as active term
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => void saveTermDates()} disabled={saveSchoolTerm.isPending || !academicYearId}>
                    {selectedTermId ? "Save term dates" : "Create term"}
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setSelectedTermId("");
                    setIsCreatingTerm(true);
                    setTermName("");
                    setTermStartDate("");
                    setTermEndDate("");
                    setTermIsActive(false);
                  }}>New term</Button>
                </div>
              </div>
              <div className="border-t border-border pt-4">
                <h4 className="mb-3 text-sm font-semibold">Add an academic year</h4>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <Input value={newAcademicYearName} onChange={event => setNewAcademicYearName(event.target.value)} placeholder="2027" aria-label="New academic year name" />
                  <Input type="date" value={newAcademicYearStart} onChange={event => setNewAcademicYearStart(event.target.value)} aria-label="Academic year opening date" />
                  <Input type="date" value={newAcademicYearEnd} onChange={event => setNewAcademicYearEnd(event.target.value)} aria-label="Academic year closing date" />
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={newAcademicYearCurrent} onChange={event => setNewAcademicYearCurrent(event.target.checked)} />Current year</label>
                  <Button variant="outline" onClick={() => void saveAcademicYearDates()} disabled={saveAcademicYear.isPending}>Add year</Button>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-0">
              <div className="border-b border-border p-4">
                <h3 className="font-semibold">Learners below {settings?.at_risk_percentage ?? 85}% attendance · {selectedTermValue || "all terms"}</h3>
              </div>
              <div className="divide-y divide-border">
                {atRiskSummaries.slice(0, 50).map(summary => {
                  const learner = students.find(student => student.id === summary.student);
                  return <div key={summary.id} className="flex flex-wrap justify-between gap-2 px-4 py-3 text-sm">
                    <span>{learner?.name ?? `Learner #${summary.student}`} · {learner?.class_name ?? "Class not set"}{consecutiveAbsenceCounts.has(summary.student) ? ` · ${consecutiveAbsenceCounts.get(summary.student)} consecutive marked absences` : ""}</span>
                    <span className="font-semibold text-destructive">{Number(summary.attendance_percentage).toFixed(1)}%</span>
                  </div>;
                })}
                {atRiskSummaries.length === 0 && <p className="p-4 text-sm text-muted-foreground">No learners are below the configured attendance threshold.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <Card>
            <CardContent className="space-y-4 p-5">
              <label className="grid max-w-sm gap-1 text-sm">
                Filter audit history by learner ID (optional)
                <Input type="number" min="1" value={auditStudentFilter} onChange={event => setAuditStudentFilter(event.target.value)} />
              </label>
              {auditLoading ? <p className="text-sm text-muted-foreground">Loading audit history…</p> : (
                <div className="max-h-[32rem] divide-y divide-border overflow-auto rounded-lg border border-border">
                  {auditEntries.map(entry => (
                    <article key={entry.id} className="space-y-1 p-3 text-sm">
                      <div className="flex flex-wrap justify-between gap-2">
                        <strong className="capitalize">{entry.action} · learner #{entry.student ?? "removed"}</strong>
                        <span className="text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleString()}</span>
                      </div>
                      {entry.reason && <p className="text-xs text-muted-foreground">Reason: {entry.reason}</p>}
                      {(entry.old_value || entry.new_value) && <details className="text-xs">
                        <summary className="cursor-pointer">Changed values</summary>
                        <pre className="mt-2 overflow-auto rounded bg-secondary p-2">{JSON.stringify({ before: entry.old_value, after: entry.new_value }, null, 2)}</pre>
                      </details>}
                    </article>
                  ))}
                  {!auditEntries.length && <p className="p-4 text-sm text-muted-foreground">No attendance changes found for this filter.</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="excuses" className="mt-4">
          <Card>
            <CardContent className="divide-y divide-border p-0">
              {pendingExcuses.map(excuse => (
                <article key={excuse.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-semibold">{excuse.student_name} · {excuse.date}</p>
                    <p className="text-sm text-muted-foreground">{excuse.reason.replaceAll("_", " ")}{excuse.note ? ` · ${excuse.note}` : ""}</p>
                    {excuse.attachment && <a className="text-sm text-primary underline" href={excuse.attachment} target="_blank" rel="noreferrer">View attachment</a>}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => void handleReviewExcuse(excuse, "approved")} disabled={reviewExcuse.isPending}>Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => void handleReviewExcuse(excuse, "rejected")} disabled={reviewExcuse.isPending}>Reject</Button>
                  </div>
                </article>
              ))}
              {pendingExcuses.length === 0 && <p className="p-5 text-sm text-muted-foreground">No parent-submitted excuses are waiting for review.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mark" className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={selectedClassId || ""}
              onChange={(e) => setSelectedClassId(parseInt(e.target.value))}
              className="px-4 py-2 rounded-lg border border-border bg-background text-foreground"
            >
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              aria-label="Attendance date"
              className="w-auto"
            />
            <select value={selectedSession} onChange={event => setSelectedSession(event.target.value as typeof selectedSession)} aria-label="Attendance session" className="rounded-lg border border-border bg-background px-3 py-2">
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
            </select>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {!attendanceDateStatus.isSchoolDay && (
            <p role="status" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              {attendanceDateStatus.reason} Attendance controls are disabled for this date.
            </p>
          )}
          {attendanceDateStatus.isSchoolDay && attendanceDateStatus.sessionLabel && (
            <p className="text-xs text-muted-foreground">{attendanceDateStatus.sessionLabel}</p>
          )}

          <div className="flex items-center gap-6 p-4 bg-secondary/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-foreground font-medium">{selectedClass?.name || "Select Class"}</span>
            </div>
            <div className="flex items-center gap-4 ml-auto">
              <span className="flex items-center gap-1 text-sm">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Present: {presentCount}
              </span>
              <span className="flex items-center gap-1 text-sm">
                <span className="h-2 w-2 rounded-full bg-destructive" />
                Absent: {absentCount}
              </span>
              <span className="flex items-center gap-1 text-sm">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Late: {lateCount}
              </span>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                Unmarked: {unmarkedCount}
              </span>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Student</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-foreground">Status</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="border-t border-border hover:bg-secondary/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {student.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <span className="font-medium text-foreground">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-3 py-1 rounded-full ${student.status === "present" ? "bg-green-100 text-green-700" :
                          student.status === "absent" ? "bg-red-100 text-red-700" :
                            student.status === "late" ? "bg-amber-100 text-amber-700" : "bg-secondary text-muted-foreground"
                        }`}>
                        {student.status === "unmarked" ? "Not marked" : student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleUpdateAttendance(student.id as number, "present")}
                          disabled={!attendanceDateStatus.isSchoolDay || updateAttendanceMutation.isPending}
                          aria-label={`Mark ${student.name} present`}
                          className={`p-2 rounded-lg transition-colors ${student.status === "present"
                              ? "bg-green-500 text-white"
                              : "bg-secondary hover:bg-green-100 text-muted-foreground hover:text-green-600"
                            }`}
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleUpdateAttendance(student.id as number, "absent")}
                          disabled={!attendanceDateStatus.isSchoolDay || updateAttendanceMutation.isPending}
                          aria-label={`Mark ${student.name} absent`}
                          className={`p-2 rounded-lg transition-colors ${student.status === "absent"
                              ? "bg-destructive text-white"
                              : "bg-secondary hover:bg-red-100 text-muted-foreground hover:text-red-600"
                            }`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleUpdateAttendance(student.id as number, "late")}
                          disabled={!attendanceDateStatus.isSchoolDay || updateAttendanceMutation.isPending}
                          aria-label={`Mark ${student.name} late`}
                          className={`p-2 rounded-lg transition-colors ${student.status === "late"
                              ? "bg-amber-500 text-white"
                              : "bg-secondary hover:bg-amber-100 text-muted-foreground hover:text-amber-600"
                            }`}
                        >
                          <Clock className="h-4 w-4" />
                        </button>
                        <select
                          aria-label={`Set special attendance status for ${student.name}`}
                          value={["excused", "sick_bay", "suspended"].includes(student.status) ? student.status : ""}
                          onChange={event => {
                            if (event.target.value) void handleUpdateAttendance(student.id as number, event.target.value as "excused" | "sick_bay" | "suspended");
                          }}
                          className="max-w-32 rounded-md border border-border bg-background px-2 py-1 text-xs"
                        >
                          <option value="">More…</option>
                          <option value="excused">Excused</option>
                          <option value="sick_bay">Sick bay</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="border-b border-border p-4">
                <h3 className="font-semibold">School-wide class attendance · {selectedDate} · {selectedSession}</h3>
                <p className="text-xs text-muted-foreground">Daily counts across classes for the selected register session.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead className="bg-secondary/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm">Class</th>
                      <th className="px-4 py-3 text-right text-sm">Marked / learners</th>
                      <th className="px-4 py-3 text-right text-sm">Present</th>
                      <th className="px-4 py-3 text-right text-sm">Absent</th>
                      <th className="px-4 py-3 text-right text-sm">Late</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyClassRegister.map(item => (
                      <tr key={item.id} className="border-t border-border">
                        <td className="px-4 py-3 text-sm font-medium">{item.name}</td>
                        <td className="px-4 py-3 text-right text-sm">{item.marked} / {item.learners}</td>
                        <td className="px-4 py-3 text-right text-sm text-green-700">{item.present}</td>
                        <td className="px-4 py-3 text-right text-sm text-destructive">{item.absent}</td>
                        <td className="px-4 py-3 text-right text-sm text-amber-700">{item.late}</td>
                      </tr>
                    ))}
                    {dailyClassRegister.length === 0 && <tr><td colSpan={5} className="p-5 text-center text-sm text-muted-foreground">No classes are configured.</td></tr>}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <span className="text-sm text-muted-foreground">Changes save immediately. Unmarked learners are not counted as present.</span>
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4 mt-4">
          <Card>
            <CardContent className="space-y-4 p-5">
              <div>
                <h3 className="font-semibold text-foreground">Manage school calendar overrides</h3>
                <p className="text-sm text-muted-foreground">Set local school days, holidays, or closures. These overrides take precedence over the default Zimbabwe school calendar.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_2fr_auto]">
                <Input type="date" value={calendarDate} onChange={event => setCalendarDate(event.target.value)} aria-label="Calendar date" />
                <select value={calendarType} onChange={event => setCalendarType(event.target.value as typeof calendarType)} className="rounded-lg border border-border bg-background px-3 py-2">
                  <option value="school_day">School day</option>
                  <option value="holiday">Holiday</option>
                  <option value="closed">Closed</option>
                </select>
                <Input value={calendarNote} onChange={event => setCalendarNote(event.target.value)} placeholder="Note or holiday name" maxLength={255} />
                <Button onClick={() => void saveCalendarOverride()} disabled={saveCalendarDay.isPending}>Save override</Button>
              </div>
              {calendarDays.length > 0 && (
                <div className="max-h-48 divide-y divide-border overflow-auto rounded-lg border border-border">
                  {calendarDays.slice(0, 100).map(day => (
                    <div key={day.id} className="flex justify-between gap-3 px-3 py-2 text-sm">
                      <span>{day.date}</span>
                      <span className="capitalize">{day.day_type.replace("_", " ")}{day.note ? ` · ${day.note}` : ""}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-5 p-5">
              <div>
                <h3 className="font-semibold text-foreground">Zimbabwe school sessions · 2026</h3>
                <p className="mt-1 text-sm text-muted-foreground">Attendance is counted Monday to Friday inside each session, excluding gazetted public holidays.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {ZIMBABWE_2026_TERMS.map((term) => {
                  const holidays = ZIMBABWE_2026_PUBLIC_HOLIDAYS.filter((holiday) => holiday.date >= term.startDate && holiday.date <= term.endDate);
                  return (
                    <article key={term.term} className="rounded-xl border border-border bg-secondary/20 p-4">
                      <h4 className="font-semibold text-foreground">Term {term.term}</h4>
                      <p className="mt-2 text-sm text-muted-foreground">{formatCalendarDate(term.startDate)} – {formatCalendarDate(term.endDate)}, 2026</p>
                      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Gazetted holidays in session</p>
                      {holidays.length ? (
                        <ul className="mt-1 space-y-1 text-sm text-foreground">
                          {holidays.map((holiday) => <li key={holiday.date}>{holiday.name} · {formatCalendarDate(holiday.date)}</li>)}
                        </ul>
                      ) : <p className="mt-1 text-sm text-foreground">None</p>}
                    </article>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">Weekends, term breaks, and public holidays cannot be used to enter attendance for 2026.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4 mt-4">
          <Card>
            <CardContent className="p-0">
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  Recent Absences
                </h3>
              </div>
              <table className="w-full">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Student</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Class</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Reason</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-foreground">Days</th>
                  </tr>
                </thead>
                <tbody>
                  {absenceHistory.map((absence) => (
                    <tr key={absence.id} className="border-t border-border hover:bg-secondary/30">
                      <td className="px-4 py-3 font-medium text-foreground">{absence.student_name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{absence.class_name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{absence.date}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-1 rounded bg-secondary text-foreground">
                          Absent
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-foreground">—</td>
                    </tr>
                  ))}
                  {absenceHistory.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No absence records found.</td></tr>}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AttendanceSection;
