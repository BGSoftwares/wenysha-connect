import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Search, Percent, AlertTriangle, Ban, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Discount {
  id: number;
  student: string;
  studentId: string;
  type: string;
  amount: number;
  percentage: number;
  reason: string;
  status: "approved" | "pending" | "rejected";
  approvedBy: string;
  date: string;
}

interface Defaulter {
  id: number;
  student: string;
  studentId: string;
  class: string;
  balance: number;
  daysOverdue: number;
  restricted: boolean;
}

const mockDiscounts: Discount[] = [
  { id: 1, student: "John Mutasa", studentId: "STU001", type: "Sibling Discount", amount: 120, percentage: 10, reason: "Two siblings enrolled", status: "approved", approvedBy: "Admin", date: "2024-01-10" },
  { id: 2, student: "Sarah Moyo", studentId: "STU002", type: "Scholarship", amount: 600, percentage: 50, reason: "Academic excellence", status: "approved", approvedBy: "Admin", date: "2024-01-08" },
  { id: 3, student: "Peter Ncube", studentId: "STU003", type: "Bursary", amount: 300, percentage: 25, reason: "Financial hardship", status: "pending", approvedBy: "-", date: "2024-01-20" },
  { id: 4, student: "Grace Dube", studentId: "STU004", type: "Manual Waiver", amount: 100, percentage: 0, reason: "Late registration waiver", status: "approved", approvedBy: "Admin", date: "2024-01-05" },
];

const mockDefaulters: Defaulter[] = [
  { id: 1, student: "Mike Banda", studentId: "STU010", class: "Form 4A", balance: 1200, daysOverdue: 45, restricted: true },
  { id: 2, student: "Lisa Phiri", studentId: "STU011", class: "Form 3B", balance: 890, daysOverdue: 30, restricted: false },
  { id: 3, student: "James Tembo", studentId: "STU012", class: "Form 2A", balance: 650, daysOverdue: 25, restricted: false },
  { id: 4, student: "Anna Mwale", studentId: "STU013", class: "Form 4C", balance: 450, daysOverdue: 20, restricted: false },
  { id: 5, student: "Tom Nyathi", studentId: "STU014", class: "Form 1B", balance: 1500, daysOverdue: 60, restricted: true },
];

interface DiscountsSectionProps {
  activeSubNav: string;
}

const DiscountsSection = ({ activeSubNav }: DiscountsSectionProps) => {
  const [discounts, setDiscounts] = useState<Discount[]>(mockDiscounts);
  const [defaulters, setDefaulters] = useState<Defaulter[]>(mockDefaulters);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    studentId: "",
    type: "",
    amount: "",
    percentage: "",
    reason: "",
  });
  const { toast } = useToast();

  const filteredDiscounts = discounts.filter(d => {
    const matchesSearch = d.student.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || d.type === filterType;
    return matchesSearch && matchesType;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-primary/10 text-primary border-primary/20">Approved</Badge>;
      case "pending":
        return <Badge className="bg-accent/10 text-accent border-accent/20">Pending</Badge>;
      case "rejected":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Rejected</Badge>;
      default:
        return null;
    }
  };

  const handleAddDiscount = () => {
    if (!formData.studentId || !formData.type || !formData.amount) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    const newDiscount: Discount = {
      id: Date.now(),
      student: "New Student",
      studentId: formData.studentId,
      type: formData.type,
      amount: parseFloat(formData.amount),
      percentage: parseFloat(formData.percentage) || 0,
      reason: formData.reason,
      status: "pending",
      approvedBy: "-",
      date: new Date().toISOString().split('T')[0],
    };
    setDiscounts(prev => [...prev, newDiscount]);
    setShowAddModal(false);
    setFormData({ studentId: "", type: "", amount: "", percentage: "", reason: "" });
    toast({ title: "Success", description: "Discount submitted for approval" });
  };

  const handleToggleRestriction = (id: number) => {
    setDefaulters(prev => prev.map(d => 
      d.id === id ? { ...d, restricted: !d.restricted } : d
    ));
    toast({ 
      title: "Updated", 
      description: "Student restriction status changed" 
    });
  };

  if (activeSubNav === "arrears") {
    return (
      <div className="space-y-6">
        <Card className="border-none shadow-elegant">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Fee Defaulters & Arrears
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by student name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  <SelectItem value="Form 1">Form 1</SelectItem>
                  <SelectItem value="Form 2">Form 2</SelectItem>
                  <SelectItem value="Form 3">Form 3</SelectItem>
                  <SelectItem value="Form 4">Form 4</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Balance range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Balances</SelectItem>
                  <SelectItem value="0-500">$0 - $500</SelectItem>
                  <SelectItem value="500-1000">$500 - $1000</SelectItem>
                  <SelectItem value="1000+">$1000+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Defaulters Table */}
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Student ID</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Outstanding Balance</TableHead>
                    <TableHead>Days Overdue</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {defaulters.map((defaulter) => (
                    <TableRow key={defaulter.id} className={defaulter.restricted ? "bg-destructive/5" : ""}>
                      <TableCell className="font-medium">{defaulter.studentId}</TableCell>
                      <TableCell>{defaulter.student}</TableCell>
                      <TableCell>{defaulter.class}</TableCell>
                      <TableCell className="text-destructive font-medium">${defaulter.balance}</TableCell>
                      <TableCell>
                        <Badge variant={defaulter.daysOverdue > 30 ? "destructive" : "outline"}>
                          {defaulter.daysOverdue} days
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {defaulter.restricted ? (
                          <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                            <Ban className="h-3 w-3 mr-1" />
                            Restricted
                          </Badge>
                        ) : (
                          <Badge className="bg-primary/10 text-primary border-primary/20">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant={defaulter.restricted ? "outline" : "destructive"}
                          size="sm"
                          onClick={() => handleToggleRestriction(defaulter.id)}
                        >
                          {defaulter.restricted ? "Remove Restriction" : "Apply Restriction"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-elegant">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Percent className="h-5 w-5 text-primary" />
            Discounts & Adjustments
          </CardTitle>
          <Button onClick={() => setShowAddModal(true)} variant="gold" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Discount
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by student name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Discount type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Sibling Discount">Sibling Discount</SelectItem>
                <SelectItem value="Scholarship">Scholarship</SelectItem>
                <SelectItem value="Bursary">Bursary</SelectItem>
                <SelectItem value="Manual Waiver">Manual Waiver</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Student</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Approved By</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDiscounts.map((discount) => (
                  <TableRow key={discount.id}>
                    <TableCell className="font-medium">{discount.student}</TableCell>
                    <TableCell>{discount.type}</TableCell>
                    <TableCell className="text-primary font-medium">${discount.amount}</TableCell>
                    <TableCell>{discount.percentage > 0 ? `${discount.percentage}%` : "-"}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{discount.reason}</TableCell>
                    <TableCell>{getStatusBadge(discount.status)}</TableCell>
                    <TableCell>{discount.approvedBy}</TableCell>
                    <TableCell>{discount.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Discount Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Discount / Adjustment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Student ID *</label>
              <Input
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                placeholder="e.g., STU001"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Discount Type *</label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sibling Discount">Sibling Discount</SelectItem>
                  <SelectItem value="Scholarship">Scholarship</SelectItem>
                  <SelectItem value="Bursary">Bursary</SelectItem>
                  <SelectItem value="Manual Waiver">Manual Waiver</SelectItem>
                  <SelectItem value="Credit">Credit</SelectItem>
                  <SelectItem value="Penalty">Penalty</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Amount ($) *</label>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Percentage (%)</label>
                <Input
                  type="number"
                  value={formData.percentage}
                  onChange={(e) => setFormData({ ...formData, percentage: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Reason / Notes</label>
              <Textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Enter reason for discount..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button variant="gold" onClick={handleAddDiscount}>Submit for Approval</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DiscountsSection;
