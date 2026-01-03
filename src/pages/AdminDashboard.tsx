import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Home, 
  Users, 
  BookOpen, 
  GraduationCap,
  Calendar, 
  Settings, 
  Bell, 
  LogOut,
  Plus,
  Edit,
  Trash2,
  Image,
  School,
  UserPlus,
  ClipboardList,
  User,
  Search,
  ChevronDown
} from "lucide-react";
import logo from "@/assets/wenyasha-logo.jpg";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", icon: Home, id: "dashboard" },
  { name: "Students", icon: GraduationCap, id: "students" },
  { name: "Teachers", icon: Users, id: "teachers" },
  { name: "Classes", icon: School, id: "classes" },
  { name: "Subjects", icon: BookOpen, id: "subjects" },
  { name: "Allocations", icon: ClipboardList, id: "allocations" },
  { name: "Gallery", icon: Image, id: "gallery" },
  { name: "Timetable", icon: Calendar, id: "timetable" },
  { name: "Settings", icon: Settings, id: "settings" },
];

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
  const [showModal, setShowModal] = useState<string | null>(null);

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Students</p>
              <p className="text-3xl font-bold text-foreground mt-1">1,245</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
          </div>
          <p className="text-xs text-green-600 mt-2">+12 new this term</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Teachers</p>
              <p className="text-3xl font-bold text-foreground mt-1">48</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center">
              <Users className="h-6 w-6 text-accent-foreground" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Across 8 departments</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Classes</p>
              <p className="text-3xl font-bold text-foreground mt-1">32</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <School className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Forms 1-6</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Subjects Offered</p>
              <p className="text-3xl font-bold text-foreground mt-1">24</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-amber-600" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">ZIMSEC & Cambridge</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="font-heading font-bold text-lg text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button onClick={() => setShowModal("addStudent")} variant="outline" className="h-auto py-4 flex flex-col gap-2">
            <UserPlus className="h-6 w-6" />
            <span>Enroll Student</span>
          </Button>
          <Button onClick={() => setActiveNav("allocations")} variant="outline" className="h-auto py-4 flex flex-col gap-2">
            <ClipboardList className="h-6 w-6" />
            <span>Allocate Class</span>
          </Button>
          <Button onClick={() => setActiveNav("gallery")} variant="outline" className="h-auto py-4 flex flex-col gap-2">
            <Image className="h-6 w-6" />
            <span>Add to Gallery</span>
          </Button>
          <Button onClick={() => setActiveNav("timetable")} variant="outline" className="h-auto py-4 flex flex-col gap-2">
            <Calendar className="h-6 w-6" />
            <span>View Timetable</span>
          </Button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-heading font-bold text-lg text-foreground mb-4">Recent Enrollments</h2>
          <div className="space-y-3">
            {mockStudents.slice(0, 4).map((student) => (
              <div key={student.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{student.name}</p>
                    <p className="text-xs text-muted-foreground">{student.class}</p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">{student.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-heading font-bold text-lg text-foreground mb-4">Class Capacity Overview</h2>
          <div className="space-y-3">
            {mockClasses.slice(0, 4).map((cls) => (
              <div key={cls.id} className="p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-foreground text-sm">{cls.name}</p>
                  <span className="text-xs text-muted-foreground">{cls.enrolled}/{cls.capacity}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${(cls.enrolled / cls.capacity) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

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
        
        {/* Add Image Card */}
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
      case "dashboard": return renderDashboard();
      case "students": return renderStudents();
      case "teachers": return renderTeachers();
      case "classes": return renderClasses();
      case "subjects": return renderSubjects();
      case "allocations": return renderAllocations();
      case "gallery": return renderGallery();
      case "timetable": return renderTimetable();
      default: return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-primary text-primary-foreground flex flex-col">
        <div className="p-6 border-b border-primary-foreground/10">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Wenyasha" className="h-10 w-10 rounded-lg object-contain bg-card" />
            <div>
              <h1 className="font-heading font-bold text-lg">Admin Portal</h1>
              <p className="text-xs text-primary-foreground/70">Super Administrator</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                activeNav === item.id
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-primary-foreground/80 hover:bg-primary-foreground/10"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-primary-foreground/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-sm">Admin User</p>
              <p className="text-xs text-primary-foreground/70">Super Admin</p>
            </div>
          </div>
          <Link
            to="/portal"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground font-medium hover:bg-accent/90 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="bg-card border-b border-border p-6 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">
              {navigation.find(n => n.id === activeNav)?.name || "Dashboard"}
            </h1>
            <p className="text-muted-foreground text-sm">Manage school operations</p>
          </div>
          <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
            <Bell className="h-6 w-6 text-muted-foreground" />
            <span className="absolute top-1 right-1 h-4 w-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
              5
            </span>
          </button>
        </header>

        <div className="p-6">
          {renderContent()}
        </div>
      </main>

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
