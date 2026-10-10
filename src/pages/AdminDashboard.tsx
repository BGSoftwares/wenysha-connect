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

import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { api, getErrorMessage } from "@/lib/api";

const AdminDashboard = () => {
  const queryClient = useQueryClient();
  const [activeNav, setActiveNav] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showModal, setShowModal] = useState<string | null>(null);

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

  const handleEditStudent = async (student: Student) => {
    const name = window.prompt("Student full name", student.name)?.trim();
    if (!name || name === student.name) return;
    try {
      await updateStudentMutation.mutateAsync({ id: student.id, data: { name } });
      toast.success("Student record updated");
    } catch (error) {
      toast.error("Could not update the student record");
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
    const name = window.prompt("Teacher name", teacher.name)?.trim(); if (!name) return;
    const department = window.prompt("Department", teacher.department)?.trim(); if (!department) return;
    const phone = window.prompt("Phone number", teacher.phone ?? ""); if (phone === null) return;
    void updateRecord("/school/teachers/", teacher.id, { name, department, phone }, "Teacher", "teachers");
  };
  const handleEditClass = (schoolClass: SchoolClass) => {
    const name = window.prompt("Class name", schoolClass.name)?.trim(); if (!name) return;
    const capacityText = window.prompt("Class capacity", String(schoolClass.capacity)); if (capacityText === null) return;
    const capacity = Number(capacityText); if (!Number.isInteger(capacity) || capacity < 1) { toast.error("Capacity must be a positive whole number"); return; }
    void updateRecord("/school/classes/", schoolClass.id, { name, capacity }, "Class", "classes");
  };
  const handleEditSubject = (subject: Subject) => {
    const name = window.prompt("Subject name", subject.name)?.trim(); if (!name) return;
    const code = window.prompt("Subject code", subject.code)?.trim(); if (!code) return;
    const department = window.prompt("Department", subject.department)?.trim() ?? subject.department;
    void updateRecord("/school/subjects/", subject.id, { name, code, department }, "Subject", "subjects");
  };

  const [newStudent, setNewStudent] = useState({ name: "", student_id: "", school_class: "", gender: "" });
  const [newTeacher, setNewTeacher] = useState({ name: "", department: "", phone: "" });
  const [newClass, setNewClass] = useState({ name: "", capacity: 40 });
  const [newSubject, setNewSubject] = useState({ name: "", code: "", department: "" });
  const [newAllocation, setNewAllocation] = useState({ teacher: "", subject: "", school_class: "", periods: 5 });

  const handleCreateStudent = async () => {
    try {
      if (!newStudent.name || !newStudent.student_id || !newStudent.school_class) {
        toast.error("Please fill in all fields");
        return;
      }
      const classId = classes?.find(c => c.name === newStudent.school_class)?.id;
      if (!classId) {
        toast.error("Invalid class selected");
        return;
      }
      await createStudentMutation.mutateAsync({
        name: newStudent.name,
        student_id: newStudent.student_id,
        school_class: classId,
        gender: newStudent.gender,
        status: "Active"
      });
      toast.success("Student enrolled successfully");
      setShowModal(null);
      setNewStudent({ name: "", student_id: "", school_class: "", gender: "" });
    } catch (error) {
      toast.error("Failed to enroll student");
    }
  };

  const handleCreateTeacher = async () => {
    try {
      if (!newTeacher.name || !newTeacher.department) {
        toast.error("Name and Department are required");
        return;
      }
      await createTeacherMutation.mutateAsync({
        name: newTeacher.name,
        department: newTeacher.department,
        phone: newTeacher.phone
      });
      toast.success("Teacher added successfully");
      setShowModal(null);
      setNewTeacher({ name: "", department: "", phone: "" });
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
      parents: "Parents",
      library: "Library",
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
      case "dashboard": return <DashboardOverview />;
      case "students": return (
        <StudentsSection
          students={students}
          isLoading={isLoadingStudents}
          error={studentsError}
          classes={classes}
          onAddStudent={() => setShowModal("addStudent")}
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
          isLoading={isLoadingTeachers}
          onAddTeacher={() => setShowModal("addTeacher")}
          onEditTeacher={handleEditTeacher}
          onDeleteTeacher={teacher => void deleteRecord("/school/teachers/", Number(teacher.id), "Teacher", "teachers")}
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
      case "account": return <DashboardOverview />;
      case "attendance": return <AttendanceSection />;
      case "exam":
      case "exam-management": return <ExamManagementSection />;
      case "pending-approvals": return <PendingApprovalsSection />;
      case "transport": return <TransportSection />;
      case "hostel": return <HostelSection />;
      case "notice": return <NoticeSection />;
      case "message": return <MessageSection />;
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
                    <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Student ID</label>
                    <input type="text" className="w-full p-2.5 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all" value={newStudent.student_id} onChange={e => setNewStudent({ ...newStudent, student_id: e.target.value })} placeholder="ID-2024-001" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Class</label>
                      <select className="w-full p-2.5 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all" value={newStudent.school_class} onChange={e => setNewStudent({ ...newStudent, school_class: e.target.value })}>
                        <option value="">Select</option>
                        {classes?.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Gender</label>
                      <select className="w-full p-2.5 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all" value={newStudent.gender} onChange={e => setNewStudent({ ...newStudent, gender: e.target.value })}>
                        <option value="">Select</option>
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
    </div>
  );
};

export default AdminDashboard;
