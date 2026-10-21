import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle, CreditCard, Download, FileText, Loader2, Receipt, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import PaymentModal from "./PaymentModal";
import { exportFeeStatementPdf, type FeeStatementPdfData } from "@/lib/pdfExport";
import { useInvoices, usePayments, useStudentProfile, type Invoice } from "@/lib/hooks";
import { FINANCE_CURRENCIES, formatMoney, formatSchoolDate, type FinanceCurrency } from "@/lib/finance";

interface StudentFeesSectionProps {
  studentId: number;
}

const StudentFeesSection = ({ studentId }: StudentFeesSectionProps) => {
  const [activeTab, setActiveTab] = useState<"overview" | "invoices" | "transactions">("overview");
  const [isExporting, setIsExporting] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const { data: profile } = useStudentProfile();
  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices({ student: studentId });
  const { data: payments = [], isLoading: paymentsLoading } = usePayments({ student: studentId });

  const accountTotals = useMemo(() => FINANCE_CURRENCIES.map(({ value }) => {
    const currencyInvoices = invoices.filter((invoice) => invoice.currency === value);
    const billed = currencyInvoices.reduce((sum, invoice) => sum + Number(invoice.amount), 0);
    const paid = currencyInvoices.reduce((sum, invoice) => sum + Number(invoice.paid), 0);
    return { currency: value, billed, paid, balance: Math.max(0, billed - paid), invoiceCount: currencyInvoices.length };
  }).filter((summary) => summary.invoiceCount > 0), [invoices]);

  const outstandingInvoices = invoices.filter((invoice) => Number(invoice.amount) > Number(invoice.paid));
  const lastPayment = payments[0];

  const startPayment = (invoice: Invoice) => setSelectedInvoice(invoice);

  const handleDownloadStatement = async () => {
    setIsExporting(true);
    try {
      const firstSummary = accountTotals[0];
      const pdfData: FeeStatementPdfData = {
        studentName: profile?.name || invoices[0]?.student_name || "Student",
        studentId: profile?.student_id || "—",
        grade: profile?.class_name || invoices[0]?.class_name || "—",
        date: formatSchoolDate(new Date()),
        summary: {
          totalFees: firstSummary?.billed || 0,
          totalPaid: firstSummary?.paid || 0,
          balance: firstSummary?.balance || 0,
          arrears: 0,
        },
        currencyBreakdown: accountTotals.map((item) => ({ currency: item.currency, totalFees: item.billed, totalPaid: item.paid, balance: item.balance })),
        transactions: payments.map((payment) => ({
          date: formatSchoolDate(payment.date),
          description: `Fee payment · ${payment.invoice_no}`,
          amount: Number(payment.amount),
          type: "payment",
          reference: payment.reference || payment.receipt_no,
          currency: payment.currency,
        })),
      };
      await exportFeeStatementPdf(pdfData);
    } finally {
      setIsExporting(false);
    }
  };

  if (invoicesLoading || paymentsLoading) {
    return <div className="flex h-80 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const tabs = [
    { id: "overview" as const, label: "Overview", Icon: Wallet },
    { id: "invoices" as const, label: "Invoices", Icon: FileText },
    { id: "transactions" as const, label: "Payment history", Icon: CreditCard },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div><h2 className="text-xl font-bold">My fees and payments</h2><p className="text-sm text-muted-foreground">Current invoices, verified payments and downloadable statements.</p></div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => void handleDownloadStatement()} disabled={isExporting}>
            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            {isExporting ? "Preparing…" : "Download statement PDF"}
          </Button>
          {outstandingInvoices.length > 0 && <Button variant="gold" size="sm" onClick={() => startPayment(outstandingInvoices[0])}><Wallet className="mr-2 h-4 w-4" />Pay outstanding</Button>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {accountTotals.map((summary) => (
          <div key={summary.currency} className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Outstanding · {summary.currency === "ZWG" ? "ZiG" : "USD"}</p>
            <p className="mt-1 text-2xl font-bold">{formatMoney(summary.balance, summary.currency)}</p>
            <div className="mt-3 flex flex-wrap justify-between gap-2 text-sm text-muted-foreground">
              <span>Billed {formatMoney(summary.billed, summary.currency)}</span><span>Paid {formatMoney(summary.paid, summary.currency)}</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${summary.billed ? Math.min(100, summary.paid / summary.billed * 100) : 0}%` }} /></div>
          </div>
        ))}
        {accountTotals.length === 0 && <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground sm:col-span-2">There are no fee invoices linked to this account yet. Contact the school Accounts office if you expected an invoice.</div>}
      </div>

      {lastPayment && <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-gradient-to-r from-primary/10 to-accent/10 p-4">
        <div className="rounded-full bg-primary/15 p-3"><Receipt className="h-5 w-5 text-primary" /></div>
        <div className="min-w-0 flex-1"><p className="text-xs text-muted-foreground">Most recent recorded payment</p><p className="font-semibold">{formatMoney(lastPayment.amount, lastPayment.currency)} · {formatSchoolDate(lastPayment.date)}</p><p className="text-xs text-muted-foreground">{lastPayment.receipt_no} · {lastPayment.method}</p></div>
      </div>}

      <div className="flex gap-5 overflow-x-auto border-b border-border">
        {tabs.map(({ id, label, Icon }) => <button key={id} onClick={() => setActiveTab(id)} className={`flex shrink-0 items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium ${activeTab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}><Icon className="h-4 w-4" />{label}</button>)}
      </div>

      {activeTab === "overview" && (
        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3 font-semibold">Account summary by currency</h3>
            <div className="space-y-3">
              {accountTotals.map((summary) => <div key={summary.currency} className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-0"><span className="text-sm text-muted-foreground">{summary.currency === "ZWG" ? "Zimbabwe Gold (ZiG)" : "US Dollars"}</span><span className="text-right text-sm font-semibold">{formatMoney(summary.balance, summary.currency)} due</span></div>)}
              {!accountTotals.length && <p className="text-sm text-muted-foreground">No billed fees to summarise.</p>}
            </div>
          </section>
          <section className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3 font-semibold">Online payment options</h3>
            <div className="space-y-3 text-sm">
              <div className="flex gap-3 rounded-lg bg-secondary/30 p-3"><span className="text-lg">📱</span><div><p className="font-medium">EcoCash</p><p className="text-xs text-muted-foreground">Enter your Zimbabwe mobile number and approve the payment prompt.</p></div></div>
              <div className="flex gap-3 rounded-lg bg-secondary/30 p-3"><span className="text-lg">💳</span><div><p className="font-medium">ZimSwitch</p><p className="text-xs text-muted-foreground">Use the secure hosted checkout for a ZimSwitch enabled card.</p></div></div>
              <p className="text-xs text-muted-foreground">Online methods appear during checkout when the school merchant is enabled for that invoice currency. Cash and bank payments can still be recorded by Accounts.</p>
            </div>
          </section>
        </div>
      )}

      {activeTab === "invoices" && (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-secondary/50"><tr><th className="px-4 py-3 text-left">Invoice</th><th className="px-4 py-3 text-left">Term</th><th className="px-4 py-3 text-right">Billed</th><th className="px-4 py-3 text-right">Paid</th><th className="px-4 py-3 text-right">Balance</th><th className="px-4 py-3 text-center">Status</th><th className="px-4 py-3 text-right">Action</th></tr></thead>
            <tbody className="divide-y divide-border">
              {invoices.map((invoice) => {
                const due = Math.max(0, Number(invoice.amount) - Number(invoice.paid));
                return <tr key={invoice.id}>
                  <td className="px-4 py-3"><p className="font-medium">{invoice.invoice_no}</p><p className="text-xs text-muted-foreground">{formatSchoolDate(invoice.date)}</p></td>
                  <td className="px-4 py-3">{invoice.term}</td>
                  <td className="px-4 py-3 text-right">{formatMoney(invoice.amount, invoice.currency)}</td>
                  <td className="px-4 py-3 text-right text-emerald-700">{formatMoney(invoice.paid, invoice.currency)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatMoney(due, invoice.currency)}</td>
                  <td className="px-4 py-3 text-center"><span className={`rounded-full px-2 py-1 text-xs font-medium ${invoice.status === "paid" ? "bg-emerald-100 text-emerald-800" : invoice.status === "partial" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-700"}`}>{invoice.status}</span></td>
                  <td className="px-4 py-3 text-right">{due > 0 ? <Button size="sm" variant="outline" onClick={() => startPayment(invoice)}>Pay</Button> : <span className="text-xs text-emerald-700">Settled</span>}</td>
                </tr>;
              })}
              {!invoices.length && <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No invoices available.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "transactions" && (
        <div className="divide-y divide-border rounded-xl border border-border bg-card">
          {payments.map((payment) => <div key={payment.id} className="flex flex-wrap items-center gap-3 p-4">
            <div className="rounded-full bg-emerald-100 p-2"><CheckCircle className="h-4 w-4 text-emerald-700" /></div>
            <div className="min-w-0 flex-1"><p className="text-sm font-medium">{payment.method} · {payment.invoice_no}</p><p className="text-xs text-muted-foreground">{formatSchoolDate(payment.date)} · Receipt {payment.receipt_no}{payment.reference ? ` · ${payment.reference}` : ""}</p></div>
            <p className="font-semibold text-emerald-700">{formatMoney(payment.amount, payment.currency)}</p>
          </div>)}
          {!payments.length && <div className="p-10 text-center text-sm text-muted-foreground">No recorded payments yet.</div>}
        </div>
      )}

      {outstandingInvoices.length > 0 && activeTab === "overview" && <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><p>You have {outstandingInvoices.length} invoice{outstandingInvoices.length === 1 ? "" : "s"} with a remaining balance. Select an invoice to pay by EcoCash or ZimSwitch when online payments are enabled.</p></div>}

      <PaymentModal isOpen={Boolean(selectedInvoice)} onClose={() => setSelectedInvoice(null)} invoice={selectedInvoice} studentName={profile?.name || invoices[0]?.student_name || "Student"} />
    </div>
  );
};

export default StudentFeesSection;
