import { 
  Users, 
  DollarSign, 
  AlertTriangle, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  CreditCard
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

const statsCards = [
  { 
    title: "Total Students Billed", 
    value: "1,247", 
    change: "+12%",
    trend: "up",
    icon: Users,
    color: "bg-primary"
  },
  { 
    title: "Today's Collections", 
    value: "$12,450", 
    change: "+8%",
    trend: "up",
    icon: DollarSign,
    color: "bg-accent"
  },
  { 
    title: "Outstanding Balances", 
    value: "$45,230", 
    change: "-5%",
    trend: "down",
    icon: AlertTriangle,
    color: "bg-destructive"
  },
  { 
    title: "Term Collections", 
    value: "$234,500", 
    change: "+15%",
    trend: "up",
    icon: TrendingUp,
    color: "bg-primary"
  },
];

const collectionsData = [
  { month: "Jan", amount: 45000 },
  { month: "Feb", amount: 52000 },
  { month: "Mar", amount: 48000 },
  { month: "Apr", amount: 61000 },
  { month: "May", amount: 55000 },
  { month: "Jun", amount: 67000 },
];

const paymentMethodsData = [
  { name: "Cash", value: 35, color: "hsl(160, 50%, 20%)" },
  { name: "Bank Transfer", value: 40, color: "hsl(48, 95%, 50%)" },
  { name: "Mobile Money", value: 15, color: "hsl(200, 70%, 50%)" },
  { name: "POS", value: 10, color: "hsl(280, 60%, 50%)" },
];

const recentTransactions = [
  { id: 1, student: "John Mutasa", amount: 450, type: "Payment", date: "Today, 10:30 AM", status: "completed" },
  { id: 2, student: "Sarah Moyo", amount: 320, type: "Payment", date: "Today, 09:15 AM", status: "completed" },
  { id: 3, student: "Peter Ncube", amount: 150, type: "Partial", date: "Yesterday", status: "pending" },
  { id: 4, student: "Grace Dube", amount: 500, type: "Payment", date: "Yesterday", status: "completed" },
  { id: 5, student: "David Chuma", amount: 280, type: "Payment", date: "2 days ago", status: "completed" },
];

const defaulters = [
  { id: 1, student: "Mike Banda", class: "Form 4A", balance: 1200, days: 45 },
  { id: 2, student: "Lisa Phiri", class: "Form 3B", balance: 890, days: 30 },
  { id: 3, student: "James Tembo", class: "Form 2A", balance: 650, days: 25 },
  { id: 4, student: "Anna Mwale", class: "Form 4C", balance: 450, days: 20 },
];

const AccountsOverview = () => {
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
                  <div className={`flex items-center gap-1 mt-2 text-sm ${
                    stat.trend === "up" ? "text-primary" : "text-destructive"
                  }`}>
                    {stat.trend === "up" ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                    <span>{stat.change} from last term</span>
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
            <CardTitle className="text-lg">Collections Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={collectionsData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(160, 50%, 20%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(160, 50%, 20%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `$${value/1000}k`} />
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
            <div className="grid grid-cols-2 gap-2 mt-4">
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
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      tx.status === "completed" ? "bg-primary/10" : "bg-accent/10"
                    }`}>
                      <CreditCard className={`h-4 w-4 ${
                        tx.status === "completed" ? "text-primary" : "text-accent"
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{tx.student}</p>
                      <p className="text-xs text-muted-foreground">{tx.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm text-primary">+${tx.amount}</p>
                    <p className="text-xs text-muted-foreground">{tx.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Defaulters List */}
        <Card className="border-none shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Fee Defaulters
            </CardTitle>
            <button className="text-sm text-primary hover:underline">View All</button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {defaulters.map((defaulter) => (
                <div key={defaulter.id} className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                  <div>
                    <p className="font-medium text-sm">{defaulter.student}</p>
                    <p className="text-xs text-muted-foreground">{defaulter.class}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm text-destructive">${defaulter.balance}</p>
                    <p className="text-xs text-muted-foreground">{defaulter.days} days overdue</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccountsOverview;
