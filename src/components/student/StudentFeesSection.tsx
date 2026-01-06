import { useState } from "react";
import { DollarSign, Download, FileText, AlertTriangle, CheckCircle, Clock, CreditCard, Receipt, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "payment" | "invoice" | "discount" | "penalty";
  reference: string;
  status: "completed" | "pending";
}

interface Invoice {
  id: string;
  term: string;
  amount: number;
  paid: number;
  balance: number;
  dueDate: string;
  status: "paid" | "partial" | "unpaid" | "overdue";
}

// Mock data
const mockFeesSummary = {
  totalFees: 1200,
  totalPaid: 850,
  balance: 350,
  arrears: 0,
  nextDueDate: "2024-04-15",
  lastPaymentDate: "2024-02-20",
  lastPaymentAmount: 300
};

const mockInvoices: Invoice[] = [
  { id: "INV-2024-001", term: "Term 1 2024", amount: 1200, paid: 850, balance: 350, dueDate: "2024-04-15", status: "partial" },
  { id: "INV-2023-003", term: "Term 3 2023", amount: 1150, paid: 1150, balance: 0, dueDate: "2023-12-01", status: "paid" },
  { id: "INV-2023-002", term: "Term 2 2023", amount: 1150, paid: 1150, balance: 0, dueDate: "2023-08-15", status: "paid" },
];

const mockTransactions: Transaction[] = [
  { id: "TXN-001", date: "2024-02-20", description: "Term 1 Fee Payment", amount: 300, type: "payment", reference: "CASH-2024-0234", status: "completed" },
  { id: "TXN-002", date: "2024-01-15", description: "Term 1 Fee Payment", amount: 400, type: "payment", reference: "BANK-2024-0156", status: "completed" },
  { id: "TXN-003", date: "2024-01-05", description: "Term 1 Invoice Generated", amount: 1200, type: "invoice", reference: "INV-2024-001", status: "completed" },
  { id: "TXN-004", date: "2024-01-02", description: "Sibling Discount Applied", amount: -50, type: "discount", reference: "DSC-2024-001", status: "completed" },
  { id: "TXN-005", date: "2024-01-10", description: "Term 1 Fee Payment", amount: 150, type: "payment", reference: "MOBILE-2024-0089", status: "completed" },
];

const StudentFeesSection = () => {
  const [activeTab, setActiveTab] = useState<"overview" | "invoices" | "transactions">("overview");
  const summary = mockFeesSummary;

  const getStatusBadge = (status: Invoice["status"]) => {
    const styles = {
      paid: "bg-green-100 text-green-700",
      partial: "bg-amber-100 text-amber-700",
      unpaid: "bg-red-100 text-red-700",
      overdue: "bg-red-100 text-red-700"
    };
    const labels = {
      paid: "Paid",
      partial: "Partial",
      unpaid: "Unpaid",
      overdue: "Overdue"
    };
    return <span className={`text-xs px-2 py-1 rounded-full font-medium ${styles[status]}`}>{labels[status]}</span>;
  };

  const getTransactionIcon = (type: Transaction["type"]) => {
    switch (type) {
      case "payment": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "invoice": return <FileText className="h-4 w-4 text-blue-600" />;
      case "discount": return <TrendingUp className="h-4 w-4 text-purple-600" />;
      case "penalty": return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">My Fees & Payments</h2>
          <p className="text-muted-foreground text-sm">View your fee status, invoices, and payment history</p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Download Statement
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">${summary.totalFees}</p>
              <p className="text-xs text-muted-foreground">Total Fees</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">${summary.totalPaid}</p>
              <p className="text-xs text-muted-foreground">Total Paid</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">${summary.balance}</p>
              <p className="text-xs text-muted-foreground">Balance Due</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg ${summary.arrears > 0 ? 'bg-red-100' : 'bg-green-100'} flex items-center justify-center`}>
              {summary.arrears > 0 ? (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
            </div>
            <div>
              <p className={`text-2xl font-bold ${summary.arrears > 0 ? 'text-red-600' : 'text-green-600'}`}>
                ${summary.arrears}
              </p>
              <p className="text-xs text-muted-foreground">Arrears</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Progress */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-foreground">Payment Progress - Term 1 2024</h3>
            <p className="text-sm text-muted-foreground">Next payment due: {new Date(summary.nextDueDate).toLocaleDateString()}</p>
          </div>
          <span className="text-lg font-bold text-primary">{Math.round((summary.totalPaid / summary.totalFees) * 100)}%</span>
        </div>
        <div className="h-3 bg-secondary rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
            style={{ width: `${(summary.totalPaid / summary.totalFees) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-sm">
          <span className="text-muted-foreground">Paid: ${summary.totalPaid}</span>
          <span className="text-muted-foreground">Remaining: ${summary.balance}</span>
        </div>
      </div>

      {/* Last Payment Card */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl border border-border p-5">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Receipt className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Last Payment</p>
            <p className="font-semibold text-foreground">${summary.lastPaymentAmount} on {new Date(summary.lastPaymentDate).toLocaleDateString()}</p>
          </div>
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            View Receipt
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-6">
          {[
            { id: "overview", label: "Overview", icon: DollarSign },
            { id: "invoices", label: "Invoices", icon: FileText },
            { id: "transactions", label: "Transaction History", icon: CreditCard }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Fee Breakdown */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold text-foreground mb-4">Fee Breakdown - Term 1 2024</h3>
            <div className="space-y-3">
              {[
                { item: "Tuition Fee", amount: 800 },
                { item: "Development Levy", amount: 100 },
                { item: "Examination Fee", amount: 50 },
                { item: "Sports & Activities", amount: 75 },
                { item: "ICT Levy", amount: 50 },
                { item: "Library Fee", amount: 25 },
                { item: "Stationery", amount: 100 }
              ].map((fee, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                  <span className="text-sm text-muted-foreground">{fee.item}</span>
                  <span className="text-sm font-medium text-foreground">${fee.amount}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="font-semibold text-foreground">Total</span>
                <span className="font-bold text-foreground">${summary.totalFees}</span>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold text-foreground mb-4">Accepted Payment Methods</h3>
            <div className="space-y-3">
              {[
                { method: "Bank Transfer", details: "Wenyasha School Account - CBZ Bank", icon: "🏦" },
                { method: "Cash", details: "Pay at School Accounts Office", icon: "💵" },
                { method: "Mobile Money", details: "EcoCash, OneMoney", icon: "📱" },
                { method: "POS", details: "Available at School Office", icon: "💳" }
              ].map((pm, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                  <span className="text-xl">{pm.icon}</span>
                  <div>
                    <p className="font-medium text-foreground text-sm">{pm.method}</p>
                    <p className="text-xs text-muted-foreground">{pm.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === "invoices" && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Invoice #</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Term</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-foreground">Amount</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-foreground">Paid</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-foreground">Balance</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Due Date</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-foreground">Status</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-foreground">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mockInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-secondary/30">
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{invoice.id}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{invoice.term}</td>
                  <td className="px-4 py-3 text-sm text-right text-foreground">${invoice.amount}</td>
                  <td className="px-4 py-3 text-sm text-right text-green-600">${invoice.paid}</td>
                  <td className="px-4 py-3 text-sm text-right text-amber-600">${invoice.balance}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-center">{getStatusBadge(invoice.status)}</td>
                  <td className="px-4 py-3 text-center">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === "transactions" && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="divide-y divide-border">
            {mockTransactions.map((txn) => (
              <div key={txn.id} className="flex items-center gap-4 p-4 hover:bg-secondary/30">
                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                  {getTransactionIcon(txn.type)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">{txn.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(txn.date).toLocaleDateString()} • Ref: {txn.reference}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${txn.type === 'payment' || txn.type === 'discount' ? 'text-green-600' : txn.type === 'penalty' ? 'text-red-600' : 'text-foreground'}`}>
                    {txn.type === 'payment' || txn.type === 'discount' ? '-' : '+'}${Math.abs(txn.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">{txn.type}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Arrears Warning (if applicable) */}
      {summary.arrears > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-800">Outstanding Arrears</h4>
            <p className="text-sm text-red-700">
              You have outstanding arrears of ${summary.arrears}. Please clear your balance to avoid restrictions on accessing academic services.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentFeesSection;
