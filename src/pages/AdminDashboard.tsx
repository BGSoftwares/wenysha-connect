import DashboardExtras from "@/components/dashboard/DashboardExtras";
import { useState } from "react";
import { useStudents, useTeachers, useClasses, useSubjects, useCreateStudent, useCreateTeacher, useCreateClass, useCreateSubject, useAllocations, useUpdateStudent, useDeleteStudent, type Student, type Teacher, type SchoolClass, type Subject } from "@/lib/hooks";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

// Layout & Core
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

// Modular Sections
import DashboardOverview from "@/components/admin/DashboardOverview";
import StudentsSection from "@/components/admin/StudentsSection";
import TeachersSection from "@/components/admin/TeachersSection";
import ClassesSection from "@/components/admin/ClassesSection";
import SubjectsSection from "@/components/admin/SubjectsSection";
import AllocationsSection from "@/components/admin/AllocationsSection";
import GallerySection from "@/components/admin/GallerySection";
import TimetableSection from "@/components/admin/TimetableSection";

// Existing Specialized Sections
import UsersRolesSection from "@/components/admin/UsersRolesSection";
import SettingsSection from "@/components/admin/SettingsSection";
import ProfileSection from "@/components/admin/ProfileSection";
import ExamManagementSection from "@/components/admin/ExamManagementSection";
import MarkSubmissionsSection from "@/components/admin/MarkSubmissionsSection";
import PendingApprovalsSection from "@/components/admin/PendingApprovalsSection";
import ParentsSection from "@/components/admin/ParentsSection";
import LibrarySection from "@/components/admin/LibrarySection";
import TransportSection from "@/components/admin/TransportSection";
import HostelSection from "@/components/admin/HostelSection";
import NoticeSection from "@/components/admin/NoticeSection";
import MessageSection from "@/components/admin/MessageSection";
import AttendanceSection from "@/components/admin/AttendanceSection";
import MapSection from "@/components/admin/MapSection";
import AdmissionSection from "@/components/admin/AdmissionSection";
import PromotionSection from "@/components/admin/PromotionSection";
import LearningMaterialsSection from "@/components/dashboard/LearningMaterialsSection";

import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { api, getErrorMessage } from "@/lib/api";

const AdminDashboard = () => {
  const queryClient = useQueryClient();
  const [activeNav, setActiveNav] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showModal, setShowModal] = useState<string | null>(null);
  const [bulkComment, setBulkComment] = useState("Excellent work this term. Keep the momentum and continue to work hard in class.");

  // Hook Integration
  const { data: students, isLoading: isLoadingStudents, error: studentsError } = useStudents();
  const { data: classes } = useClasses();
  const { data: teachers, isLoading: isLoadingTeachers } = useTeachers();
  const { data: subjects, isLoading: isLoadingSubjects } = useSubjects();
  const { data: allocations = [] } = useAllocations();

  const createStudentMutation = useCreateStudent();
  const createTeacherMutation = useCreateTeacher();
  const createClassMutation = useCreateClass();
  const createSubjectMutation = useCreateSubject();
  const updateStudentMutation = useUpdateStudent();
  const deleteStudentMutation = useDeleteStudent();

  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const handleEditStudent = (student: Student) => {
    setEditingStudent({ ...student });
  };

  const handleSaveStudentEdit = async () => {
    if (!editingStudent) return;
    if (!editingStudent.name?.trim() || !editingStudent.student_id?.trim()) {
      toast.error("Student name and ID are required");
      return;
    }
    try {
      await updateStudentMutation.mutateAsync({
        id: editingStudent.id,
        data: {
          name: editingStudent.name.trim(),
          student_id: editingStudent.student_id.trim(),
          school_class: Number(editingStudent.school_class),
          gender: editingStudent.gender,
          status: editingStudent.status,
          date_of_birth: editingStudent.date_of_birth || undefined,
          address: editingStudent.address || "",
        }
      });
      toast.success("Student record updated successfully");
      setEditingStudent(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleDeleteStudent = async (student: Student) => {
    if (!window.confirm(`Delete ${student.name}'s student record? This cannot be undone.`)) return;
    try {
      await deleteStudentMutation.mutateAsync(student.id);
      toast.success("Student record deleted");
    } catch (error) {
      toast.error("Could not delete the student record");
    }
  };

  const updateRecord = async (path: string, id: number, data: Record<string, unknown>, label: string, queryKey: string) => {
    try { await api.patch(`${path}${id}/`, data); await queryClient.invalidateQueries({ queryKey: [queryKey] }); toast.success(`${label} updated`); }
    catch (error) { toast.error(getErrorMessage(error)); }
  };
  const deleteRecord = async (path: string, id: number, label: string, queryKey: string) => {
    if (!window.confirm(`Delete this ${label.toLowerCase()}? This may be blocked if it is in use.`)) return;
    try { await api.delete(`${path}${id}/`); await queryClient.invalidateQueries({ queryKey: [queryKey] }); toast.success(`${label} deleted`); }
    catch (error) { toast.error(getErrorMessage(error)); }
  };

  const handleEditTeacher = (teacher: Teacher) => {
    setEditingTeacher({ ...teacher });
  };

  const handleSaveTeacherEdit = async () => {
    if (!editingTeacher) return;
    if (!editingTeacher.name?.trim() || !editingTeacher.department?.trim()) {
      toast.error("Teacher name and department are required");
      return;
    }
    try {
      await api.patch(`/school/teachers/${editingTeacher.id}/`, {
        name: editingTeacher.name.trim(),
        department: editingTeacher.department.trim(),
        phone: editingTeacher.phone?.trim() || "",
      });
      await queryClient.invalidateQueries({ queryKey: ["teachers"] });
      toast.success("Teacher record updated successfully");
      setEditingTeacher(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleEditClass = (schoolClass: SchoolClass) => {
    setEditingClass({ ...schoolClass });
  };

  const handleSaveClassEdit = async () => {
    if (!editingClass) return;
    if (!editingClass.name?.trim()) {
      toast.error("Class name is required");
      return;
    }
    const cap = Number(editingClass.capacity);
    if (!Number.isInteger(cap) || cap < 1) {
      toast.error("Capacity must be a positive whole number");
      return;
    }
    try {
      await api.patch(`/school/classes/${editingClass.id}/`, {
        name: editingClass.name.trim(),
        capacity: cap,
      });
      await queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Class record updated successfully");
      setEditingClass(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleEditSubject = (subject: Subject) => {
    setEditingSubject({ ...subject });
  };

  const handleSaveSubjectEdit = async () => {
    if (!editingSubject) return;
    if (!editingSubject.name?.trim() || !editingSubject.code?.trim()) {
      toast.error("Subject name and code are required");
      return;
    }
    try {
      await api.patch(`/school/subjects/${editingSubject.id}/`, {
        name: editingSubject.name.trim(),
        code: editingSubject.code.trim(),
        department: editingSubject.department?.trim() || "",
      });
      await queryClient.invalidateQueries({ queryKey: ["subjects"] });
      toast.success("Subject record updated successfully");
      setEditingSubject(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const getNextStudentId = (studentList: Student[] = []) => {
    let maxNum = 0;
    const year = new Date().getFullYear().toString().slice(-2);
    for (const s of studentList) {
      if (!s.student_id) continue;
      const match = s.student_id.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
    return `AGC${year}S${String(maxNum + 1).padStart(3, "0")}`;
  };
  const getNextEmployeeId = (teacherList: Teacher[] = []) => {
    let maxNum = 0;
    const year = new Date().getFullYear().toString().slice(-2);
    for (const t of teacherList) {
      if (!t.employee_id) continue;
      const match = t.employee_id.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
    return `AGC${year}T${String(maxNum + 1).padStart(3, "0")}`;
  };


  const [newStudent, setNewStudent] = useState({ name: "", student_id: "", school_class: "", gender: "Male" });
  const [newTeacher, setNewTeacher] = useState({ name: "", department: "", phone: "", employee_id: "" });
  const [newClass, setNewClass] = useState({ name: "", capacity: 40 });
  const [newSubject, setNewSubject] = useState({ name: "", code: "", department: "" });
  const [newAllocation, setNewAllocation] = useState({ teacher: "", subject: "", school_class: "", periods: 5 });

  const handleCreateStudent = async () => {
    try {
      const autoId = getNextStudentId(students);
      const studentId = newStudent.student_id?.trim() || autoId;
      if (!newStudent.name?.trim()) {
        toast.error("Please enter student full name");
        return;
      }
      const selectedClassName = newStudent.school_class || (classes && classes[0]?.name);
      if (!selectedClassName) {
        toast.error("Please select a class");
        return;
      }
      const classId = classes?.find(c => c.name === selectedClassName)?.id;
      if (!classId) {
        toast.error("Invalid class selected");
        return;
      }
      await createStudentMutation.mutateAsync({
        name: newStudent.name.trim(),
        student_id: studentId,
        school_class: classId,
        gender: newStudent.gender || "Male",
        status: "Active"
      });
      toast.success(`Student enrolled successfully with ID ${studentId}`);
      setShowModal(null);
      setNewStudent({ name: "", student_id: "", school_class: "", gender: "Male" });
    } catch (error) {
      toast.error(getErrorMessage(error) || "Failed to enroll student");
    }
  };

  const handleCreateTeacher = async () => {
    try {
      if (!newTeacher.name?.trim() || !newTeacher.department?.trim()) {
        toast.error("Name and Department are required");
        return;
      }
      const autoId = getNextEmployeeId(teachers);
      const employeeId = newTeacher.employee_id?.trim() || autoId;
      await createTeacherMutation.mutateAsync({
        name: newTeacher.name.trim(),
        department: newTeacher.department.trim(),
        phone: newTeacher.phone?.trim() || "",
        employee_id: employeeId
      });
      toast.success(`Teacher added successfully with Employee ID ${employeeId}`);
      setShowModal(null);
      setNewTeacher({ name: "", department: "", phone: "", employee_id: "" });
    } catch (error) {
      toast.error("Failed to add teacher");
    }
  };

  const handleCreateClass = async () => {
    try {
      if (!newClass.name) {
        toast.error("Class name is required");
        return;
      }
      await createClassMutation.mutateAsync({
        name: newClass.name,
        capacity: newClass.capacity,
        enrolled: 0
      });
      toast.success("Class created successfully");
      setShowModal(null);
      setNewClass({ name: "", capacity: 40 });
    } catch (error) {
      toast.error("Failed to create class");
    }
  };

  const handleCreateSubject = async () => {
    try {
      if (!newSubject.name || !newSubject.code) {
        toast.error("Subject name and code are required");
        return;
      }
      await createSubjectMutation.mutateAsync({
        name: newSubject.name,
        code: newSubject.code,
        department: newSubject.department
      });
      toast.success("Subject added successfully");
      setShowModal(null);
      setNewSubject({ name: "", code: "", department: "" });
    } catch (error) {
      toast.error("Failed to add subject");
    }
  };

  const handleCreateAllocation = async () => {
    if (!newAllocation.teacher || !newAllocation.subject || !newAllocation.school_class || newAllocation.periods < 1) {
      toast.error("Select a teacher, subject, class, and valid weekly periods");
      return;
    }
    try {
      await api.post("/school/allocations/", {
        teacher: Number(newAllocation.teacher),
        subject: Number(newAllocation.subject),
        school_class: Number(newAllocation.school_class),
        periods: newAllocation.periods,
      });
      await queryClient.invalidateQueries({ queryKey: ["allocations"] });
      setNewAllocation({ teacher: "", subject: "", school_class: "", periods: 5 });
      setShowModal(null);
      toast.success("Teacher allocation saved");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const getPageTitle = () => {
    const titles: Record<string, string> = {
      dashboard: "Admin Dashboard",
      students: "Students",
      admission: "Students",
      promotion: "Students",
      teachers: "Teachers",
      "add-teacher": "Teachers",
      allocations: "Subject & Class Assignments",
      parents: "Parents",
      library: "Library",
      "learning-materials": "Learning Materials & Notes",
      account: "Account",
      classes: "Classes",
      "add-class": "Classes",
      subjects: "Subjects",
      "add-subject": "Subjects",
      timetable: "Class Routine",
      attendance: "Attendance",
      exam: "Exam Management",
      "exam-management": "Exam Management",
      "pending-approvals": "Pending Approvals",
      transport: "Transport",
      hostel: "Hostel",
      notice: "Notice",
      message: "Messages",
      gallery: "Gallery",
      map: "Map",
      "report-cards": "Report Cards",
      "users-roles": "Users & Roles",
      roles: "Users & Roles",
      settings: "Settings",
      "system-setup": "Settings",
      cache: "Settings",
      profile: "Profile",
    };
    return titles[activeNav] || "Dashboard";
  };

  const renderContent = () => {
    switch (activeNav) {
      case "dashboard": return (<><DashboardExtras role="Admin" actions={[{ label: "Students", onClick: () => setActiveNav("students") }, { label: "Notices", onClick: () => setActiveNav("notice") }]} /><DashboardOverview /></>);
      case "students": return (
        <StudentsSection
          students={students}
          isLoading={isLoadingStudents}
          error={studentsError}
          classes={classes}
          onAddStudent={() => {
            const nextId = getNextStudentId(students);
            setNewStudent({
              name: "",
              student_id: nextId,
              school_class: classes?.[0]?.name || "",
              gender: "Male"
            });
            setShowModal("addStudent");
          }}
          onEditStudent={handleEditStudent}
          onDeleteStudent={handleDeleteStudent}
        />
      );
      case "admission": return <AdmissionSection />;
      case "promotion": return <PromotionSection />;
      case "teachers":
      case "add-teacher": return (
        <TeachersSection
          teachers={teachers}
          classes={classes}
          subjects={subjects}
          allocations={allocations}
          isLoading={isLoadingTeachers}
          onAddTeacher={() => { const nextId = getNextEmployeeId(teachers); setNewTeacher({ name: "", department: "", phone: "", employee_id: nextId }); setShowModal("addTeacher"); }}
          onEditTeacher={handleEditTeacher}
          onDeleteTeacher={teacher => void deleteRecord("/school/teachers/", Number(teacher.id), "Teacher", "teachers")}
          onAssignClassTeacher={(classId, teacherId) => void updateRecord(
            "/school/classes/",
            classId,
            { class_teacher: teacherId },
            "Class teacher assignment",
            "classes",
          )}
        />
      );
      case "classes":
      case "add-class": return (
        <ClassesSection
          classes={classes}
          onAddClass={() => setShowModal("addClass")}
          onEditClass={handleEditClass}
          onDeleteClass={schoolClass => void deleteRecord("/school/classes/", Number(schoolClass.id), "Class", "classes")}
        />
      );
      case "subjects":
      case "add-subject": return (
        <SubjectsSection
          subjects={subjects}
          onAddSubject={() => setShowModal("addSubject")}
          onEditSubject={handleEditSubject}
          onDeleteSubject={subject => void deleteRecord("/school/subjects/", Number(subject.id), "Subject", "subjects")}
        />
      );
      case "allocations": return (
        <AllocationsSection
          allocations={allocations}
          onAddAllocation={() => setShowModal("addAllocation")}
        />
      );
      case "gallery": return (
        <GallerySection />
      );
      case "timetable": return <TimetableSection classes={classes || []} />;
      case "users-roles":
      case "roles": return <UsersRolesSection activeSubNav={activeNav} />;
      case "settings":
      case "system-setup":
      case "cache": return <SettingsSection activeSubNav={activeNav} />;
      case "profile": return <ProfileSection />;
      case "parents": return <ParentsSection />;
      case "library": return <LibrarySection />;
      case "learning-materials": return (
        <LearningMaterialsSection
          classes={(classes || []).map((c) => ({ id: c.id, name: c.name }))}
          subjects={(subjects || []).map((s) => ({ id: s.id, name: s.name }))}
          uploadedBy="School Administrator"
          emptyHint="No notes or materials have been uploaded yet. Upload lesson notes, syllabi, past papers, or videos from your computer."
        />
      );
      case "account": return <DashboardOverview />;
      case "attendance": return <AttendanceSection />;
      case "exam":
      case "exam-management": return <div className="space-y-6"><MarkSubmissionsSection /><ExamManagementSection /></div>;
      case "pending-approvals": return <PendingApprovalsSection />;
      case "transport": return <TransportSection />;
      case "hostel": return <HostelSection />;
      case "notice": return <NoticeSection />;
      case "message": return <MessageSection />;
      case "report-cards": return (
        <div className="space-y-6">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-elegant">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-[0.2em]">Administration</p>
                <h2 className="font-heading text-2xl font-bold text-foreground">Bulk Report Cards</h2>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => window.print()}>Print All Report Cards</Button>
                <Button
                  variant="gold"
                  onClick={() => {
                    const message = `School report cards are ready. Please visit the portal to view the latest results and comments. ${window.location.origin}`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
                  }}
                >
                  Share via WhatsApp
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6 shadow-elegant space-y-5">
            <div>
              <h3 className="font-semibold text-foreground mb-2">Admin Comment for All Generated Report Cards</h3>
              <textarea
                value={bulkComment}
                onChange={(event) => setBulkComment(event.target.value)}
                className="min-h-[120px] w-full rounded-xl border border-border bg-background p-4 text-sm text-foreground"
                placeholder="Add a school-wide principal or admin comment..."
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => setBulkComment("Excellent work this term. Keep up the positive attitude and continue to strive for excellence.")}>Use Default</Button>
              <Button variant="gold" onClick={() => toast.success("Admin comment applied to the generated report cards.")}>Apply Comment to All</Button>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6 shadow-elegant">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Generated Report Cards</h3>
              <span className="text-sm text-muted-foreground">{students?.length ?? 0} students</span>
            </div>
            <div className="space-y-3">
              {(students ?? []).slice(0, 8).map((student) => (
                <div key={student.id} className="flex items-center justify-between rounded-xl border border-border bg-secondary/20 p-4">
                  <div>
                    <p className="font-medium text-foreground">{student.name}</p>
                    <p className="text-sm text-muted-foreground">{student.student_id} • {classes?.find(cls => cls.id === student.school_class)?.name || "Class not set"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs rounded-full bg-primary/10 px-2 py-1 text-primary">Visible online</span>
                    <Button variant="outline" size="sm" onClick={() => window.print()}>Print</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
      case "map": return <MapSection />;
      default: return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen flex bg-background w-full dashboard-3d">
      <AdminSidebar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader
          title={getPageTitle()}
          breadcrumb={`Home > ${getPageTitle()}`}
          onMenuClick={() => setMobileSidebarOpen(true)}
        />

        <main className="flex-1 overflow-auto p-6 bg-secondary/10">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>

      <Toaster />

      {/* Dynamic Modals */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300" onClick={() => setShowModal(null)}>
          <div className="bg-card rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-border animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-heading text-2xl font-bold text-foreground">
                {showModal === "addStudent" && "Enroll New Student"}
                {showModal === "addTeacher" && "Add New Teacher"}
                {showModal === "addClass" && "Create New Class"}
                {showModal === "addSubject" && "Add New Subject"}
                {showModal === "addAllocation" && "New Allocation"}
              </h3>
            </div>

            <div className="space-y-5">
              {showModal === "addStudent" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Full Name</label>
                    <input type="text" className="w-full p-2.5 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all" value={newStudent.name} onChange={e => setNewStudent({ ...newStudent, name: e.target.value })} placeholder="e.g. John Doe" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Student ID</label>
                      <span className="text-[10px] text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded font-medium">
                        ⚡ Auto-incremented
                      </span>
                    </div>
                    <input
                      type="text"
                      className="w-full p-2.5 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono font-semibold text-primary"
                      value={newStudent.student_id || getNextStudentId(students)}
                      onChange={e => setNewStudent({ ...newStudent, student_id: e.target.value })}
                      placeholder={getNextStudentId(students)}
                    />
                    <p className="text-[11px] text-muted-foreground ml-1">
                      Next sequential student ID generated automatically (editable if required)
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Class</label>
                      <select className="w-full p-2.5 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all" value={newStudent.school_class || (classes && classes[0]?.name) || ""} onChange={e => setNewStudent({ ...newStudent, school_class: e.target.value })}>
                        <option value="">Select</option>
                        {classes?.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Gender</label>
                      <select className="w-full p-2.5 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all" value={newStudent.gender || "Male"} onChange={e => setNewStudent({ ...newStudent, gender: e.target.value })}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {showModal === "addTeacher" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Full Name</label>
                    <input type="text" className="w-full p-2.5 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all" value={newTeacher.name} onChange={e => setNewTeacher({ ...newTeacher, name: e.target.value })} placeholder="Dr. Jane Smith" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Department</label>
                    <input type="text" className="w-full p-2.5 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all" value={newTeacher.department} onChange={e => setNewTeacher({ ...newTeacher, department: e.target.value })} placeholder="e.g. Mathematics" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Phone Number</label>
                    <input type="text" className="w-full p-2.5 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all" value={newTeacher.phone} onChange={e => setNewTeacher({ ...newTeacher, phone: e.target.value })} placeholder="+263..." />
                  </div>
                </>
              )}

              {showModal === "addClass" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Class Name</label>
                    <input type="text" className="w-full p-2.5 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all" value={newClass.name} onChange={e => setNewClass({ ...newClass, name: e.target.value })} placeholder="e.g. Form 4A" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Max Capacity</label>
                    <input type="number" className="w-full p-2.5 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all" value={newClass.capacity} onChange={e => setNewClass({ ...newClass, capacity: parseInt(e.target.value) })} />
                  </div>
                </>
              )}

              {showModal === "addSubject" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Subject Name</label>
                    <input type="text" className="w-full p-2.5 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all" value={newSubject.name} onChange={e => setNewSubject({ ...newSubject, name: e.target.value })} placeholder="e.g. Biology" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Code</label>
                      <input type="text" className="w-full p-2.5 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all" value={newSubject.code} onChange={e => setNewSubject({ ...newSubject, code: e.target.value })} placeholder="BIO-01" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Dept</label>
                      <input type="text" className="w-full p-2.5 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all" value={newSubject.department} onChange={e => setNewSubject({ ...newSubject, department: e.target.value })} placeholder="Science" />
                    </div>
                  </div>
                </>
              )}

              {showModal === "addAllocation" && (
                <>
                  <label className="block space-y-1.5 text-xs font-bold uppercase text-muted-foreground">Teacher
                    <select className="w-full rounded-xl border border-border bg-background p-2.5 text-sm font-normal normal-case text-foreground" value={newAllocation.teacher} onChange={e => setNewAllocation({ ...newAllocation, teacher: e.target.value })}>
                      <option value="">Select teacher</option>{teachers?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </label>
                  <label className="block space-y-1.5 text-xs font-bold uppercase text-muted-foreground">Subject
                    <select className="w-full rounded-xl border border-border bg-background p-2.5 text-sm font-normal normal-case text-foreground" value={newAllocation.subject} onChange={e => setNewAllocation({ ...newAllocation, subject: e.target.value })}>
                      <option value="">Select subject</option>{subjects?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </label>
                  <label className="block space-y-1.5 text-xs font-bold uppercase text-muted-foreground">Class
                    <select className="w-full rounded-xl border border-border bg-background p-2.5 text-sm font-normal normal-case text-foreground" value={newAllocation.school_class} onChange={e => setNewAllocation({ ...newAllocation, school_class: e.target.value })}>
                      <option value="">Select class</option>{classes?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </label>
                  <label className="block space-y-1.5 text-xs font-bold uppercase text-muted-foreground">Periods per week
                    <input type="number" min={1} max={40} className="w-full rounded-xl border border-border bg-background p-2.5 text-sm font-normal normal-case text-foreground" value={newAllocation.periods} onChange={e => setNewAllocation({ ...newAllocation, periods: Number(e.target.value) })}/>
                  </label>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6">
                <Button variant="outline" onClick={() => setShowModal(null)} className="flex-1 rounded-xl h-11">Cancel</Button>
                <Button
                  variant="gold"
                  className="flex-1 rounded-xl h-11 font-bold shadow-lg shadow-accent/20"
                  onClick={() => {
                    if (showModal === "addStudent") handleCreateStudent();
                    if (showModal === "addTeacher") handleCreateTeacher();
                    if (showModal === "addClass") handleCreateClass();
                    if (showModal === "addSubject") handleCreateSubject();
                    if (showModal === "addAllocation") void handleCreateAllocation();
                  }}
                  disabled={createStudentMutation.isPending || createTeacherMutation.isPending || createClassMutation.isPending || createSubjectMutation.isPending}
                >
                  Confirm & Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300" onClick={() => setEditingStudent(null)}>
          <div className="bg-card rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl border border-border animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-heading text-2xl font-bold text-foreground">Edit Student Record</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Full Name</label>
                <input
                  type="text"
                  className="w-full p-2.5 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                  value={editingStudent.name}
                  onChange={e => setEditingStudent({ ...editingStudent, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Student ID</label>
                <input
                  type="text"
                  className="w-full p-2.5 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                  value={editingStudent.student_id}
                  onChange={e => setEditingStudent({ ...editingStudent, student_id: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Class</label>
                  <select
                    className="w-full p-2.5 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                    value={editingStudent.school_class}
                    onChange={e => setEditingStudent({ ...editingStudent, school_class: Number(e.target.value) })}
                  >
                    {classes?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Gender</label>
                  <select
                    className="w-full p-2.5 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                    value={editingStudent.gender}
                    onChange={e => setEditingStudent({ ...editingStudent, gender: e.target.value })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Status</label>
                  <select
                    className="w-full p-2.5 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                    value={editingStudent.status}
                    onChange={e => setEditingStudent({ ...editingStudent, status: e.target.value as "Active" | "Inactive" })}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Date of Birth</label>
                  <input
                    type="date"
                    className="w-full p-2.5 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                    value={editingStudent.date_of_birth ?? ""}
                    onChange={e => setEditingStudent({ ...editingStudent, date_of_birth: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Residential Address</label>
                <input
                  type="text"
                  placeholder="e.g. 124 Main Street, Harare"
                  className="w-full p-2.5 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                  value={editingStudent.address ?? ""}
                  onChange={e => setEditingStudent({ ...editingStudent, address: e.target.value })}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <Button variant="outline" onClick={() => setEditingStudent(null)} className="flex-1 rounded-xl h-11">Cancel</Button>
                <Button variant="gold" onClick={handleSaveStudentEdit} className="flex-1 rounded-xl h-11 font-bold shadow-lg shadow-accent/20">Save Changes</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Teacher Modal */}
      {editingTeacher && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300" onClick={() => setEditingTeacher(null)}>
          <div className="bg-card rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-border animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-heading text-2xl font-bold text-foreground">Edit Teacher Profile</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Full Name</label>
                <input
                  type="text"
                  className="w-full p-2.5 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                  value={editingTeacher.name}
                  onChange={e => setEditingTeacher({ ...editingTeacher, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Department</label>
                <input
                  type="text"
                  className="w-full p-2.5 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                  value={editingTeacher.department}
                  onChange={e => setEditingTeacher({ ...editingTeacher, department: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Phone Number</label>
                <input
                  type="text"
                  className="w-full p-2.5 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                  value={editingTeacher.phone ?? ""}
                  onChange={e => setEditingTeacher({ ...editingTeacher, phone: e.target.value })}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <Button variant="outline" onClick={() => setEditingTeacher(null)} className="flex-1 rounded-xl h-11">Cancel</Button>
                <Button variant="gold" onClick={handleSaveTeacherEdit} className="flex-1 rounded-xl h-11 font-bold shadow-lg shadow-accent/20">Save Changes</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Class Modal */}
      {editingClass && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300" onClick={() => setEditingClass(null)}>
          <div className="bg-card rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-border animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-heading text-2xl font-bold text-foreground">Edit Class</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Class Name</label>
                <input
                  type="text"
                  className="w-full p-2.5 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                  value={editingClass.name}
                  onChange={e => setEditingClass({ ...editingClass, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Max Capacity</label>
                <input
                  type="number"
                  min={1}
                  className="w-full p-2.5 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                  value={editingClass.capacity}
                  onChange={e => setEditingClass({ ...editingClass, capacity: Number(e.target.value) })}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <Button variant="outline" onClick={() => setEditingClass(null)} className="flex-1 rounded-xl h-11">Cancel</Button>
                <Button variant="gold" onClick={handleSaveClassEdit} className="flex-1 rounded-xl h-11 font-bold shadow-lg shadow-accent/20">Save Changes</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Subject Modal */}
      {editingSubject && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300" onClick={() => setEditingSubject(null)}>
          <div className="bg-card rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-border animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-heading text-2xl font-bold text-foreground">Edit Subject</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Subject Name</label>
                <input
                  type="text"
                  className="w-full p-2.5 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                  value={editingSubject.name}
                  onChange={e => setEditingSubject({ ...editingSubject, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Code</label>
                  <input
                    type="text"
                    className="w-full p-2.5 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                    value={editingSubject.code}
                    onChange={e => setEditingSubject({ ...editingSubject, code: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Department</label>
                  <input
                    type="text"
                    className="w-full p-2.5 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                    value={editingSubject.department}
                    onChange={e => setEditingSubject({ ...editingSubject, department: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <Button variant="outline" onClick={() => setEditingSubject(null)} className="flex-1 rounded-xl h-11">Cancel</Button>
                <Button variant="gold" onClick={handleSaveSubjectEdit} className="flex-1 rounded-xl h-11 font-bold shadow-lg shadow-accent/20">Save Changes</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
