import { useState } from "react";
import { useParams } from 'react-router-dom';
import { useStudents, useTeachers, useClasses, useSubjects, useCreateStudent, useCreateTeacher, useCreateClass, useCreateSubject, useAllocations } from "@/lib/hooks";
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

// Mock data for allocations and gallery (not yet in hooks)
const mockAllocations = [
  { id: 1, teacher: "Mrs. Grace Moyo", subject: "Mathematics", class: "Form 4A", periods: 6 },
  { id: 2, teacher: "Mr. David Ncube", subject: "Physics", class: "Form 4A", periods: 5 },
  { id: 3, teacher: "Ms. Linda Phiri", subject: "English", class: "Form 3B", periods: 6 },
  { id: 4, teacher: "Mr. David Ncube", subject: "Chemistry", class: "Form 4B", periods: 5 },
];

const mockGalleryImages = [
  { id: 1, title: "Sports Day 2024", category: "Events", date: "Dec 5, 2024" },
  { id: 2, title: "Science Fair", category: "Academic", date: "Nov 28, 2024" },
  { id: 3, title: "Prize Giving", category: "Events", date: "Nov 15, 2024" },
];

const AdminDashboard = () => {
  const params = useParams();
  const adminRouteId = params.id ? Number(params.id) : undefined;
  const [activeNav, setActiveNav] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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

  const [newStudent, setNewStudent] = useState({ name: "", student_id: "", school_class: "", gender: "" });
  const [newTeacher, setNewTeacher] = useState({ name: "", department: "", phone: "" });
  const [newClass, setNewClass] = useState({ name: "", capacity: 40 });
  const [newSubject, setNewSubject] = useState({ name: "", code: "", department: "" });

  const handleCreateStudent = async () => {
    try {
      // Required fields
      if (!newStudent.name || !newStudent.student_id || !newStudent.school_class) {
        toast.error("Please fill in all required fields");
        return;
      }
      // student_id validation
      const idPattern = /^[A-Za-z0-9\-]{3,}$/;
      if (!idPattern.test(newStudent.student_id)) {
        toast.error("Student ID must be at least 3 characters and contain only letters, numbers, or dashes");
        return;
      }
      // uniqueness check
      if (students && Array.isArray(students) && students.some((s: any) => s.student_id === newStudent.student_id)) {
        toast.error("Student ID already exists");
        return;
      }
      const classId = Number(newStudent.school_class);
      if (!classId || !classes?.some(c => c.id === classId)) {
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
          students={students as any}
          isLoading={isLoadingStudents}
          error={studentsError}
          classes={classes}
          onAddStudent={() => setShowModal("addStudent")}
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
        />
      );
      case "classes":
      case "add-class": return (
        <ClassesSection
          classes={classes}
          onAddClass={() => setShowModal("addClass")}
        />
      );
      case "subjects":
      case "add-subject": return (
        <SubjectsSection
          subjects={subjects}
          onAddSubject={() => setShowModal("addSubject")}
        />
      );
      case "allocations": return (
        <AllocationsSection
          allocations={allocations}
          onAddAllocation={() => setShowModal("addAllocation")}
        />
      );
      case "gallery": return (
        <GallerySection
          images={mockGalleryImages}
          onAddImage={() => setShowModal("addGalleryImage")}
        />
      );
      case "timetable": return <TimetableSection classes={classes || []} />;
      case "users-roles":
      case "roles": return <UsersRolesSection activeSubNav={activeNav} />;
      case "settings":
      case "system-setup":
      case "cache": return <SettingsSection activeSubNav={activeNav} />;
      case "profile": return <ProfileSection userId={adminRouteId} />;
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
    <div className="min-h-screen flex bg-background w-full">
      <AdminSidebar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader
          title={getPageTitle()}
          breadcrumb={`Home > ${getPageTitle()}`}
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
                {showModal === "addGalleryImage" && "Add Gallery Image"}
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
                        {classes?.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
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
                    if (showModal === "addGalleryImage" || showModal === "addAllocation") setShowModal(null);
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
