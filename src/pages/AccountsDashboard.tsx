import DashboardExtras from "@/components/dashboard/DashboardExtras";
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
import OnlinePaymentsSection from "@/components/accounts/OnlinePaymentsSection";
import LearningMaterialsSection from "@/components/dashboard/LearningMaterialsSection";
import CommunicationSection from "@/components/dashboard/CommunicationSection";
import { useClasses, useStudents } from "@/lib/hooks";

const AccountsDashboard = () => {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { data: classes = [] } = useClasses();
  const { data: students = [] } = useStudents();

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
      "online-payments": "Online Payments",
      discounts: "Discounts & Adjustments",
      arrears: "Arrears & Compliance",
      reports: "Reports & Analytics",
      profile: "My Profile",
      "financial-documents": "Financial Documents & Notes",
      communications: "Communications",
    };
    return titles[activeNav] || "Dashboard";
  };

  const renderContent = () => {
    switch (activeNav) {
      case "dashboard":
        return <div className="space-y-6"><DashboardExtras role="Accounts" actions={[{ label: "Record payment", onClick: () => setActiveNav("record-payment") }, { label: "Online payments", onClick: () => setActiveNav("online-payments") }, { label: "Invoices", onClick: () => setActiveNav("invoices") }, { label: "Communications", onClick: () => setActiveNav("communications") }]} /><AccountsOverview onNavigate={setActiveNav} /></div>;
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
      case "online-payments":
        return <OnlinePaymentsSection />;
      case "discounts":
      case "arrears":
        return <DiscountsSection activeSubNav={activeNav} />;
      case "reports":
        return <ReportsSection />;
      case "profile":
        return <AccountsProfileSection />;
      case "communications":
        return <CommunicationSection role="accounts" classes={classes} students={students} />;
      case "financial-documents":
        return (
          <LearningMaterialsSection
            classes={[
              { id: 101, name: "Fee Schedules" },
              { id: 102, name: "Financial Policies" },
              { id: 103, name: "Audit Reports" },
              { id: 104, name: "Budgets & Planning" },
            ]}
            subjects={[
              { id: 201, name: "Accounts & Billing" },
              { id: 202, name: "Bank & Receipts" },
              { id: 203, name: "Compliance & Tax" },
            ]}
            uploadedBy="Accounts Officer"
            visibility="staff"
            emptyHint="No financial documents or notes uploaded yet. Choose a fee schedule, spreadsheet, receipt scan, or policy document from your device."
          />
        );
      default:
        return <AccountsOverview onNavigate={setActiveNav} />;
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-background dashboard-3d portal-dashboard">
      <AccountsSidebar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />
      
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <AccountsHeader 
          title={getPageTitle()} 
          breadcrumb={`Dashboard > ${getPageTitle()}`}
          onMenuClick={() => setMobileSidebarOpen(true)}
        />
        
        <main className="mx-auto flex-1 w-full max-w-[1600px] overflow-auto p-4 sm:p-6 lg:p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AccountsDashboard;
