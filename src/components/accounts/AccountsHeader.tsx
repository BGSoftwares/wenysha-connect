import { User, Menu, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { getStoredUser, signOutAndLeave } from "@/lib/api";
import GetAppButton from "@/components/GetAppButton";

interface AccountsHeaderProps {
  title: string;
  breadcrumb: string;
  onMenuClick?: () => void;
}

const AccountsHeader = ({ title, breadcrumb, onMenuClick }: AccountsHeaderProps) => {
  const user = getStoredUser();
  const displayName = user?.full_name || user?.username || "Accounts";
  return (
    <header className="portal-header sticky top-0 z-30 bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors">
              <Menu className="h-5 w-5 text-foreground" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-heading font-bold text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground">{breadcrumb}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <GetAppButton className="rounded-lg border-border bg-background text-foreground hover:bg-muted" />
          <Link to="/portal" onClick={signOutAndLeave} className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-bold text-destructive hover:bg-destructive/20">
            <LogOut className="h-4 w-4" />Sign Out
          </Link>
          {/* User */}
          <div className="flex items-center gap-3 pl-4 border-l border-border">
            <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center">
              <User className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-foreground">{displayName}</p>
              <p className="text-xs text-muted-foreground">Accounts Officer</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AccountsHeader;
