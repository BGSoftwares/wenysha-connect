import {
  Users,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  CreditCard,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { useStudentBalances, usePayments, useInvoices } from "@/lib/hooks";
import { format } from "date-fns";

const AccountsOverview = () => {
  const { data: balances, isLoading: loadingBalances } = useStudentBalances();
  const { data: recentPayments, isLoading: loadingPayments } = usePayments();
  const { data: allInvoices, isLoading: loadingInvoices } = useInvoices();

  if (loadingBalances || loadingPayments || loadingInvoices) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate stats
  const totalStudents = balances?.length || 0;
  const totalOutstanding = balances?.reduce((acc, curr) => acc + curr.balance, 0) || 0;
  const totalPaid = balances?.reduce((acc, curr) => acc + curr.totalPaid, 0) || 0;
  const totalBilled = balances?.reduce((acc, curr) => acc + curr.totalBilled, 0) || 0;

  const statsCards = [
    {
      title: "Total Students Billed",
      value: totalStudents.toLocaleString(),
      change: "Current Year",
      trend: "up",
      icon: Users,
      color: "bg-primary"
    },
    {
      title: "Total Collections",
      value: `$${totalPaid.toLocaleString()}`,
      change: "All Time",
      trend: "up",
      icon: DollarSign,
      color: "bg-accent"
    },
    {
      title: "Outstanding Balances",
      value: `$${totalOutstanding.toLocaleString()}`,
      change: `${((totalOutstanding / (totalBilled || 1)) * 100).toFixed(1)}% of total`,
      trend: totalOutstanding > 0 ? "up" : "down",
      icon: AlertTriangle,
      color: "bg-destructive"
    },
    {
      title: "Total Billed",
      value: `$${totalBilled.toLocaleString()}`,
      change: "Term 1 & 2",
      trend: "up",
      icon: TrendingUp,
      color: "bg-primary"
    },
  ];

  // Defaulters (top 5 by balance)
  const defaulters = [...(balances || [])]
    .filter(b => b.balance > 0)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 5);

  // Recent transactions (from payments)
  const transactions = [...(recentPayments || [])].slice(0, 5);

  // Mock data for charts (staying for now as we don't have historical aggregation in hooks yet)
  const collectionsData = [
    { month: "Jan", amount: totalPaid * 0.1 },
    { month: "Feb", amount: totalPaid * 0.15 },
    { month: "Mar", amount: totalPaid * 0.2 },
    { month: "Apr", amount: totalPaid * 0.18 },
    { month: "May", amount: totalPaid * 0.12 },
    { month: "Jun", amount: totalPaid * 0.25 },
  ];

  const paymentMethodsData = [
    { name: "Bank Transfer", value: 60, color: "hsl(160, 50%, 20%)" },
    { name: "Cash", value: 25, color: "hsl(48, 95%, 50%)" },
    { name: "Mobile Money", value: 15, color: "hsl(200, 70%, 50%)" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <Card key={index} className="border-none shadow-elegant">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <h3 className="text-2xl font-bold text-foreground mt-1">{stat.value}</h3>
                  <div className={`flex items-center gap-1 mt-2 text-sm ${stat.trend === "up" && stat.color !== "bg-destructive" ? "text-primary" : "text-destructive"
                    }`}>
                    {stat.trend === "up" ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                    <span>{stat.change}</span>
                  </div>
                </div>
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <stat.icon className="h-6 w-6 text-primary-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Collections Trend */}
        <Card className="lg:col-span-2 border-none shadow-elegant">
          <CardHeader>
            <CardTitle className="text-lg">Collections Trend (Estimated)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={collectionsData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(160, 50%, 20%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(160, 50%, 20%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Collections']}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="hsl(160, 50%, 20%)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAmount)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="border-none shadow-elegant">
          <CardHeader>
            <CardTitle className="text-lg">Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethodsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {paymentMethodsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-1 gap-2 mt-4">
              {paymentMethodsData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.name}: {item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card className="border-none shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Transactions</CardTitle>
            <button className="text-sm text-primary hover:underline">View All</button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions.length > 0 ? (
                transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <CreditCard className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{tx.student_name}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(tx.date), "PPP")}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm text-primary">+${tx.amount}</p>
                      <p className="text-xs text-muted-foreground">{tx.method}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">No recent transactions</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Defaulters List */}
        <Card className="border-none shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Top Defaulters
            </CardTitle>
            <button className="text-sm text-primary hover:underline">View All</button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {defaulters.length > 0 ? (
                defaulters.map((defaulter) => (
                  <div key={defaulter.id} className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                    <div>
                      <p className="font-medium text-sm">{defaulter.student}</p>
                      <p className="text-xs text-muted-foreground">{defaulter.class_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm text-destructive">${defaulter.balance.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Outstanding</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">All accounts cleared</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccountsOverview;

export default AccountsOverview;
