import { useState } from "react";
import AccountsSidebar from "@/components/accounts/AccountsSidebar";
import AccountsHeader from "@/components/accounts/AccountsHeader";
import AccountsOverview from "@/components/accounts/AccountsOverview";
import FeeStructuresSection from "@/components/accounts/FeeStructuresSection";
import InvoicesSection from "@/components/accounts/InvoicesSection";
import PaymentsSection from "@/components/accounts/PaymentsSection";
import BalancesSection from "@/components/accounts/BalancesSection";
import DiscountsSection from "@/components/accounts/DiscountsSection";
import ReportsSection from "@/components/accounts/ReportsSection";
import AccountsProfileSection from "@/components/accounts/AccountsProfileSection";

const AccountsDashboard = () => {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const getPageTitle = () => {
    const titles: Record<string, string> = {
      dashboard: "Dashboard",
      "fee-structures": "Fee Structures",
      "add-fee": "Add Fee Structure",
      invoices: "Invoices",
      "generate-invoice": "Generate Invoice",
      payments: "Payments",
      "record-payment": "Record Payment",
      balances: "Balances & Statements",
      discounts: "Discounts & Adjustments",
      arrears: "Arrears & Compliance",
      reports: "Reports & Analytics",
      profile: "My Profile",
    };
    return titles[activeNav] || "Dashboard";
  };

  const renderContent = () => {
    switch (activeNav) {
      case "dashboard":
        return <AccountsOverview />;
      case "fee-structures":
      case "add-fee":
        return <FeeStructuresSection activeSubNav={activeNav} />;
      case "invoices":
      case "generate-invoice":
        return <InvoicesSection activeSubNav={activeNav} />;
      case "payments":
      case "record-payment":
        return <PaymentsSection activeSubNav={activeNav} />;
      case "balances":
        return <BalancesSection />;
      case "discounts":
      case "arrears":
        return <DiscountsSection activeSubNav={activeNav} />;
      case "reports":
        return <ReportsSection />;
      case "profile":
        return <AccountsProfileSection />;
      default:
        return <AccountsOverview />;
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AccountsSidebar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />
      
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <AccountsHeader 
          title={getPageTitle()} 
          breadcrumb={`Dashboard > ${getPageTitle()}`} 
        />
        
        <main className="flex-1 p-6 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AccountsDashboard;
