import { Search, Bell, Mail, Globe, User, Menu } from "lucide-react";

interface AccountsHeaderProps {
  title: string;
  breadcrumb: string;
  onMenuClick?: () => void;
}

const AccountsHeader = ({ title, breadcrumb, onMenuClick }: AccountsHeaderProps) => {
  return (
    <header className="sticky top-0 z-30 bg-card border-b border-border px-6 py-4">
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
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 w-64 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Language */}
          <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">EN</span>
          </button>

          {/* Messages */}
          <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
              3
            </span>
          </button>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-accent text-[10px] font-bold text-accent-foreground flex items-center justify-center">
              5
            </span>
          </button>

          {/* User */}
          <div className="flex items-center gap-3 pl-4 border-l border-border">
            <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center">
              <User className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-foreground">John Doe</p>
              <p className="text-xs text-muted-foreground">Accounts Officer</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AccountsHeader;
