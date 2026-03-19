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
import { Plus, Printer, Download, Search, CreditCard, Receipt, Loader2, Calendar, DollarSign, TrendingUp } from "lucide-react";
import { usePayments, useCreatePayment, useInvoices, Payment as PaymentType } from "@/lib/hooks";
import { toast } from "sonner";
import { format, isToday } from "date-fns";

interface PaymentsSectionProps {
  activeSubNav: string;
}

const PaymentsSection = ({ activeSubNav }: PaymentsSectionProps) => {
  const { data: payments, isLoading } = usePayments();
  const { data: invoices } = useInvoices();
  const createPaymentMutation = useCreatePayment();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterMethod, setFilterMethod] = useState("all");
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [recordForm, setRecordForm] = useState({
    invoiceId: "",
    amount: "0",
    method: "Bank Transfer",
    reference: "",
  });

  const filteredPayments = (payments || []).filter(payment => {
    const matchesSearch =
      payment.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.receipt_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.invoice_no.toLowerCase().includes(searchTerm.toLowerCase());
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
        return <Badge variant="outline">{method}</Badge>;
    }
  };

  const handleRecordPayment = async () => {
    if (!recordForm.invoiceId || !recordForm.amount || !recordForm.method) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      await createPaymentMutation.mutateAsync({
        invoice: parseInt(recordForm.invoiceId),
        amount: parseFloat(recordForm.amount),
        method: recordForm.method,
        reference: recordForm.reference,
        date: new Date().toISOString().split('T')[0],
      });
      setShowRecordModal(false);
      setRecordForm({ invoiceId: "", amount: "0", method: "Bank Transfer", reference: "" });
      toast.success("Payment recorded successfully");
    } catch (error) {
      toast.error("Failed to record payment");
    }
  };

  const totalCollections = payments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
  const todayCollections = payments?.filter(p => isToday(new Date(p.date))).reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-elegant bg-primary text-primary-foreground relative overflow-hidden">
          <CardContent className="p-6">
            <div className="relative z-10">
              <p className="text-primary-foreground/70 text-xs font-bold uppercase tracking-widest mb-1">Total Lifetime Collections</p>
              <h3 className="text-3xl font-black tracking-tight">${totalCollections.toLocaleString()}</h3>
              <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase">
                <Receipt className="h-3 w-3" />
                {payments?.length} Successful Transactions
              </div>
            </div>
            <DollarSign className="absolute -right-4 -bottom-4 h-32 w-32 text-white/10" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-elegant bg-accent text-accent-foreground relative overflow-hidden">
          <CardContent className="p-6">
            <div className="relative z-10">
              <p className="text-accent-foreground/70 text-xs font-bold uppercase tracking-widest mb-1">Today's Revenue</p>
              <h3 className="text-3xl font-black tracking-tight">${todayCollections.toLocaleString()}</h3>
              <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase">
                <Calendar className="h-3 w-3" />
                Updated just now
              </div>
            </div>
            <TrendingUp className="absolute -right-4 -bottom-4 h-32 w-32 text-black/5" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-elegant bg-white border border-border flex items-center px-6">
          <div className="flex-1">
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Active Payment Window</p>
            <h4 className="font-heading font-black text-foreground">Term 1, 2024</h4>
          </div>
          <div className="p-3 rounded-xl bg-muted/50">
            <CreditCard className="h-6 w-6 text-primary" />
          </div>
        </Card>
      </div>

      <Card className="border-none shadow-elegant">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Transaction Ledger
          </CardTitle>
          <Button onClick={() => setShowRecordModal(true)} variant="gold" className="gap-2 shadow-lg shadow-accent/20">
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
                className="pl-10 h-11"
              />
            </div>
            <Select value={filterMethod} onValueChange={setFilterMethod}>
              <SelectTrigger className="w-[180px] h-11">
                <SelectValue placeholder="All Methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Every Method</SelectItem>
                <SelectItem value="Cash">Physical Cash</SelectItem>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                <SelectItem value="POS">Point of Sale (POS)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-border overflow-hidden bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
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
                {filteredPayments.length > 0 ? (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id} className="hover:bg-muted/10 transition-colors">
                      <TableCell className="font-bold text-primary">{payment.receipt_no}</TableCell>
                      <TableCell className="font-medium">{payment.student_name}</TableCell>
                      <TableCell className="text-muted-foreground">{payment.invoice_no}</TableCell>
                      <TableCell className="text-primary font-black">${parseFloat(payment.amount).toLocaleString()}</TableCell>
                      <TableCell>{getMethodBadge(payment.method)}</TableCell>
                      <TableCell className="text-xs font-mono">{payment.reference || "---"}</TableCell>
                      <TableCell className="text-sm">{format(new Date(payment.date), "dd MMM yyyy")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="hover:text-primary">
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="hover:text-accent">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      No transactions found in this view
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Record Payment Modal */}
      <Dialog open={showRecordModal} onOpenChange={setShowRecordModal}>
        <DialogContent className="max-w-md bg-card border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-heading font-black">Record Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-accent uppercase tracking-widest ml-1">Target Invoice *</label>
              <Select value={recordForm.invoiceId} onValueChange={(v) => setRecordForm({ ...recordForm, invoiceId: v })}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select outstanding invoice" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {invoices?.filter(inv => inv.status !== 'paid').map(inv => (
                    <SelectItem key={inv.id} value={inv.id.toString()}>
                      {inv.invoice_no} - {inv.student_name} (${(parseFloat(inv.amount) - parseFloat(inv.paid)).toLocaleString()} pending)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-accent uppercase tracking-widest ml-1">Payment Amount ($) *</label>
              <Input
                type="number"
                value={recordForm.amount}
                onChange={(e) => setRecordForm({ ...recordForm, amount: e.target.value })}
                placeholder="0.00"
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-accent uppercase tracking-widest ml-1">Payment Channel *</label>
              <Select value={recordForm.method} onValueChange={(v) => setRecordForm({ ...recordForm, method: v })}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Physical Cash</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                  <SelectItem value="POS">Point of Sale (POS)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-accent uppercase tracking-widest ml-1">External Reference</label>
              <Input
                value={recordForm.reference}
                onChange={(e) => setRecordForm({ ...recordForm, reference: e.target.value })}
                placeholder="Transaction or Reference ID"
                className="h-12"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowRecordModal(false)} className="h-12 flex-1 rounded-xl">Discard</Button>
            <Button
              variant="gold"
              onClick={handleRecordPayment}
              className="h-12 flex-1 rounded-xl shadow-lg shadow-accent/20"
              disabled={createPaymentMutation.isPending}
            >
              {createPaymentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentsSection;

export default PaymentsSection;
