import { Link } from "react-router-dom";
import { 
  Home, 
  Users, 
  BookOpen, 
  GraduationCap,
  Calendar, 
  Settings, 
  LogOut,
  Image,
  School,
  ClipboardList,
  User,
  ChevronDown,
  ChevronRight,
  Shield,
  Database,
  UserCog,
  Menu,
  Bus,
  Building,
  MessageSquare,
  MapPin,
  CreditCard,
  FileText
} from "lucide-react";
import logo from "@/assets/wenyasha-logo.jpg";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  icon: React.ElementType;
  id: string;
  children?: { name: string; id: string }[];
}

const navigation: NavItem[] = [
  { name: "Dashboard", icon: Home, id: "dashboard" },
  { 
    name: "Students", 
    icon: GraduationCap, 
    id: "students",
    children: [
      { name: "All Students", id: "students" },
      { name: "Admission", id: "admission" },
      { name: "Promotion", id: "promotion" },
    ]
  },
  { 
    name: "Teachers", 
    icon: Users, 
    id: "teachers",
    children: [
      { name: "All Teachers", id: "teachers" },
      { name: "Add Teacher", id: "add-teacher" },
    ]
  },
  { name: "Parents", icon: UserCog, id: "parents" },
  { name: "Library", icon: BookOpen, id: "library" },
  { name: "Account", icon: CreditCard, id: "account" },
  { 
    name: "Class", 
    icon: School, 
    id: "classes",
    children: [
      { name: "All Classes", id: "classes" },
      { name: "Add Class", id: "add-class" },
    ]
  },
  { 
    name: "Subject", 
    icon: BookOpen, 
    id: "subjects",
    children: [
      { name: "All Subjects", id: "subjects" },
      { name: "Add Subject", id: "add-subject" },
    ]
  },
  { name: "Class Routine", icon: Calendar, id: "timetable" },
  { name: "Attendance", icon: ClipboardList, id: "attendance" },
  { 
    name: "Exam", 
    icon: FileText, 
    id: "exam",
    children: [
      { name: "All Exams", id: "exam" },
      { name: "Exam Management", id: "exam-management" },
    ]
  },
  { 
    name: "Approvals", 
    icon: UserCog, 
    id: "pending-approvals",
  },
  { name: "Transport", icon: Bus, id: "transport" },
  { name: "Hostel", icon: Building, id: "hostel" },
  { name: "Notice", icon: MessageSquare, id: "notice" },
  { name: "Message", icon: MessageSquare, id: "message" },
  { name: "Gallery", icon: Image, id: "gallery" },
  { name: "Map", icon: MapPin, id: "map" },
  { 
    name: "Users & Roles", 
    icon: Shield, 
    id: "users-roles",
    children: [
      { name: "All Users", id: "users-roles" },
      { name: "Roles", id: "roles" },
    ]
  },
  { 
    name: "Settings", 
    icon: Settings, 
    id: "settings",
    children: [
      { name: "System Setup", id: "system-setup" },
      { name: "Cache Management", id: "cache" },
    ]
  },
  { name: "Profile", icon: User, id: "profile" },
];

interface AdminSidebarProps {
  activeNav: string;
  setActiveNav: (id: string) => void;
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
}

const AdminSidebar = ({ activeNav, setActiveNav, collapsed, setCollapsed }: AdminSidebarProps) => {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const isActive = (item: NavItem) => {
    if (activeNav === item.id) return true;
    if (item.children?.some(child => activeNav === child.id)) return true;
    return false;
  };

  return (
    <aside className={cn(
      "bg-[hsl(220,25%,18%)] text-[hsl(0,0%,95%)] flex flex-col transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-[hsl(220,20%,25%)] flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <img src={logo} alt="Wenyasha" className="h-10 w-10 rounded-lg object-contain bg-accent" />
            <div>
              <h1 className="font-heading font-bold text-lg text-accent">WENYASHA</h1>
            </div>
          </div>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-[hsl(220,20%,25%)] transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto scrollbar-thin">
        {navigation.map((item) => (
          <div key={item.id}>
            <button
              onClick={() => {
                if (item.children) {
                  toggleExpanded(item.id);
                } else {
                  setActiveNav(item.id);
                }
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all text-sm",
                isActive(item)
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-[hsl(0,0%,80%)] hover:bg-[hsl(220,20%,25%)]"
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1">{item.name}</span>
                  {item.children && (
                    expandedItems.includes(item.id) 
                      ? <ChevronDown className="h-4 w-4" />
                      : <ChevronRight className="h-4 w-4" />
                  )}
                </>
              )}
            </button>
            
            {/* Submenu */}
            {!collapsed && item.children && expandedItems.includes(item.id) && (
              <div className="ml-6 mt-1 space-y-0.5">
                {item.children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => setActiveNav(child.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors",
                      activeNav === child.id
                        ? "bg-accent/20 text-accent font-medium"
                        : "text-[hsl(0,0%,70%)] hover:text-[hsl(0,0%,90%)] hover:bg-[hsl(220,20%,22%)]"
                    )}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {child.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* User & Sign Out */}
      {!collapsed && (
        <div className="p-4 border-t border-[hsl(220,20%,25%)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center">
              <User className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="font-medium text-sm">Admin User</p>
              <p className="text-xs text-[hsl(0,0%,60%)]">Super Admin</p>
            </div>
          </div>
          <Link
            to="/portal"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-destructive/20 text-destructive font-medium hover:bg-destructive/30 transition-colors text-sm"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Link>
        </div>
      )}
    </aside>
  );
};

export default AdminSidebar;
