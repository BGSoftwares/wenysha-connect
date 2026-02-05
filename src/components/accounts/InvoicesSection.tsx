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
import { Plus, Eye, Printer, Download, Search, FileText, Send, Loader2 } from "lucide-react";
import { useInvoices, useCreateInvoice, useStudents, Invoice as InvoiceType } from "@/lib/hooks";
import { toast } from "sonner";
import { format } from "date-fns";

interface InvoicesSectionProps {
  activeSubNav: string;
}

const InvoicesSection = ({ activeSubNav }: InvoicesSectionProps) => {
  const { data: invoices, isLoading } = useInvoices();
  const { data: students } = useStudents();
  const createInvoiceMutation = useCreateInvoice();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceType | null>(null);
  const [generateForm, setGenerateForm] = useState({
    term: "Term 1",
    studentId: "",
    amount: "0",
  });

  const filteredInvoices = (invoices || []).filter(inv => {
    const matchesSearch =
      inv.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.invoice_no.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || inv.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-primary/10 text-primary border-primary/20">Paid</Badge>;
      case "partial":
        return <Badge className="bg-accent/10 text-accent border-accent/20">Partial</Badge>;
      case "unpaid":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Unpaid</Badge>;
      default:
        return null;
    }
  };

  const handleGenerateInvoice = async () => {
    if (!generateForm.studentId || !generateForm.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createInvoiceMutation.mutateAsync({
        student: parseInt(generateForm.studentId),
        term: generateForm.term,
        amount: parseFloat(generateForm.amount),
        date: new Date().toISOString().split('T')[0],
      });
      setShowGenerateModal(false);
      toast.success("Invoice generated successfully");
      setGenerateForm({ term: "Term 1", studentId: "", amount: "0" });
    } catch (error) {
      toast.error("Failed to generate invoice");
    }
  };

  const handleViewInvoice = (invoice: InvoiceType) => {
    setSelectedInvoice(invoice);
    setShowViewModal(true);
  };

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="border-none shadow-elegant">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Invoices Registry
          </CardTitle>
          <Button onClick={() => setShowGenerateModal(true)} variant="gold" className="gap-2 shadow-lg shadow-accent/20">
            <Plus className="h-4 w-4" />
            New Invoice
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search student or invoice..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px] h-11">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="paid">Fully Paid</SelectItem>
                <SelectItem value="partial">Partial Payment</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-border overflow-hidden bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Invoice No</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id} className="hover:bg-muted/10 transition-colors">
                      <TableCell className="font-bold text-primary">{invoice.invoice_no}</TableCell>
                      <TableCell className="font-medium">{invoice.student_name}</TableCell>
                      <TableCell>{invoice.class_name}</TableCell>
                      <TableCell>{invoice.term}</TableCell>
                      <TableCell className="font-semibold">${parseFloat(invoice.amount).toLocaleString()}</TableCell>
                      <TableCell className="text-primary">${parseFloat(invoice.paid).toLocaleString()}</TableCell>
                      <TableCell className={parseFloat(invoice.amount) - parseFloat(invoice.paid) > 0 ? "text-destructive font-bold" : "text-primary font-bold"}>
                        ${(parseFloat(invoice.amount) - parseFloat(invoice.paid)).toLocaleString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewInvoice(invoice)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                      No invoices matching your search criteria
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Generate Invoice Modal */}
      <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
        <DialogContent className="max-w-md bg-card border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-heading font-black">Generate New Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-accent uppercase tracking-widest ml-1">Academic Term</label>
              <Select value={generateForm.term} onValueChange={(v) => setGenerateForm({ ...generateForm, term: v })}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Term 1">Term 1</SelectItem>
                  <SelectItem value="Term 2">Term 2</SelectItem>
                  <SelectItem value="Term 3">Term 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-accent uppercase tracking-widest ml-1">Student</label>
              <Select value={generateForm.studentId} onValueChange={(v) => setGenerateForm({ ...generateForm, studentId: v })}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {students?.map(s => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name} ({s.class_name})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-accent uppercase tracking-widest ml-1">Fee Amount ($)</label>
              <Input
                type="number"
                value={generateForm.amount}
                onChange={(e) => setGenerateForm({ ...generateForm, amount: e.target.value })}
                placeholder="0.00"
                className="h-12"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowGenerateModal(false)} className="h-12 flex-1 rounded-xl">Cancel</Button>
            <Button
              variant="gold"
              onClick={handleGenerateInvoice}
              className="h-12 flex-1 rounded-xl shadow-lg shadow-accent/20"
              disabled={createInvoiceMutation.isPending}
            >
              {createInvoiceMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Commit Invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Invoice Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-lg bg-card border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-heading font-black">Financial Document</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-6 py-4">
              <div className="bg-muted/50 p-6 rounded-2xl space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                  <Badge className="bg-primary/20 text-primary border-primary/30 uppercase text-[10px] tracking-widest py-1 px-3">Official</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm font-medium">Invoice No:</span>
                  <span className="font-black text-primary tracking-tight">{selectedInvoice.invoice_no}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm font-medium">Issued Date:</span>
                  <span className="font-semibold">{format(new Date(selectedInvoice.date), "PPP")}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm font-medium">Payment Status:</span>
                  {getStatusBadge(selectedInvoice.status)}
                </div>
              </div>

              <div className="space-y-3 px-2">
                <h4 className="text-[10px] font-bold text-accent uppercase tracking-widest">Student Information</h4>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">Full Name</p>
                    <p className="font-black text-foreground">{selectedInvoice.student_name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">Academic Group</p>
                    <p className="font-bold text-foreground">{selectedInvoice.class_name}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 px-2">
                <h4 className="text-[10px] font-bold text-accent uppercase tracking-widest">Financial Summary</h4>
                <div className="bg-secondary/30 rounded-2xl p-6 space-y-4 border border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Original Indebtedness:</span>
                    <span className="font-bold">${parseFloat(selectedInvoice.amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-primary">
                    <span className="text-muted-foreground font-medium">Redemption Amount:</span>
                    <span className="font-bold">-${parseFloat(selectedInvoice.paid).toLocaleString()}</span>
                  </div>
                  <div className="pt-4 border-t border-border/50 flex justify-between items-end">
                    <div>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">Net Residual Liability</p>
                      <p className="font-black text-2xl text-destructive tracking-tighter">
                        ${(parseFloat(selectedInvoice.amount) - parseFloat(selectedInvoice.paid)).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-3">
            <Button variant="outline" className="flex-1 h-14 rounded-xl font-bold bg-white/5 border-white/10 text-foreground hover:bg-white/10 transition-all uppercase tracking-widest text-[10px]" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Generate PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoicesSection;

export default InvoicesSection;
