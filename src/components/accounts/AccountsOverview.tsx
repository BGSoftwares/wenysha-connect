import { useMemo, useState } from "react";
import {
  Users,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  CreditCard,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useStudentBalances, usePayments, useInvoices } from "@/lib/hooks";
import { FINANCE_CURRENCIES, formatMoney, formatSchoolDate, type FinanceCurrency } from "@/lib/finance";

const METHOD_COLORS = ["hsl(160, 50%, 20%)", "hsl(48, 95%, 50%)", "hsl(200, 70%, 50%)", "hsl(270, 55%, 55%)", "hsl(340, 65%, 55%)"];

const AccountsOverview = ({ onNavigate }: { onNavigate?: (section: string) => void }) => {
  const { data: balances = [], isLoading: loadingBalances } = useStudentBalances();
  const { data: payments = [], isLoading: loadingPayments } = usePayments();
  const { data: invoices = [], isLoading: loadingInvoices } = useInvoices();
  const [currency, setCurrency] = useState<FinanceCurrency>("USD");

  const currencyPayments = useMemo(() => payments.filter((payment) => payment.currency === currency), [payments, currency]);
  const currencyInvoices = useMemo(() => invoices.filter((invoice) => invoice.currency === currency), [invoices, currency]);
  const currencyBalances = useMemo(() => balances.filter((balance) => balance.currency === currency), [balances, currency]);
  const totalStudents = new Set(invoices.map((invoice) => invoice.student)).size;
  const totalOutstanding = currencyBalances.reduce((sum, balance) => sum + Number(balance.balance), 0);
  const totalPaid = currencyPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const totalBilled = currencyInvoices.reduce((sum, invoice) => sum + Number(invoice.amount), 0);
  const outstandingRate = totalBilled > 0 ? ((totalOutstanding / totalBilled) * 100).toFixed(1) : "0.0";

  const collectionsData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, index) => {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
      const amount = currencyPayments
        .filter((payment) => {
          const date = new Date(`${payment.date}T00:00:00`);
          return date.getFullYear() === monthDate.getFullYear() && date.getMonth() === monthDate.getMonth();
        })
        .reduce((sum, payment) => sum + Number(payment.amount), 0);
      return { month: new Intl.DateTimeFormat("en-ZW", { month: "short", timeZone: "Africa/Harare" }).format(monthDate), amount };
    });
  }, [currencyPayments]);

  const paymentMethodsData = useMemo(() => {
    const totals = new Map<string, number>();
    currencyPayments.forEach((payment) => totals.set(payment.method, (totals.get(payment.method) || 0) + Number(payment.amount)));
    return [...totals.entries()]
      .map(([name, value], index) => ({ name, value, color: METHOD_COLORS[index % METHOD_COLORS.length] }))
      .sort((a, b) => b.value - a.value);
  }, [currencyPayments]);

  const defaulters = currencyBalances
    .filter((balance) => balance.balance > 0)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 5);
  const transactions = [...currencyPayments].slice(0, 5);
  const paymentMethodTotal = paymentMethodsData.reduce((sum, item) => sum + item.value, 0);

  if (loadingBalances || loadingPayments || loadingInvoices) {
    return <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const statsCards = [
    { title: "Students with Invoices", value: totalStudents.toLocaleString("en-ZW"), detail: "All current records", icon: Users, color: "bg-primary" },
    { title: "Collections", value: formatMoney(totalPaid, currency), detail: "Received payments", icon: DollarSign, color: "bg-accent" },
    { title: "Outstanding", value: formatMoney(totalOutstanding, currency), detail: `${outstandingRate}% of invoices`, icon: AlertTriangle, color: "bg-destructive" },
    { title: "Billed", value: formatMoney(totalBilled, currency), detail: "Selected currency", icon: TrendingUp, color: "bg-primary" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Finance at a glance</h2>
          <p className="text-sm text-muted-foreground">Live totals from invoices and recorded payments.</p>
        </div>
        <Select value={currency} onValueChange={(value) => setCurrency(value as FinanceCurrency)}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Choose currency" /></SelectTrigger>
          <SelectContent>{FINANCE_CURRENCIES.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <Card key={stat.title} className="border-none shadow-elegant">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <h3 className="mt-1 break-words text-2xl font-bold text-foreground">{stat.value}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{stat.detail}</p>
                </div>
                <div className={`rounded-xl p-3 ${stat.color}`}><stat.icon className="h-6 w-6 text-primary-foreground" /></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-none shadow-elegant lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Collections · last six months</CardTitle>
          </CardHeader>
          <CardContent>
            {currencyPayments.length === 0 ? <p className="py-16 text-center text-sm text-muted-foreground">No {currency} payments recorded yet.</p> : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={collectionsData}>
                    <defs>
                      <linearGradient id="collectionsAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(160, 50%, 20%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(160, 50%, 20%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => new Intl.NumberFormat("en-ZW", { notation: "compact", maximumFractionDigits: 1 }).format(value)} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                      formatter={(value: number) => [formatMoney(value, currency), "Collections"]}
                    />
                    <Area type="monotone" dataKey="amount" stroke="hsl(160, 50%, 20%)" strokeWidth={2} fillOpacity={1} fill="url(#collectionsAmount)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-elegant">
          <CardHeader><CardTitle className="text-lg">Payment methods</CardTitle></CardHeader>
          <CardContent>
            {paymentMethodsData.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No payments recorded for this currency.</p> : <>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={paymentMethodsData} cx="50%" cy="50%" innerRadius={46} outerRadius={70} paddingAngle={2} dataKey="value">
                      {paymentMethodsData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatMoney(value, currency)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {paymentMethodsData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between gap-2 text-xs">
                    <span className="flex items-center gap-2 text-muted-foreground"><i className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</span>
                    <span className="text-right font-medium text-foreground">{formatMoney(item.value, currency)} · {paymentMethodTotal ? `${((item.value / paymentMethodTotal) * 100).toFixed(0)}%` : "0%"}</span>
                  </div>
                ))}
              </div>
            </>}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-none shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent transactions</CardTitle>
            <button onClick={() => onNavigate?.("payments")} className="text-sm text-primary hover:underline">View all</button>
          </CardHeader>
          <CardContent className="space-y-3">
            {transactions.length > 0 ? transactions.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2"><CreditCard className="h-4 w-4 text-primary" /></div>
                  <div className="min-w-0"><p className="truncate text-sm font-medium">{payment.student_name}</p><p className="text-xs text-muted-foreground">{formatSchoolDate(payment.date)}</p></div>
                </div>
                <div className="shrink-0 text-right"><p className="text-sm font-semibold text-primary">{formatMoney(payment.amount, currency)}</p><p className="text-xs text-muted-foreground">{payment.method}</p></div>
              </div>
            )) : <div className="py-8 text-center text-sm text-muted-foreground">No payments recorded yet.</div>}
          </CardContent>
        </Card>

        <Card className="border-none shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg"><AlertTriangle className="h-5 w-5 text-destructive" />Largest balances</CardTitle>
            <button onClick={() => onNavigate?.("balances")} className="text-sm text-primary hover:underline">View all</button>
          </CardHeader>
          <CardContent className="space-y-3">
            {defaulters.length > 0 ? defaulters.map((balance) => (
              <div key={`${balance.id}-${balance.currency}`} className="flex items-center justify-between gap-3 rounded-lg border border-destructive/10 bg-destructive/5 p-3">
                <div className="min-w-0"><p className="truncate text-sm font-medium">{balance.student}</p><p className="text-xs text-muted-foreground">{balance.class_name}</p></div>
                <div className="shrink-0 text-right"><p className="text-sm font-semibold text-destructive">{formatMoney(balance.balance, currency)}</p><p className="text-xs text-muted-foreground">Outstanding</p></div>
              </div>
            )) : <div className="py-8 text-center text-sm text-muted-foreground">No outstanding {currency} balances.</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccountsOverview;
