import { useState } from "react";
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
  Percent
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
  Line
} from "recharts";

const dailyCollections = [
  { day: "Mon", amount: 2500 },
  { day: "Tue", amount: 3200 },
  { day: "Wed", amount: 2800 },
  { day: "Thu", amount: 4100 },
  { day: "Fri", amount: 3800 },
];

const termCollections = [
  { term: "Term 1", expected: 150000, collected: 135000 },
  { term: "Term 2", expected: 145000, collected: 128000 },
  { term: "Term 3", expected: 140000, collected: 95000 },
];

const paymentMethods = [
  { name: "Cash", value: 35000, color: "hsl(160, 50%, 20%)" },
  { name: "Bank Transfer", value: 45000, color: "hsl(48, 95%, 50%)" },
  { name: "Mobile Money", value: 18000, color: "hsl(200, 70%, 50%)" },
  { name: "POS", value: 12000, color: "hsl(280, 60%, 50%)" },
];

const discountsData = [
  { month: "Jan", sibling: 1200, scholarship: 3000, bursary: 1500 },
  { month: "Feb", sibling: 1400, scholarship: 3200, bursary: 1800 },
  { month: "Mar", sibling: 1100, scholarship: 2800, bursary: 2000 },
  { month: "Apr", sibling: 1300, scholarship: 3100, bursary: 1700 },
];

const reportTypes = [
  { id: "daily", name: "Daily Collections Report", icon: DollarSign, description: "Summary of today's fee collections" },
  { id: "term", name: "Term Collections Report", icon: TrendingUp, description: "Term-wise collection analysis" },
  { id: "outstanding", name: "Outstanding Balances Report", icon: Users, description: "List of all pending fees" },
  { id: "discounts", name: "Discounts & Bursaries Report", icon: Percent, description: "Summary of all discounts applied" },
  { id: "expected", name: "Expected vs Collected Report", icon: BarChart3, description: "Comparison of expected and actual collections" },
];

const ReportsSection = () => {
  const [selectedTerm, setSelectedTerm] = useState("term1");
  const [selectedClass, setSelectedClass] = useState("all");

  const totalCollected = paymentMethods.reduce((sum, m) => sum + m.value, 0);

  return (
    <div className="space-y-6">
      {/* Report Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTypes.map((report) => (
          <Card key={report.id} className="border-none shadow-elegant hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <report.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-medium text-foreground">{report.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="gap-1">
                  <FileText className="h-3 w-3" />
                  PDF
                </Button>
                <Button variant="outline" size="sm" className="gap-1">
                  <FileSpreadsheet className="h-3 w-3" />
                  Excel
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-none shadow-elegant">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <span className="text-sm font-medium">Filter Reports:</span>
            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Select term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="term1">Term 1 2024</SelectItem>
                <SelectItem value="term2">Term 2 2024</SelectItem>
                <SelectItem value="term3">Term 3 2024</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                <SelectItem value="form1">Form 1</SelectItem>
                <SelectItem value="form2">Form 2</SelectItem>
                <SelectItem value="form3">Form 3</SelectItem>
                <SelectItem value="form4">Form 4</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="gold" className="ml-auto gap-2">
              <Download className="h-4 w-4" />
              Export All Reports
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Daily Collections */}
        <Card className="border-none shadow-elegant">
          <CardHeader>
            <CardTitle className="text-lg">Daily Collections (This Week)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyCollections}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Collections']}
                  />
                  <Bar dataKey="amount" fill="hsl(160, 50%, 20%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="border-none shadow-elegant">
          <CardHeader>
            <CardTitle className="text-lg">Collections by Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethods}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {paymentMethods.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {paymentMethods.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium">${(item.value/1000).toFixed(1)}k</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expected vs Collected */}
      <Card className="border-none shadow-elegant">
        <CardHeader>
          <CardTitle className="text-lg">Expected vs Collected Fees</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={termCollections}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="term" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                />
                <Bar dataKey="expected" fill="hsl(var(--muted))" name="Expected" radius={[4, 4, 0, 0]} />
                <Bar dataKey="collected" fill="hsl(160, 50%, 20%)" name="Collected" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-muted" />
              <span className="text-sm text-muted-foreground">Expected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-primary" />
              <span className="text-sm text-muted-foreground">Collected</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Discounts Trend */}
      <Card className="border-none shadow-elegant">
        <CardHeader>
          <CardTitle className="text-lg">Discounts & Bursaries Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={discountsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line type="monotone" dataKey="sibling" stroke="hsl(160, 50%, 20%)" strokeWidth={2} name="Sibling Discounts" />
                <Line type="monotone" dataKey="scholarship" stroke="hsl(48, 95%, 50%)" strokeWidth={2} name="Scholarships" />
                <Line type="monotone" dataKey="bursary" stroke="hsl(200, 70%, 50%)" strokeWidth={2} name="Bursaries" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsSection;
