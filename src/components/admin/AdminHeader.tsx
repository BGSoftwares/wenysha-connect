import { Bell, Search, MessageSquare, Settings, ChevronDown, Globe, Menu } from "lucide-react";

interface AdminHeaderProps {
  title: string;
  breadcrumb: string;
  onMenuClick?: () => void;
}

const AdminHeader = ({ title, breadcrumb, onMenuClick }: AdminHeaderProps) => {
  return (
    <header className="glass-dark border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-lg">
      <div className="flex items-center gap-4 flex-1">
        {onMenuClick && (
          <button onClick={onMenuClick} className="lg:hidden p-2 rounded-xl hover:bg-white/10 transition-colors">
            <Menu className="h-5 w-5 text-white" />
          </button>
        )}
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 group-focus-within:text-accent transition-colors" />
          <input
            type="text"
            placeholder="Search resources, students, or records..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all placeholder:text-white/20"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Language Selector */}
        <button className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors text-sm text-white/70 hover:text-white">
          <Globe className="h-4 w-4" />
          <span className="font-medium">EN</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </button>

        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button className="relative p-2.5 rounded-xl hover:bg-white/5 transition-colors group">
            <MessageSquare className="h-5 w-5 text-white/50 group-hover:text-white transition-colors" />
            <span className="absolute top-2 right-2 h-2 w-2 bg-accent rounded-full animate-pulse shadow-[0_0_8px_rgba(var(--accent),0.8)]" />
          </button>

          <button className="relative p-2.5 rounded-xl hover:bg-white/5 transition-colors group">
            <Bell className="h-5 w-5 text-white/50 group-hover:text-white transition-colors" />
            <span className="absolute top-2 right-2 h-2 w-2 bg-destructive rounded-full animate-pulse" />
          </button>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-4 pl-6 border-l border-white/10">
          <div className="flex flex-col items-end hidden md:flex">
            <p className="font-bold text-sm text-white">Administrator</p>
            <p className="text-[10px] text-accent font-bold uppercase tracking-widest">Wenyasha High</p>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-accent to-gold-dark p-[2px] shadow-lg shadow-accent/20">
            <div className="h-full w-full rounded-[14px] bg-forest flex items-center justify-center border border-white/10">
              <span className="font-black text-xs text-white">W.I</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
