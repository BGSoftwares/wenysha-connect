import { useState } from "react";
import { Search, Calendar, Check, X, Clock, Users, TrendingUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const mockClasses = [
  { id: 1, name: "Form 4A", teacher: "Mrs. Grace Moyo" },
  { id: 2, name: "Form 4B", teacher: "Mr. David Ncube" },
  { id: 3, name: "Form 3A", teacher: "Ms. Linda Phiri" },
  { id: 4, name: "Form 3B", teacher: "Mr. James Dube" },
  { id: 5, name: "Form 2A", teacher: "Mrs. Susan Banda" },
];

const mockStudents = [
  { id: 1, name: "John Moyo", class: "Form 4A", status: "present" },
  { id: 2, name: "Sarah Ndlovu", class: "Form 4A", status: "present" },
  { id: 3, name: "Peter Chikwanda", class: "Form 4A", status: "absent" },
  { id: 4, name: "Mary Sibanda", class: "Form 4A", status: "present" },
  { id: 5, name: "Grace Moyo", class: "Form 4A", status: "late" },
  { id: 6, name: "David Tembo", class: "Form 4A", status: "present" },
  { id: 7, name: "Linda Phiri", class: "Form 4A", status: "present" },
  { id: 8, name: "James Dube", class: "Form 4A", status: "absent" },
];

const mockAttendanceStats = {
  totalStudents: 450,
  presentToday: 412,
  absentToday: 28,
  lateToday: 10,
  averageAttendance: 94.5,
};

const mockRecentAbsences = [
  { id: 1, student: "Peter Chikwanda", class: "Form 4A", date: "2024-12-05", reason: "Medical", days: 1 },
  { id: 2, student: "James Dube", class: "Form 4A", date: "2024-12-05", reason: "Family Emergency", days: 1 },
  { id: 3, student: "Susan Banda", class: "Form 3B", date: "2024-12-04", reason: "Sick Leave", days: 2 },
  { id: 4, student: "Michael Ncube", class: "Form 2A", date: "2024-12-03", reason: "Medical Appointment", days: 1 },
];

const AttendanceSection = () => {
  const [selectedClass, setSelectedClass] = useState(mockClasses[0]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [attendanceData, setAttendanceData] = useState(mockStudents);

  const filteredStudents = attendanceData.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const updateAttendance = (studentId: number, status: string) => {
    setAttendanceData(prev => 
      prev.map(s => s.id === studentId ? { ...s, status } : s)
    );
  };

  const presentCount = attendanceData.filter(s => s.status === "present").length;
  const absentCount = attendanceData.filter(s => s.status === "absent").length;
  const lateCount = attendanceData.filter(s => s.status === "late").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">Attendance Management</h2>
          <p className="text-sm text-muted-foreground">Track and manage student attendance</p>
        </div>
        <Button variant="gold">
          <Calendar className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Check className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{mockAttendanceStats.presentToday}</p>
                <p className="text-xs text-muted-foreground">Present Today</p>
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
                <p className="text-2xl font-bold text-foreground">{mockAttendanceStats.absentToday}</p>
                <p className="text-xs text-muted-foreground">Absent Today</p>
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
                <p className="text-2xl font-bold text-foreground">{mockAttendanceStats.lateToday}</p>
                <p className="text-xs text-muted-foreground">Late Today</p>
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
                <p className="text-2xl font-bold text-foreground">{mockAttendanceStats.averageAttendance}%</p>
                <p className="text-xs text-muted-foreground">Avg Attendance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="mark" className="w-full">
        <TabsList>
          <TabsTrigger value="mark">Mark Attendance</TabsTrigger>
          <TabsTrigger value="history">Absence History</TabsTrigger>
        </TabsList>

        <TabsContent value="mark" className="space-y-4 mt-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={selectedClass.id}
              onChange={(e) => setSelectedClass(mockClasses.find(c => c.id === parseInt(e.target.value)) || mockClasses[0])}
              className="px-4 py-2 rounded-lg border border-border bg-background text-foreground"
            >
              {mockClasses.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name} - {cls.teacher}</option>
              ))}
            </select>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
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

          {/* Summary Bar */}
          <div className="flex items-center gap-6 p-4 bg-secondary/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-foreground font-medium">{selectedClass.name}</span>
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
            </div>
          </div>

          {/* Attendance Table */}
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
                      <span className={`text-xs px-3 py-1 rounded-full ${
                        student.status === "present" ? "bg-green-100 text-green-700" :
                        student.status === "absent" ? "bg-red-100 text-red-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>
                        {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => updateAttendance(student.id, "present")}
                          className={`p-2 rounded-lg transition-colors ${
                            student.status === "present" 
                              ? "bg-green-500 text-white" 
                              : "bg-secondary hover:bg-green-100 text-muted-foreground hover:text-green-600"
                          }`}
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => updateAttendance(student.id, "absent")}
                          className={`p-2 rounded-lg transition-colors ${
                            student.status === "absent" 
                              ? "bg-destructive text-white" 
                              : "bg-secondary hover:bg-red-100 text-muted-foreground hover:text-red-600"
                          }`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => updateAttendance(student.id, "late")}
                          className={`p-2 rounded-lg transition-colors ${
                            student.status === "late" 
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
            <Button variant="gold">Save Attendance</Button>
          </div>
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
                  {mockRecentAbsences.map((absence) => (
                    <tr key={absence.id} className="border-t border-border hover:bg-secondary/30">
                      <td className="px-4 py-3 font-medium text-foreground">{absence.student}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{absence.class}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{absence.date}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-1 rounded bg-secondary text-foreground">
                          {absence.reason}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-foreground">{absence.days}</td>
                    </tr>
                  ))}
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
