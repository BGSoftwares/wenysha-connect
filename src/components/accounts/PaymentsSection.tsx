import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, Printer, Download, Search, CreditCard, Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Payment {
  id: number;
  receiptNo: string;
  student: string;
  studentId: string;
  invoiceNo: string;
  amount: number;
  method: string;
  reference: string;
  date: string;
  recordedBy: string;
}

const mockPayments: Payment[] = [
  { id: 1, receiptNo: "RCP-2024-001", student: "John Mutasa", studentId: "STU001", invoiceNo: "INV-2024-001", amount: 600, method: "Cash", reference: "-", date: "2024-01-20", recordedBy: "Admin" },
  { id: 2, receiptNo: "RCP-2024-002", student: "John Mutasa", studentId: "STU001", invoiceNo: "INV-2024-001", amount: 600, method: "Bank Transfer", reference: "TRN123456", date: "2024-01-25", recordedBy: "Admin" },
  { id: 3, receiptNo: "RCP-2024-003", student: "Sarah Moyo", studentId: "STU002", invoiceNo: "INV-2024-002", amount: 600, method: "Mobile Money", reference: "MM789012", date: "2024-01-22", recordedBy: "Admin" },
  { id: 4, receiptNo: "RCP-2024-004", student: "Grace Dube", studentId: "STU004", invoiceNo: "INV-2024-004", amount: 1200, method: "POS", reference: "POS456789", date: "2024-01-18", recordedBy: "Admin" },
  { id: 5, receiptNo: "RCP-2024-005", student: "David Chuma", studentId: "STU005", invoiceNo: "INV-2024-005", amount: 900, method: "Bank Transfer", reference: "TRN654321", date: "2024-01-23", recordedBy: "Admin" },
];

interface PaymentsSectionProps {
  activeSubNav: string;
}

const PaymentsSection = ({ activeSubNav }: PaymentsSectionProps) => {
  const [payments, setPayments] = useState<Payment[]>(mockPayments);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMethod, setFilterMethod] = useState("all");
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [recordForm, setRecordForm] = useState({
    studentId: "",
    invoiceNo: "",
    amount: "",
    method: "",
    reference: "",
  });
  const { toast } = useToast();

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.receiptNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMethod = filterMethod === "all" || payment.method === filterMethod;
    return matchesSearch && matchesMethod;
  });

  const getMethodBadge = (method: string) => {
    switch (method) {
      case "Cash":
        return <Badge className="bg-primary/10 text-primary border-primary/20">Cash</Badge>;
      case "Bank Transfer":
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Bank Transfer</Badge>;
      case "Mobile Money":
        return <Badge className="bg-accent/10 text-accent border-accent/20">Mobile Money</Badge>;
      case "POS":
        return <Badge className="bg-purple-100 text-purple-700 border-purple-200">POS</Badge>;
      default:
        return null;
    }
  };

  const handleRecordPayment = () => {
    if (!recordForm.studentId || !recordForm.amount || !recordForm.method) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    const newPayment: Payment = {
      id: Date.now(),
      receiptNo: `RCP-2024-${String(payments.length + 1).padStart(3, '0')}`,
      student: "New Student",
      studentId: recordForm.studentId,
      invoiceNo: recordForm.invoiceNo || "N/A",
      amount: parseFloat(recordForm.amount),
      method: recordForm.method,
      reference: recordForm.reference || "-",
      date: new Date().toISOString().split('T')[0],
      recordedBy: "Admin",
    };
    setPayments(prev => [newPayment, ...prev]);
    setShowRecordModal(false);
    setRecordForm({ studentId: "", invoiceNo: "", amount: "", method: "", reference: "" });
    toast({ title: "Success", description: "Payment recorded successfully" });
  };

  const totalCollections = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-elegant">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Payments</p>
            <h3 className="text-2xl font-bold text-foreground">{payments.length}</h3>
          </CardContent>
        </Card>
        <Card className="border-none shadow-elegant">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Collections</p>
            <h3 className="text-2xl font-bold text-primary">${totalCollections.toLocaleString()}</h3>
          </CardContent>
        </Card>
        <Card className="border-none shadow-elegant">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Today's Collections</p>
            <h3 className="text-2xl font-bold text-accent">$1,200</h3>
          </CardContent>
        </Card>
        <Card className="border-none shadow-elegant">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Overpayments</p>
            <h3 className="text-2xl font-bold text-foreground">$350</h3>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-elegant">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Payments & Receipts
          </CardTitle>
          <Button onClick={() => setShowRecordModal(true)} variant="gold" className="gap-2">
            <Plus className="h-4 w-4" />
            Record Payment
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by student, receipt or invoice..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterMethod} onValueChange={setFilterMethod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                <SelectItem value="POS">POS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Receipt No</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.receiptNo}</TableCell>
                    <TableCell>{payment.student}</TableCell>
                    <TableCell>{payment.invoiceNo}</TableCell>
                    <TableCell className="text-primary font-medium">${payment.amount}</TableCell>
                    <TableCell>{getMethodBadge(payment.method)}</TableCell>
                    <TableCell>{payment.reference}</TableCell>
                    <TableCell>{payment.date}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon">
                          <Receipt className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Record Payment Modal */}
      <Dialog open={showRecordModal} onOpenChange={setShowRecordModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Student ID *</label>
              <Input
                value={recordForm.studentId}
                onChange={(e) => setRecordForm({ ...recordForm, studentId: e.target.value })}
                placeholder="e.g., STU001"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Invoice Number</label>
              <Input
                value={recordForm.invoiceNo}
                onChange={(e) => setRecordForm({ ...recordForm, invoiceNo: e.target.value })}
                placeholder="e.g., INV-2024-001"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Amount ($) *</label>
              <Input
                type="number"
                value={recordForm.amount}
                onChange={(e) => setRecordForm({ ...recordForm, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Payment Method *</label>
              <Select value={recordForm.method} onValueChange={(v) => setRecordForm({ ...recordForm, method: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                  <SelectItem value="POS">POS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Reference Number</label>
              <Input
                value={recordForm.reference}
                onChange={(e) => setRecordForm({ ...recordForm, reference: e.target.value })}
                placeholder="Transaction reference"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRecordModal(false)}>Cancel</Button>
            <Button variant="gold" onClick={handleRecordPayment}>Record Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentsSection;
