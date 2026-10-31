import { useState } from "react";
import { useStudents, useClasses, useAttendanceRecords, useUpdateAttendance } from "@/lib/hooks";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Clock, Calendar, Search, Users, TrendingUp, AlertCircle, Share2 } from "lucide-react";
import { buildAttendancePdf, sharePdfToWhatsApp } from "@/lib/pdfExport";
import { formatLocalDateKey, getSchoolDateStatus, ZIMBABWE_2026_PUBLIC_HOLIDAYS, ZIMBABWE_2026_TERMS } from "@/lib/zimbabweSchoolCalendar";

const formatCalendarDate = (dateKey: string) => new Date(`${dateKey}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

const AttendanceSection = () => {
  const { data: students = [] } = useStudents();
  const { data: classes = [] } = useClasses();
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(formatLocalDateKey(new Date()));
  const [searchQuery, setSearchQuery] = useState("");

  // Set initial class when data loads
  if (classes.length > 0 && !selectedClassId) {
    setSelectedClassId(classes[0].id);
  }

  const { data: attendanceRecords = [], isLoading: isLoadingAttendance } = useAttendanceRecords({
    date: selectedDate
  });
  const { data: absenceHistory = [] } = useAttendanceRecords({ status: "absent" });

  const updateAttendanceMutation = useUpdateAttendance();

  const selectedClass = classes.find(c => c.id === selectedClassId) || classes[0];
  const attendanceByStudent = new Map(attendanceRecords.map((record) => [record.student, record]));

  const attendanceData = students
    .filter(s => s.school_class === selectedClassId)
    .map(student => {
      const record = attendanceByStudent.get(student.id);
      return {
        ...student,
        status: record?.status || "unmarked"
      };
    });

  const attendanceDateStatus = getSchoolDateStatus(selectedDate);

  const filteredStudents = attendanceData.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpdateAttendance = async (studentId: number, status: "present" | "absent" | "late") => {
    if (!attendanceDateStatus.isSchoolDay) {
      toast.error(attendanceDateStatus.reason || "Attendance cannot be recorded on this date.");
      return;
    }
    try {
      await updateAttendanceMutation.mutateAsync({
        student: studentId,
        date: selectedDate,
        status
      });
      toast.success("Attendance updated");
    } catch {
      toast.error("Failed to update attendance");
    }
  };

  const presentCount = attendanceData.filter(s => s.status === "present").length;
  const absentCount = attendanceData.filter(s => s.status === "absent").length;
  const lateCount = attendanceData.filter(s => s.status === "late").length;
  const markedCount = presentCount + absentCount + lateCount;
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
        </TabsList>

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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <span className="text-sm text-muted-foreground">Changes save immediately. Unmarked learners are not counted as present.</span>
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4 mt-4">
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
