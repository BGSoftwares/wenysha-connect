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
import { Plus, Search, Percent, AlertTriangle, Ban, CheckCircle, Loader2, Sparkles, UserPlus } from "lucide-react";
import { useDiscounts, useCreateDiscount, useStudentBalances, useStudents, Discount } from "@/lib/hooks";
import { toast } from "sonner";
import { format } from "date-fns";

interface DiscountsSectionProps {
  activeSubNav: string;
}

const DiscountsSection = ({ activeSubNav }: DiscountsSectionProps) => {
  const { data: discounts, isLoading: discountsLoading } = useDiscounts();
  const { data: balances, isLoading: balancesLoading } = useStudentBalances();
  const { data: students } = useStudents();
  const createMutation = useCreateDiscount();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    student: "",
    discount_type: "Sibling Discount",
    amount: "0",
    reason: "",
    date: new Date().toISOString().split('T')[0]
  });

  const filteredDiscounts = (discounts || []).filter(d => {
    const studentName = d.student_name || "";
    const matchesSearch = studentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || d.discount_type === filterType;
    return matchesSearch && matchesType;
  });

  const defaulters = (balances || []).filter(b => b.total_balance > 0).sort((a, b) => b.total_balance - a.total_balance);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Active</Badge>;
      case "pending":
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Processing</Badge>;
      default:
        return <Badge variant="outline">{status || "Unknown"}</Badge>;
    }
  };

  const handleAddDiscount = async () => {
    if (!formData.student || !formData.amount) {
      toast.error("Please identify the student and amount");
      return;
    }

    try {
      await createMutation.mutateAsync({
        ...formData,
        student: parseInt(formData.student),
        amount: formData.amount,
        status: 'approved'
      });
      toast.success("Adjustment applied successfully");
      setShowAddModal(false);
      setFormData({ student: "", discount_type: "Sibling Discount", amount: "0", reason: "", date: new Date().toISOString().split('T')[0] });
    } catch (error) {
      toast.error("Failed to record adjustment");
    }
  };

  if (activeSubNav === "arrears") {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col mb-4">
          <h2 className="text-3xl font-black tracking-tight text-foreground">Compliance & Recovery</h2>
          <p className="text-muted-foreground font-medium">Tracking institutional exposure and overdue reconciliations</p>
        </div>

        <Card className="border-none shadow-elegant overflow-hidden">
          <CardHeader className="bg-destructive/5 border-b border-destructive/10 p-6">
            <CardTitle className="text-lg flex items-center gap-3 text-destructive">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5" />
              </div>
              High-Exposure Accounts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Filter Bar */}
            <div className="p-4 bg-muted/20 border-b border-border">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search portfolio by student name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 bg-white border-muted rounded-xl"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/10 border-none">
                    <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest pl-8">Student</TableHead>
                    <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest">Enrollment</TableHead>
                    <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest text-right">Invoiced</TableHead>
                    <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest text-right">Recovered</TableHead>
                    <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest text-right pr-8">Outstanding</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balancesLoading ? (
                    <TableRow><TableCell colSpan={5} className="h-40 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                  ) : defaulters.length > 0 ? (
                    defaulters.filter(d => (d.student || "").toLowerCase().includes(searchTerm.toLowerCase())).map((defaulter) => (
                      <TableRow key={defaulter.student_id} className="hover:bg-muted/5 transition-colors border-b border-border/50">
                        <TableCell className="pl-8">
                          <div className="flex flex-col">
                            <span className="font-black text-foreground">{defaulter.student}</span>
                            <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">ID: {defaulter.student_id}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-bold border-muted text-muted-foreground uppercase text-[10px]">Active</Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold text-muted-foreground">${(defaulter.totalBilled || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right font-bold text-emerald-600">${(defaulter.totalPaid || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right pr-8">
                          <span className="text-lg font-black text-destructive">${(defaulter.balance || 0).toLocaleString()}</span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={5} className="h-40 text-center text-muted-foreground italic">No overdue accounts found in the registry</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-foreground">Adjustment Registry</h2>
          <p className="text-muted-foreground font-medium">Manage institutional waivers, scholarships and subsidies</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} variant="gold" className="gap-2 h-12 px-6 rounded-xl shadow-lg shadow-accent/20">
          <Plus className="h-5 w-5" />
          Post Adjustment
        </Button>
      </div>

      <Card className="border-none shadow-elegant overflow-hidden">
        <CardContent className="p-0">
          {/* Filters Bar */}
          <div className="p-4 bg-muted/30 border-b border-border flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Lookup beneficiary by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 bg-white border-muted rounded-xl"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[200px] h-12 rounded-xl bg-white border-muted font-bold text-[10px] uppercase tracking-wider">
                <SelectValue placeholder="Policy Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Every Policy</SelectItem>
                <SelectItem value="Sibling Discount">Sibling Subsidy</SelectItem>
                <SelectItem value="Scholarship">Full Scholarship</SelectItem>
                <SelectItem value="Bursary">Need-based Bursary</SelectItem>
                <SelectItem value="Manual Waiver">Bursar Waiver</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/10 border-none">
                  <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest pl-8">Beneficiary</TableHead>
                  <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest">Classification</TableHead>
                  <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest text-right">Value ($)</TableHead>
                  <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest">Justification</TableHead>
                  <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest">Status</TableHead>
                  <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest text-right pr-8">Recorded</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {discountsLoading ? (
                  <TableRow><TableCell colSpan={6} className="h-40 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                ) : filteredDiscounts.length > 0 ? (
                  filteredDiscounts.map((discount) => (
                    <TableRow key={discount.id} className="hover:bg-muted/5 transition-colors border-b border-border/50">
                      <TableCell className="pl-8">
                        <div className="flex flex-col">
                          <span className="font-black text-foreground">{discount.student_name}</span>
                          <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">ID: {discount.student}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-bold border-muted text-muted-foreground uppercase text-[10px]">{discount.discount_type}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-black text-primary text-lg">${parseFloat(discount.amount.toString()).toLocaleString()}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs font-medium text-muted-foreground italic">{discount.reason || "Automatic eligibility"}</TableCell>
                      <TableCell>{getStatusBadge(discount.status)}</TableCell>
                      <TableCell className="text-right pr-8 font-medium text-[11px] text-muted-foreground">
                        {discount.date ? format(new Date(discount.date), "MMM d, yyyy") : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={6} className="h-40 text-center text-muted-foreground italic">No adjustments archived for this selection</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Discount Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-xl bg-card border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-primary p-8 text-primary-foreground relative overflow-hidden">
            <Percent className="absolute -right-8 -bottom-8 h-48 w-48 text-white/10" />
            <div className="relative z-10">
              <DialogTitle className="text-3xl font-black tracking-tighter">Post Adjustment</DialogTitle>
              <p className="text-primary-foreground/70 font-medium">Apply institutional credits or waivers to student ledgers</p>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-accent uppercase tracking-widest ml-1">Target Beneficiary *</label>
              <Select value={formData.student} onValueChange={(v) => setFormData({ ...formData, student: v })}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Select student from registry" />
                </SelectTrigger>
                <SelectContent>
                  {students?.map(s => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name} ({s.student_id})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-accent uppercase tracking-widest ml-1">Classification *</label>
                <Select value={formData.discount_type} onValueChange={(v) => setFormData({ ...formData, discount_type: v })}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Policy type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sibling Discount">Sibling Subsidy</SelectItem>
                    <SelectItem value="Scholarship">Full Scholarship</SelectItem>
                    <SelectItem value="Bursary">Need-based Bursary</SelectItem>
                    <SelectItem value="Manual Waiver">Bursar Waiver</SelectItem>
                    <SelectItem value="Credit">Ledger Credit</SelectItem>
                    <SelectItem value="Penalty">Financial Penalty</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-accent uppercase tracking-widest ml-1">Valuation ($) *</label>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  className="h-12 rounded-xl font-black text-primary text-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-accent uppercase tracking-widest ml-1">Justification / Audit Logs</label>
              <Textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Formal reasoning for this adjustment..."
                className="rounded-xl min-h-[100px] bg-muted/20"
              />
            </div>
          </div>

          <DialogFooter className="p-8 pt-0 gap-3">
            <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest">Discard Entry</Button>
            <Button
              variant="gold"
              onClick={handleAddDiscount}
              className="flex-1 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-accent/20"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Authorize Adjustment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DiscountsSection;
