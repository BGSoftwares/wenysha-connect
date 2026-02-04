import { useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import DashboardOverview from "@/components/admin/DashboardOverview";
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
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  User,
  Image
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Mock data
const mockStudents = [
  { id: 1, name: "John Moyo", class: "Form 4A", gender: "Male", status: "Active" },
  { id: 2, name: "Sarah Ndlovu", class: "Form 3B", gender: "Female", status: "Active" },
  { id: 3, name: "Peter Chikwanda", class: "Form 4A", gender: "Male", status: "Active" },
  { id: 4, name: "Mary Sibanda", class: "Form 2A", gender: "Female", status: "Active" },
];

const mockTeachers = [
  { id: 1, name: "Mr. Christopher Wenyasha", department: "Administration", subjects: ["Management"], classes: ["All"] },
  { id: 2, name: "Mrs. Grace Moyo", department: "Mathematics", subjects: ["Mathematics", "Statistics"], classes: ["Form 4A", "Form 3B"] },
  { id: 3, name: "Mr. David Ncube", department: "Sciences", subjects: ["Physics", "Chemistry"], classes: ["Form 4A", "Form 4B"] },
  { id: 4, name: "Ms. Linda Phiri", department: "Languages", subjects: ["English", "Shona"], classes: ["Form 3A", "Form 3B"] },
];

const mockClasses = [
  { id: 1, name: "Form 4A", capacity: 45, enrolled: 42, classTeacher: "Mrs. Grace Moyo" },
  { id: 2, name: "Form 4B", capacity: 45, enrolled: 40, classTeacher: "Mr. David Ncube" },
  { id: 3, name: "Form 3A", capacity: 45, enrolled: 44, classTeacher: "Ms. Linda Phiri" },
  { id: 4, name: "Form 3B", capacity: 45, enrolled: 38, classTeacher: "Mr. James Dube" },
  { id: 5, name: "Form 2A", capacity: 40, enrolled: 35, classTeacher: "Mrs. Susan Banda" },
];

const mockSubjects = [
  { id: 1, name: "Mathematics", code: "MATH", curriculum: "ZIMSEC & Cambridge", department: "Mathematics" },
  { id: 2, name: "English Language", code: "ENG", curriculum: "ZIMSEC & Cambridge", department: "Languages" },
  { id: 3, name: "Physics", code: "PHY", curriculum: "Cambridge", department: "Sciences" },
  { id: 4, name: "Chemistry", code: "CHEM", curriculum: "ZIMSEC & Cambridge", department: "Sciences" },
  { id: 5, name: "Biology", code: "BIO", curriculum: "ZIMSEC", department: "Sciences" },
  { id: 6, name: "History", code: "HIST", curriculum: "ZIMSEC", department: "Humanities" },
];

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
  const [activeNav, setActiveNav] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showModal, setShowModal] = useState<string | null>(null);

  const getPageTitle = () => {
    switch (activeNav) {
      case "dashboard": return "Admin Dashboard";
      case "students": 
      case "admission":
      case "promotion": return "Students";
      case "teachers":
      case "add-teacher": return "Teachers";
      case "parents": return "Parents";
      case "library": return "Library";
      case "account": return "Account";
      case "classes":
      case "add-class": return "Classes";
      case "subjects":
      case "add-subject": return "Subjects";
      case "timetable": return "Class Routine";
      case "attendance": return "Attendance";
      case "exam":
      case "exam-management": return "Exam Management";
      case "pending-approvals": return "Pending Approvals";
      case "transport": return "Transport";
      case "hostel": return "Hostel";
      case "notice": return "Notice";
      case "message": return "Messages";
      case "gallery": return "Gallery";
      case "map": return "Map";
      case "users-roles":
      case "roles": return "Users & Roles";
      case "settings":
      case "system-setup":
      case "cache": return "Settings";
      case "profile": return "Profile";
      default: return "Dashboard";
    }
  };

  const renderStudents = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold text-foreground">Student Management</h2>
        <Button onClick={() => setShowModal("addStudent")} variant="gold">
          <Plus className="h-4 w-4 mr-2" />
          Enroll Student
        </Button>
      </div>
      
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search students..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground"
            />
          </div>
          <select className="px-4 py-2 rounded-lg border border-border bg-background text-foreground">
            <option>All Classes</option>
            {mockClasses.map(c => <option key={c.id}>{c.name}</option>)}
          </select>
        </div>
        <table className="w-full">
          <thead className="bg-secondary/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Class</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Gender</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Status</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockStudents.map((student) => (
              <tr key={student.id} className="border-t border-border">
                <td className="px-4 py-3 text-sm text-foreground">{student.name}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{student.class}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{student.gender}</td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">{student.status}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="p-1 hover:bg-secondary rounded"><Edit className="h-4 w-4 text-muted-foreground" /></button>
                  <button className="p-1 hover:bg-secondary rounded ml-2"><Trash2 className="h-4 w-4 text-destructive" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTeachers = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold text-foreground">Teacher Management</h2>
        <Button onClick={() => setShowModal("addTeacher")} variant="gold">
          <Plus className="h-4 w-4 mr-2" />
          Add Teacher
        </Button>
      </div>
      
      <div className="grid gap-4">
        {mockTeachers.map((teacher) => (
          <div key={teacher.id} className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{teacher.name}</h3>
                  <p className="text-sm text-muted-foreground">{teacher.department} Department</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm"><Edit className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm"><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
            <div className="mt-4 grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Subjects</p>
                <div className="flex flex-wrap gap-1">
                  {teacher.subjects.map((subj, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">{subj}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Classes</p>
                <div className="flex flex-wrap gap-1">
                  {teacher.classes.map((cls, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded bg-secondary text-foreground">{cls}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderClasses = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold text-foreground">Class Management</h2>
        <Button onClick={() => setShowModal("addClass")} variant="gold">
          <Plus className="h-4 w-4 mr-2" />
          Add Class
        </Button>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockClasses.map((cls) => (
          <div key={cls.id} className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg text-foreground">{cls.name}</h3>
              <div className="flex gap-1">
                <button className="p-1 hover:bg-secondary rounded"><Edit className="h-4 w-4 text-muted-foreground" /></button>
                <button className="p-1 hover:bg-secondary rounded"><Trash2 className="h-4 w-4 text-destructive" /></button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-2">Class Teacher: {cls.classTeacher}</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Enrollment</span>
              <span className="font-medium text-foreground">{cls.enrolled}/{cls.capacity}</span>
            </div>
            <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full"
                style={{ width: `${(cls.enrolled / cls.capacity) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSubjects = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold text-foreground">Subject Management</h2>
        <Button onClick={() => setShowModal("addSubject")} variant="gold">
          <Plus className="h-4 w-4 mr-2" />
          Add Subject
        </Button>
      </div>
      
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-secondary/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Subject</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Code</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Curriculum</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Department</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockSubjects.map((subject) => (
              <tr key={subject.id} className="border-t border-border">
                <td className="px-4 py-3 text-sm font-medium text-foreground">{subject.name}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{subject.code}</td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-1 rounded bg-accent/20 text-accent-foreground">{subject.curriculum}</span>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{subject.department}</td>
                <td className="px-4 py-3 text-right">
                  <button className="p-1 hover:bg-secondary rounded"><Edit className="h-4 w-4 text-muted-foreground" /></button>
                  <button className="p-1 hover:bg-secondary rounded ml-2"><Trash2 className="h-4 w-4 text-destructive" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAllocations = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold text-foreground">Teacher-Class Allocations</h2>
        <Button onClick={() => setShowModal("addAllocation")} variant="gold">
          <Plus className="h-4 w-4 mr-2" />
          New Allocation
        </Button>
      </div>
      
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-secondary/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Teacher</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Subject</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Class</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Periods/Week</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockAllocations.map((alloc) => (
              <tr key={alloc.id} className="border-t border-border">
                <td className="px-4 py-3 text-sm text-foreground">{alloc.teacher}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{alloc.subject}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{alloc.class}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{alloc.periods}</td>
                <td className="px-4 py-3 text-right">
                  <button className="p-1 hover:bg-secondary rounded"><Edit className="h-4 w-4 text-muted-foreground" /></button>
                  <button className="p-1 hover:bg-secondary rounded ml-2"><Trash2 className="h-4 w-4 text-destructive" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderGallery = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold text-foreground">Gallery Management</h2>
        <Button onClick={() => setShowModal("addGalleryImage")} variant="gold">
          <Plus className="h-4 w-4 mr-2" />
          Add Image
        </Button>
      </div>
      
      <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
        {mockGalleryImages.map((img) => (
          <div key={img.id} className="bg-card rounded-xl border border-border overflow-hidden group">
            <div className="aspect-video bg-secondary flex items-center justify-center">
              <Image className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="p-4">
              <h4 className="font-medium text-foreground text-sm">{img.title}</h4>
              <p className="text-xs text-muted-foreground">{img.category} • {img.date}</p>
              <div className="flex gap-2 mt-3">
                <button className="flex-1 p-2 text-xs rounded bg-secondary hover:bg-secondary/80 text-foreground">Edit</button>
                <button className="p-2 rounded bg-destructive/10 hover:bg-destructive/20 text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        
        <button 
          onClick={() => setShowModal("addGalleryImage")}
          className="aspect-[4/3] rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors"
        >
          <Plus className="h-8 w-8" />
          <span className="text-sm">Add Image</span>
        </button>
      </div>
    </div>
  );

  const renderTimetable = () => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const periods = ["08:00-08:40", "08:40-09:20", "09:20-10:00", "10:30-11:10", "11:10-11:50", "11:50-12:30", "14:00-14:40", "14:40-15:20"];
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold text-foreground">School Timetable</h2>
          <select className="px-4 py-2 rounded-lg border border-border bg-background text-foreground">
            <option>All Classes</option>
            {mockClasses.map(c => <option key={c.id}>{c.name}</option>)}
          </select>
        </div>
        
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
                  {days.map(day => (
                    <td key={day} className="px-2 py-2 text-center">
                      {idx !== 3 && idx !== 6 ? (
                        <div className="p-2 rounded bg-primary/5 border border-primary/10">
                          <p className="text-xs font-medium text-foreground">Mathematics</p>
                          <p className="text-xs text-muted-foreground">Form 4A</p>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Break</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeNav) {
      case "dashboard": return <DashboardOverview />;
      case "students": return renderStudents();
      case "admission": return <AdmissionSection />;
      case "promotion": return <PromotionSection />;
      case "teachers":
      case "add-teacher": return renderTeachers();
      case "classes":
      case "add-class": return renderClasses();
      case "subjects":
      case "add-subject": return renderSubjects();
      case "allocations": return renderAllocations();
      case "gallery": return renderGallery();
      case "timetable": return renderTimetable();
      case "users-roles":
      case "roles": return <UsersRolesSection activeSubNav={activeNav} />;
      case "settings":
      case "system-setup":
      case "cache": return <SettingsSection activeSubNav={activeNav} />;
      case "profile": return <ProfileSection />;
      case "parents": return <ParentsSection />;
      case "library": return <LibrarySection />;
      case "account": return <DashboardOverview />; // Account uses AccountsDashboard separately
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

        <main className="flex-1 overflow-auto p-6">
          {renderContent()}
        </main>
      </div>

      {/* Modal Placeholder */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(null)}>
          <div className="bg-card rounded-xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-heading text-xl font-bold text-foreground mb-4">
              {showModal === "addStudent" && "Enroll New Student"}
              {showModal === "addTeacher" && "Add New Teacher"}
              {showModal === "addClass" && "Create New Class"}
              {showModal === "addSubject" && "Add New Subject"}
              {showModal === "addAllocation" && "Create Allocation"}
              {showModal === "addGalleryImage" && "Upload Image"}
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              This feature requires backend integration. Enable Lovable Cloud to save data persistently.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowModal(null)} className="flex-1">Cancel</Button>
              <Button variant="gold" onClick={() => setShowModal(null)} className="flex-1">Got it</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
