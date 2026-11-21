import { Menu, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { getStoredUser, signOutAndLeave } from "@/lib/api";
import GetAppButton from "@/components/GetAppButton";

interface AdminHeaderProps {
  title: string;
  breadcrumb: string;
  onMenuClick?: () => void;
}

const AdminHeader = ({ title, breadcrumb, onMenuClick }: AdminHeaderProps) => {
  const user = getStoredUser();
  const displayName = user?.full_name || user?.username || "Administrator";
  const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "AG";
  return (
    <header className="portal-header bg-[hsl(var(--forest-dark))] border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-lg">
      <div className="flex items-center gap-4 flex-1">
        {onMenuClick && (
          <button onClick={onMenuClick} aria-label="Open menu" className="lg:hidden p-2 rounded-xl hover:bg-white/10 transition-colors">
            <Menu className="h-5 w-5 text-white" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-xl font-heading font-bold text-white">{title}</h1>
          <p className="truncate text-sm text-white/70">{breadcrumb}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-6">
        <GetAppButton className="border-white/20 bg-white/10 text-white hover:bg-white/20" />
        <Link to="/portal" onClick={signOutAndLeave} className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-bold text-destructive transition-colors hover:bg-destructive/20">
          <LogOut className="h-4 w-4" />
          Sign Out
        </Link>
        {/* User Profile */}
        <div className="flex items-center gap-4 pl-6 border-l border-white/10">
          <div className="flex flex-col items-end hidden md:flex">
            <p className="font-bold text-sm text-white">{displayName}</p>
            <p className="text-[10px] text-pink-300 font-bold uppercase tracking-widest">Able God College</p>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-accent to-gold-dark p-[2px] shadow-lg shadow-accent/20">
            <div className="h-full w-full rounded-[14px] bg-forest flex items-center justify-center border border-white/10">
              <span className="font-black text-xs text-white">{initials}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
