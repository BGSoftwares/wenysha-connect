import { Bell, Search, MessageSquare, Settings, ChevronDown, Globe } from "lucide-react";

interface AdminHeaderProps {
  title: string;
  breadcrumb: string;
}

const AdminHeader = ({ title, breadcrumb }: AdminHeaderProps) => {
  return (
    <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input 
            type="text"
            placeholder="Find Something..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Language Selector */}
        <button className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-sm">
          <Globe className="h-4 w-4" />
          <span>EN</span>
          <ChevronDown className="h-3 w-3" />
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-[hsl(200,85%,55%)] text-[hsl(0,0%,100%)] text-xs rounded-full flex items-center justify-center font-medium">
            3
          </span>
        </button>

        <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-accent text-accent-foreground text-xs rounded-full flex items-center justify-center font-medium">
            5
          </span>
        </button>

        {/* User */}
        <div className="flex items-center gap-3 pl-4 border-l border-border">
          <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center">
            <span className="font-semibold text-accent-foreground">SA</span>
          </div>
          <div className="hidden md:block">
            <p className="font-medium text-sm text-foreground">Stevne Zone</p>
            <p className="text-xs text-muted-foreground">Admin</p>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
