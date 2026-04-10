import { Link } from "react-router-dom";
import { 
  Home, 
  LogOut,
  User,
  ChevronDown,
  ChevronRight,
  Menu,
  Receipt,
  CreditCard,
  FileText,
  DollarSign,
  Percent,
  BarChart3,
  AlertTriangle,
  Wallet
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
    name: "Fee Structures", 
    icon: Receipt, 
    id: "fee-structures",
    children: [
      { name: "All Structures", id: "fee-structures" },
      { name: "Add Fee Structure", id: "add-fee" },
    ]
  },
  { 
    name: "Invoices", 
    icon: FileText, 
    id: "invoices",
    children: [
      { name: "All Invoices", id: "invoices" },
      { name: "Generate Invoice", id: "generate-invoice" },
    ]
  },
  { 
    name: "Payments", 
    icon: CreditCard, 
    id: "payments",
    children: [
      { name: "All Payments", id: "payments" },
      { name: "Record Payment", id: "record-payment" },
    ]
  },
  { name: "Balances & Statements", icon: DollarSign, id: "balances" },
  { 
    name: "Discounts & Adjustments", 
    icon: Percent, 
    id: "discounts",
    children: [
      { name: "Discounts", id: "discounts" },
      { name: "Arrears & Compliance", id: "arrears" },
    ]
  },
  { name: "Reports", icon: BarChart3, id: "reports" },
  { name: "Profile", icon: User, id: "profile" },
];

interface AccountsSidebarProps {
  activeNav: string;
  setActiveNav: (id: string) => void;
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
}

const AccountsSidebar = ({ activeNav, setActiveNav, collapsed, setCollapsed }: AccountsSidebarProps) => {
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
      "bg-[hsl(var(--forest-dark))] text-white/90 flex flex-col transition-all duration-300 border-r border-white/5",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <img src={logo} alt="Wenyasha" className="h-10 w-10 rounded-lg object-contain bg-accent" />
            <div>
              <h1 className="font-heading font-bold text-lg text-accent">ACCOUNTS</h1>
            </div>
          </div>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
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
              <Wallet className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="font-medium text-sm">Accounts Officer</p>
              <p className="text-xs text-[hsl(0,0%,60%)]">Bursar</p>
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

export default AccountsSidebar;
