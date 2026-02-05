import { useState } from "react";
import { Plus, Edit, Trash2, Search, Calendar, BookOpen, Users, CheckCircle, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { calculateGrade, GRADING_SCALE } from "@/lib/grading";
import { useExams, useExamSchedules, useExamMarks, useCreateExam, useUpdateExamMark, useClasses, useSubjects, Exam } from "@/lib/hooks";

const ExamManagementSection = () => {
  const [activeTab, setActiveTab] = useState<"exams" | "schedules" | "marks">("exams");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMarksModal, setShowMarksModal] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Logic Hooks
  const { data: exams = [], isLoading: isLoadingExams } = useExams();
  const { data: schedules = [] } = useExamSchedules({ exam: selectedExamId || undefined });
  const { data: classes = [] } = useClasses();
  const { data: subjects = [] } = useSubjects();

  const createExamMutation = useCreateExam();

  const selectedExam = exams.find(e => e.id === selectedExamId);

  // Form states
  const [newExam, setNewExam] = useState({
    name: "",
    term: "Term 1",
    year: "2024",
    startDate: "",
    endDate: "",
    classes: [] as string[],
    subjects: [] as string[]
  });

  const getStatusBadge = (status: Exam["status"]) => {
    const styles = {
      scheduled: "bg-blue-100 text-blue-700",
      ongoing: "bg-amber-100 text-amber-700",
      completed: "bg-green-100 text-green-700",
      grading: "bg-purple-100 text-purple-700"
    };
    const labels = {
      scheduled: "Scheduled",
      ongoing: "Ongoing",
      completed: "Completed",
      grading: "Grading in Progress"
    };
    return <span className={`text-xs px-2 py-1 rounded-full font-medium ${styles[status]}`}>{labels[status]}</span>;
  };

  const handleCreateExam = async () => {
    try {
      if (!newExam.name || !newExam.startDate || !newExam.endDate || newExam.classes.length === 0) {
        toast.error("Please fill all required fields");
        return;
      }
      await createExamMutation.mutateAsync({
        name: newExam.name,
        term: newExam.term,
        year: newExam.year,
        start_date: newExam.startDate,
        end_date: newExam.endDate,
        classes: newExam.classes.map(id => Number(id)),
        subjects: newExam.subjects.map(id => Number(id))
      });
      toast.success("Exam created successfully");
      setShowCreateModal(false);
      setNewExam({ name: "", term: "Term 1", year: "2024", startDate: "", endDate: "", classes: [], subjects: [] });
    } catch (error) {
      toast.error("Failed to create exam");
    }
  };

  const toggleClass = (cls: string) => {
    setNewExam(prev => ({
      ...prev,
      classes: prev.classes.includes(cls)
        ? prev.classes.filter(c => c !== cls)
        : [...prev.classes, cls]
    }));
  };

  const toggleSubject = (subj: string) => {
    setNewExam(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subj)
        ? prev.subjects.filter(s => s !== subj)
        : [...prev.subjects, subj]
    }));
  };

  const filteredExams = (exams || []).filter(exam =>
    exam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exam.term.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">Exam Management</h2>
          <p className="text-muted-foreground text-sm">Create exams, assign to classes, and manage marks entry</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} variant="gold">
          <Plus className="h-4 w-4 mr-2" />
          Create Exam
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">5</p>
              <p className="text-xs text-muted-foreground">Total Exams</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">1</p>
              <p className="text-xs text-muted-foreground">Scheduled</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">4</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">2</p>
              <p className="text-xs text-muted-foreground">Pending Marks</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-6">
          {[
            { id: "exams", label: "All Exams", icon: Calendar },
            { id: "schedules", label: "Exam Schedule", icon: Clock },
            { id: "marks", label: "Marks Entry", icon: FileText }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search exams..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground"
        />
      </div>

      {/* Exams List */}
      {activeTab === "exams" && (
        <div className="grid gap-4">
          {filteredExams.map((exam) => (
            <div key={exam.id} className="bg-card rounded-xl border border-border p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{exam.name}</h3>
                      {getStatusBadge(exam.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{exam.term} {exam.year}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      <Calendar className="inline h-3 w-3 mr-1" />
                      {new Date(exam.startDate).toLocaleDateString()} - {new Date(exam.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 md:gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Classes</p>
                    <div className="flex flex-wrap gap-1">
                      {exam.classes.slice(0, 3).map((cls, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded bg-secondary text-foreground">{cls}</span>
                      ))}
                      {exam.classes.length > 3 && (
                        <span className="text-xs px-2 py-0.5 rounded bg-secondary text-foreground">+{exam.classes.length - 3}</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Subjects</p>
                    <p className="text-sm font-medium text-foreground">{exam.subjects.length} subjects</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedExamId(exam.id);
                        setShowMarksModal(true);
                      }}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Marks
                    </Button>
                    <Button variant="outline" size="sm"><Edit className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedules Tab */}
      {activeTab === "schedules" && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Subject</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Class</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Time</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Venue</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Invigilator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {schedules.map((schedule) => (
                <tr key={schedule.id} className="hover:bg-secondary/30">
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{schedule.subject_name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{schedule.class_name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(schedule.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{schedule.start_time} - {schedule.end_time}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{schedule.venue}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{schedule.invigilator}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Marks Entry Tab */}
      {activeTab === "marks" && (
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-foreground">Select Exam for Marks Entry</h3>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exams.filter(e => e.status === "completed" || e.status === "grading").map((exam) => (
              <button
                key={exam.id}
                onClick={() => {
                  setSelectedExamId(exam.id);
                  setShowMarksModal(true);
                }}
                className="p-4 rounded-lg border border-border hover:border-primary bg-background text-left transition-colors"
              >
                <h4 className="font-medium text-foreground mb-1">{exam.name}</h4>
                <p className="text-sm text-muted-foreground">{exam.term} {exam.year}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{exam.classes?.length || 0} classes</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Create Exam Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-card rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-heading text-xl font-bold text-foreground mb-6">Create New Exam</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Exam Name *</label>
                <input
                  type="text"
                  value={newExam.name}
                  onChange={(e) => setNewExam(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., End of Term 1 Examinations"
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Term *</label>
                  <select
                    value={newExam.term}
                    onChange={(e) => setNewExam(prev => ({ ...prev, term: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                  >
                    <option>Term 1</option>
                    <option>Term 2</option>
                    <option>Term 3</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Year *</label>
                  <select
                    value={newExam.year}
                    onChange={(e) => setNewExam(prev => ({ ...prev, year: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                  >
                    <option>2024</option>
                    <option>2025</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={newExam.startDate}
                    onChange={(e) => setNewExam(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">End Date *</label>
                  <input
                    type="date"
                    value={newExam.endDate}
                    onChange={(e) => setNewExam(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Assign Classes *</label>
                <div className="flex flex-wrap gap-2">
                  {classes.map((cls) => (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => toggleClass(String(cls.id))}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${newExam.classes.includes(String(cls.id))
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-foreground hover:bg-secondary/80"
                        }`}
                    >
                      {cls.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Select Subjects</label>
                <div className="flex flex-wrap gap-2">
                  {subjects.map((subj) => (
                    <button
                      key={subj.id}
                      type="button"
                      onClick={() => toggleSubject(String(subj.id))}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${newExam.subjects.includes(String(subj.id))
                        ? "bg-accent text-accent-foreground"
                        : "bg-secondary text-foreground hover:bg-secondary/80"
                        }`}
                    >
                      {subj.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">Cancel</Button>
              <Button variant="gold" onClick={handleCreateExam} className="flex-1">Create Exam</Button>
            </div>
          </div>
        </div>
      )}

      {/* Marks Entry Modal */}
      {showMarksModal && selectedExam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowMarksModal(false)}>
          <div className="bg-card rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-heading text-xl font-bold text-foreground mb-2">Enter Marks</h3>
            <p className="text-sm text-muted-foreground mb-6">{selectedExam.name}</p>

            <div className="flex gap-4 mb-6">
              <select className="px-4 py-2 rounded-lg border border-border bg-background text-foreground">
                <option>Select Class</option>
                {classes.filter(c => selectedExam?.classes.includes(c.id)).map(cls => <option key={cls.id}>{cls.name}</option>)}
              </select>
              <select className="px-4 py-2 rounded-lg border border-border bg-background text-foreground">
                <option>Select Subject</option>
                {subjects.filter(s => selectedExam?.subjects.includes(s.id)).map(subj => <option key={subj.id}>{subj.name}</option>)}
              </select>
            </div>

            {/* Grading Scale Reference */}
            <div className="bg-secondary/30 rounded-xl p-4 mb-6">
              <h4 className="font-semibold text-foreground text-sm mb-3">Grading Scale Reference</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {GRADING_SCALE.map((item) => {
                  const gradeInfo = calculateGrade(parseInt(item.range.split(' ')[0]) + 1);
                  return (
                    <div key={item.grade} className={`p-2 rounded-lg text-center ${gradeInfo.bgColor}`}>
                      <span className={`font-bold text-lg ${gradeInfo.color}`}>{item.grade}</span>
                      <p className="text-xs text-muted-foreground">{item.range}%</p>
                      <p className="text-xs font-medium text-foreground">{item.meaning}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-secondary/30 rounded-xl p-4 mb-6">
              <p className="text-sm text-muted-foreground text-center">
                Select a class and subject to load students and enter marks.
              </p>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Grades are automatically calculated: A (75-100), B (60-74), C (50-59), D (45-49), E (40-44), U (0-39)
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowMarksModal(false)} className="flex-1">Cancel</Button>
              <Button variant="gold" onClick={() => {
                toast.success("Marks saved successfully");
                setShowMarksModal(false);
              }} className="flex-1">Save Marks</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamManagementSection;
