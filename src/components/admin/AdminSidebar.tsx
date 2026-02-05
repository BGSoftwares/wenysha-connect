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
      "glass-dark text-white/90 flex flex-col transition-all duration-500 ease-in-out border-r border-white/5",
      collapsed ? "w-20" : "w-72"
    )}>
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left duration-700">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-accent to-gold-dark p-[2px] shadow-lg shadow-accent/20">
              <div className="h-full w-full rounded-[10px] bg-forest flex items-center justify-center border border-white/10">
                <img src={logo} alt="Wenyasha" className="h-7 w-7 object-contain" />
              </div>
            </div>
            <div>
              <h1 className="font-heading font-black text-lg tracking-wider text-white">WENYASHA</h1>
              <p className="text-[10px] text-accent font-bold uppercase tracking-[0.2em]">International</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2.5 rounded-xl hover:bg-white/5 transition-all active:scale-95 text-white/40 hover:text-white border border-transparent hover:border-white/10"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto scrollbar-none">
        {navigation.map((item) => (
          <div key={item.id} className="group/item">
            <button
              onClick={() => {
                if (item.children) {
                  toggleExpanded(item.id);
                } else {
                  setActiveNav(item.id);
                }
              }}
              className={cn(
                "w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-left transition-all duration-300 text-sm",
                isActive(item)
                  ? "bg-accent text-accent-foreground font-bold shadow-lg shadow-accent/25"
                  : "text-white/40 hover:text-white hover:bg-white/5 border border-transparent"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 flex-shrink-0 transition-transform duration-300 group-hover/item:scale-110",
                isActive(item) ? "text-accent-foreground" : "text-white/30"
              )} />
              {!collapsed && (
                <>
                  <span className="flex-1 tracking-wide">{item.name}</span>
                  {item.children && (
                    <div className={cn(
                      "transition-transform duration-300",
                      expandedItems.includes(item.id) ? "rotate-180" : ""
                    )}>
                      <ChevronDown className="h-4 w-4 opacity-30" />
                    </div>
                  )}
                </>
              )}
            </button>

            {/* Submenu */}
            {!collapsed && item.children && expandedItems.includes(item.id) && (
              <div className="mt-1 ml-4 pl-4 border-l border-white/5 space-y-1 animate-in slide-in-from-top-2 duration-300">
                {item.children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => setActiveNav(child.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-sm transition-all",
                      activeNav === child.id
                        ? "text-accent font-bold bg-accent/10"
                        : "text-white/30 hover:text-white/70 hover:bg-white/5"
                    )}
                  >
                    <div className={cn(
                      "h-1.5 w-1.5 rounded-full transition-all",
                      activeNav === child.id ? "bg-accent scale-110 shadow-[0_0_8px_rgba(var(--accent),0.5)]" : "bg-white/10"
                    )} />
                    {child.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* User & Sign Out */}
      <div className="p-6 border-t border-white/5 glass-dark mt-auto">
        {!collapsed ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-2 rounded-2xl bg-white/5 border border-white/5">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-accent to-gold-dark flex items-center justify-center shadow-lg shadow-accent/20">
                <User className="h-5 w-5 text-accent-foreground" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="font-bold text-sm truncate">Admin User</p>
                <p className="text-[10px] text-accent font-bold uppercase tracking-tight">System Authority</p>
              </div>
            </div>
            <Link
              to="/portal"
              className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-destructive/10 text-destructive font-bold hover:bg-destructive/20 transition-all border border-destructive/20 text-sm group"
            >
              <LogOut className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Sign Out
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-accent/20">
              <User className="h-5 w-5 text-accent-foreground" />
            </div>
            <Link to="/portal" className="p-3 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all border border-destructive/20">
              <LogOut className="h-5 w-5" />
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
};

export default AdminSidebar;
