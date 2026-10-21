import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  DollarSign,
  Users,
  Percent,
  Calendar,
  Loader2,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts";
import { usePayments, useInvoices, useDiscounts } from "@/lib/hooks";
import { format, startOfWeek, addDays, isSameDay, parseISO } from "date-fns";
import { FINANCE_CURRENCIES, formatMoney, formatSchoolDate, type FinanceCurrency } from "@/lib/finance";

const ReportsSection = () => {
  const { data: payments, isLoading: paymentsLoading } = usePayments();
  const { data: invoices, isLoading: invoicesLoading } = useInvoices();
  const { data: discounts } = useDiscounts();

  const [selectedTerm, setSelectedTerm] = useState("all");
  const [selectedCurrency, setSelectedCurrency] = useState<FinanceCurrency>("USD");

  const selectedInvoices = useMemo(() => (invoices || []).filter((invoice) =>
    (selectedTerm === "all" || invoice.term === selectedTerm) && invoice.currency === selectedCurrency
  ), [invoices, selectedTerm, selectedCurrency]);
  const selectedInvoiceIds = useMemo(() => new Set(selectedInvoices.map((invoice) => invoice.id)), [selectedInvoices]);
  const selectedPayments = useMemo(() => (payments || []).filter((payment) =>
    selectedInvoiceIds.has(payment.invoice) && payment.currency === selectedCurrency
  ), [payments, selectedInvoiceIds, selectedCurrency]);

  const dailyCollections = useMemo(() => {
    const today = new Date();
    const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 });

    return Array.from({ length: 5 }).map((_, i) => {
      const day = addDays(startOfCurrentWeek, i);
      const dayName = format(day, "EEE");
      const dayAmount = selectedPayments.filter(p => isSameDay(parseISO(p.date), day))
        .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0) || 0;

      return { day: dayName, amount: dayAmount };
    });
  }, [selectedPayments]);

  const paymentMethodStats = useMemo(() => {
    if (!selectedPayments.length) return [];
    const methods: Record<string, number> = {};
    selectedPayments.forEach(p => {
      methods[p.method] = (methods[p.method] || 0) + parseFloat(p.amount.toString());
    });

    const colors = ["#14295f", "#db2777", "#8a3e78", "#526aa5", "#f18ab8"];
    return Object.entries(methods).map(([name, value], i) => ({
      name,
      value,
      color: colors[i % colors.length]
    }));
  }, [selectedPayments]);

  const totalRevenue = useMemo(() => {
    return selectedPayments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
  }, [selectedPayments]);

  const totalOutstanding = useMemo(() => {
    return selectedInvoices.reduce((sum, invoice) => sum + Number(invoice.amount) - Number(invoice.paid), 0);
  }, [selectedInvoices]);

  const totalBilled = selectedInvoices.reduce((sum, invoice) => sum + Number(invoice.amount), 0);
  const recoveryRate = totalBilled > 0 ? Math.min(100, (totalRevenue / totalBilled) * 100) : 0;

  const reportTypes = [
    { id: "daily", name: "Settlement Audit", icon: DollarSign, description: "Detailed summary of recent collections" },
    { id: "term", name: "Cyclical Analysis", icon: TrendingUp, description: "Term-wise revenue and trend projection" },
    { id: "outstanding", name: "Risk Portfolio", icon: Users, description: "Master ledger of all pending balances" },
    { id: "discounts", name: "Subsidy Audit", icon: Percent, description: "Waivers and institutional scholarships" },
  ];

  const buildReportRows = (reportId: string): (string | number)[][] => {
    if (reportId === "daily") {
      return [
        ["Date", "Student", "Invoice", "Method", "Receipt reference", "Amount", "Currency"],
        ...selectedPayments.map((payment) => [
          payment.date, payment.student_name, payment.invoice_no, payment.method,
          payment.reference || "", payment.amount, payment.currency,
        ]),
      ];
    }
    if (reportId === "outstanding") {
      return [
        ["Student", "Student ID", "Class", "Invoice", "Term", "Amount billed", "Paid", "Balance", "Currency"],
        ...selectedInvoices.filter((invoice) => Number(invoice.amount) > Number(invoice.paid)).map((invoice) => [
          invoice.student_name, invoice.student_id_display || "", invoice.class_name, invoice.invoice_no,
          invoice.term, invoice.amount, invoice.paid,
          (Number(invoice.amount) - Number(invoice.paid)).toFixed(2), invoice.currency,
        ]),
      ];
    }
    if (reportId === "discounts") {
      return [
        ["Date", "Student", "Adjustment", "Reason", "Status", "Amount", "Currency"],
        ...(discounts || []).filter((discount) => discount.currency === selectedCurrency).map((discount) => [
          discount.date, discount.student_name, discount.discount_type, discount.reason,
          discount.status, discount.amount, discount.currency,
        ]),
      ];
    }
    return [
      ["Invoice", "Student", "Class", "Term", "Date", "Billed", "Paid", "Balance", "Currency"],
      ...selectedInvoices.map((invoice) => [
        invoice.invoice_no, invoice.student_name, invoice.class_name, invoice.term, invoice.date,
        invoice.amount, invoice.paid, (Number(invoice.amount) - Number(invoice.paid)).toFixed(2), invoice.currency,
      ]),
    ];
  };

  const exportReport = async (reportId: string, fileType: "pdf" | "csv") => {
    const rows = buildReportRows(reportId);
    const fileBase = `able-god-${reportId}-${new Date().toISOString().slice(0, 10)}`;
    if (fileType === "csv") {
      const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\r\n");
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${fileBase}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      return;
    }
    const { default: jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    pdf.setFontSize(16);
    pdf.text(`Able God College · ${reportTypes.find((report) => report.id === reportId)?.name || "Finance report"}`, 14, 16);
    pdf.setFontSize(9);
    pdf.text(`${selectedTerm === "all" ? "All terms" : selectedTerm} · ${selectedCurrency} · ${formatSchoolDate(new Date())}`, 14, 23);
    let y = 32;
    rows.forEach((row, rowIndex) => {
      const line = row.map(String).join("   |   ");
      const wrapped = pdf.splitTextToSize(line, 270);
      if (y + wrapped.length * 5 > 195) {
        pdf.addPage();
        y = 16;
      }
      if (rowIndex === 0) pdf.setFont("helvetica", "bold");
      else pdf.setFont("helvetica", "normal");
      pdf.text(wrapped, 14, y);
      y += wrapped.length * 5 + 2;
    });
    pdf.save(`${fileBase}.pdf`);
  };

  if (paymentsLoading || invoicesLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col mb-4">
        <h2 className="text-3xl font-black tracking-tight text-foreground">Intelligence Center</h2>
        <p className="text-muted-foreground font-medium">Institutional financial analytics and automated reporting</p>
      </div>

      {/* Report Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportTypes.map((report) => (
          <Card key={report.id} className="border-none shadow-elegant bg-white hover:bg-muted/5 transition-all group cursor-pointer border-b-4 border-b-transparent hover:border-b-accent">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                    <report.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-black text-foreground tracking-tight">{report.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">{report.description}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button variant="outline" size="sm" onClick={() => void exportReport(report.id, "pdf")} className="flex-1 h-10 rounded-lg border-muted hover:bg-accent/5 hover:text-accent font-bold text-[10px] tracking-widest uppercase">
                  <FileText className="h-3 w-3 mr-2" />
                  PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => void exportReport(report.id, "csv")} className="flex-1 h-10 rounded-lg border-muted hover:bg-primary/5 hover:text-primary font-bold text-[10px] tracking-widest uppercase">
                  <FileSpreadsheet className="h-3 w-3 mr-2" />
                  XLS
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Global Filter Bar */}
      <Card className="border-none shadow-elegant bg-primary overflow-hidden relative">
        <Sparkles className="absolute -right-8 -top-8 h-32 w-32 text-white/10" />
        <CardContent className="p-6 relative z-10">
          <div className="flex flex-wrap gap-6 items-center">
            <div className="p-3 bg-white/10 rounded-xl">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-white font-black">Audit Parameters</h4>
              <p className="text-white/70 text-sm font-medium">Select the fiscal cycle for comprehensive analysis</p>
            </div>
            <div className="flex items-center gap-4">
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger className="w-[220px] h-12 rounded-xl bg-white border-none font-bold text-primary">
                  <SelectValue placeholder="Fiscal Cycle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Universal Ledger</SelectItem>
                  <SelectItem value="Term 1">Term 1</SelectItem>
                  <SelectItem value="Term 2">Term 2</SelectItem>
                  <SelectItem value="Term 3">Term 3</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedCurrency} onValueChange={(value) => setSelectedCurrency(value as FinanceCurrency)}>
                <SelectTrigger className="w-[220px] h-12 rounded-xl bg-white border-none font-bold text-primary">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  {FINANCE_CURRENCIES.map((currency) => <SelectItem key={currency.value} value={currency.value}>{currency.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="gold" onClick={() => void exportReport("term", "csv")} className="h-12 px-8 rounded-xl shadow-lg shadow-black/20 gap-2">
                <Download className="h-4 w-4" />
                Archive Global Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Charts Matrix */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Daily Performance Column */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-none shadow-elegant overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-muted/5 p-6">
              <div>
                <CardTitle className="text-xl font-black text-foreground">Weekly Inflow Velocity</CardTitle>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Rolling fee collection trends</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-emerald-600">{formatMoney(totalRevenue, selectedCurrency)}</span>
                <p className="text-[10px] font-black text-muted-foreground uppercase opacity-50">{selectedTerm === "all" ? "All terms" : selectedTerm} collections</p>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyCollections}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontWeight: 700, fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => formatMoney(value, selectedCurrency)}
                      tick={{ fill: '#64748b', fontWeight: 700, fontSize: 12 }}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(6, 78, 59, 0.05)' }}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: 'none',
                        borderRadius: '16px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                      }}
                      itemStyle={{ color: '#14295f', fontWeight: 900 }}
                    />
                    <Bar dataKey="amount" fill="#14295f" radius={[12, 12, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-none shadow-elegant bg-emerald-50/50 border border-emerald-100/50">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1">Recovery Rate</p>
                  <h4 className="text-3xl font-black text-emerald-900 tracking-tighter">{recoveryRate.toFixed(1)}%</h4>
                </div>
                <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <ArrowUpRight className="h-6 w-6 text-emerald-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-elegant bg-amber-50/50 border border-amber-100/50">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1">Portfolio Risk</p>
                  <h4 className="text-2xl font-black text-amber-900 tracking-tighter">{formatMoney(totalOutstanding, selectedCurrency)}</h4>
                </div>
                <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6 text-amber-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Channels Composition Column */}
        <div className="lg:col-span-4 h-full">
          <Card className="border-none shadow-elegant h-full flex flex-col">
            <CardHeader className="p-6">
              <CardTitle className="text-xl font-black text-foreground">Revenue Channels</CardTitle>
              <p className="text-xs text-muted-foreground font-medium">Composition by payment modality</p>
            </CardHeader>
            <CardContent className="p-6 flex-1 flex flex-col">
              <div className="h-[250px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentMethodStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      {paymentMethodStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <PieChartIcon className="h-8 w-8 text-primary/20 mb-1" />
                  <span className="text-[10px] font-black text-muted-foreground uppercase">Modality</span>
                </div>
              </div>
              <div className="space-y-4 mt-8">
                {paymentMethodStats.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm font-bold text-foreground">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-primary">{formatMoney(item.value, selectedCurrency)}</span>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{((item.value / totalRevenue) * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
                {paymentMethodStats.length === 0 && <p className="text-sm text-center text-muted-foreground">No recorded payments for this term and currency.</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReportsSection;
