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
import { Plus, Eye, Printer, Download, Search, FileText, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Invoice {
  id: number;
  invoiceNo: string;
  student: string;
  studentId: string;
  class: string;
  term: string;
  amount: number;
  paid: number;
  status: "paid" | "partial" | "unpaid";
  date: string;
}

const mockInvoices: Invoice[] = [
  { id: 1, invoiceNo: "INV-2024-001", student: "John Mutasa", studentId: "STU001", class: "Form 4A", term: "Term 1", amount: 1200, paid: 1200, status: "paid", date: "2024-01-15" },
  { id: 2, invoiceNo: "INV-2024-002", student: "Sarah Moyo", studentId: "STU002", class: "Form 3B", term: "Term 1", amount: 1200, paid: 600, status: "partial", date: "2024-01-15" },
  { id: 3, invoiceNo: "INV-2024-003", student: "Peter Ncube", studentId: "STU003", class: "Form 2A", term: "Term 1", amount: 1200, paid: 0, status: "unpaid", date: "2024-01-15" },
  { id: 4, invoiceNo: "INV-2024-004", student: "Grace Dube", studentId: "STU004", class: "Form 1C", term: "Term 1", amount: 1200, paid: 1200, status: "paid", date: "2024-01-16" },
  { id: 5, invoiceNo: "INV-2024-005", student: "David Chuma", studentId: "STU005", class: "Form 4B", term: "Term 1", amount: 1500, paid: 900, status: "partial", date: "2024-01-16" },
];

interface InvoicesSectionProps {
  activeSubNav: string;
}

const InvoicesSection = ({ activeSubNav }: InvoicesSectionProps) => {
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTerm, setFilterTerm] = useState("all");
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [generateForm, setGenerateForm] = useState({
    term: "",
    class: "",
    student: "",
  });
  const { toast } = useToast();

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || inv.status === filterStatus;
    const matchesTerm = filterTerm === "all" || inv.term === filterTerm;
    return matchesSearch && matchesStatus && matchesTerm;
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

  const handleGenerateInvoice = () => {
    const newInvoice: Invoice = {
      id: Date.now(),
      invoiceNo: `INV-2024-${String(invoices.length + 1).padStart(3, '0')}`,
      student: generateForm.student || "New Student",
      studentId: `STU${String(invoices.length + 1).padStart(3, '0')}`,
      class: generateForm.class || "Form 1A",
      term: generateForm.term || "Term 1",
      amount: 1200,
      paid: 0,
      status: "unpaid",
      date: new Date().toISOString().split('T')[0],
    };
    setInvoices(prev => [...prev, newInvoice]);
    setShowGenerateModal(false);
    toast({ title: "Success", description: "Invoice generated successfully" });
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowViewModal(true);
  };

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-elegant">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Invoices
          </CardTitle>
          <Button onClick={() => setShowGenerateModal(true)} variant="gold" className="gap-2">
            <Plus className="h-4 w-4" />
            Generate Invoice
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by student or invoice number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterTerm} onValueChange={setFilterTerm}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Terms</SelectItem>
                <SelectItem value="Term 1">Term 1</SelectItem>
                <SelectItem value="Term 2">Term 2</SelectItem>
                <SelectItem value="Term 3">Term 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
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
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoiceNo}</TableCell>
                    <TableCell>{invoice.student}</TableCell>
                    <TableCell>{invoice.class}</TableCell>
                    <TableCell>{invoice.term}</TableCell>
                    <TableCell>${invoice.amount}</TableCell>
                    <TableCell>${invoice.paid}</TableCell>
                    <TableCell className={invoice.amount - invoice.paid > 0 ? "text-destructive font-medium" : ""}>
                      ${invoice.amount - invoice.paid}
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
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Send className="h-4 w-4" />
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

      {/* Generate Invoice Modal */}
      <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Term *</label>
              <Select value={generateForm.term} onValueChange={(v) => setGenerateForm({ ...generateForm, term: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Term 1">Term 1</SelectItem>
                  <SelectItem value="Term 2">Term 2</SelectItem>
                  <SelectItem value="Term 3">Term 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Class (Optional)</label>
              <Select value={generateForm.class} onValueChange={(v) => setGenerateForm({ ...generateForm, class: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class for bulk" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Form 1A">Form 1A</SelectItem>
                  <SelectItem value="Form 1B">Form 1B</SelectItem>
                  <SelectItem value="Form 2A">Form 2A</SelectItem>
                  <SelectItem value="Form 2B">Form 2B</SelectItem>
                  <SelectItem value="Form 3A">Form 3A</SelectItem>
                  <SelectItem value="Form 3B">Form 3B</SelectItem>
                  <SelectItem value="Form 4A">Form 4A</SelectItem>
                  <SelectItem value="Form 4B">Form 4B</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Student (Individual)</label>
              <Input
                value={generateForm.student}
                onChange={(e) => setGenerateForm({ ...generateForm, student: e.target.value })}
                placeholder="Enter student name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateModal(false)}>Cancel</Button>
            <Button variant="gold" onClick={handleGenerateInvoice}>Generate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Invoice Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4 py-4">
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice No:</span>
                  <span className="font-medium">{selectedInvoice.invoiceNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span>{selectedInvoice.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  {getStatusBadge(selectedInvoice.status)}
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Student Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Name:</span>
                  <span>{selectedInvoice.student}</span>
                  <span className="text-muted-foreground">ID:</span>
                  <span>{selectedInvoice.studentId}</span>
                  <span className="text-muted-foreground">Class:</span>
                  <span>{selectedInvoice.class}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Payment Summary</h4>
                <div className="bg-card border border-border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Total Amount:</span>
                    <span className="font-medium">${selectedInvoice.amount}</span>
                  </div>
                  <div className="flex justify-between text-primary">
                    <span>Amount Paid:</span>
                    <span className="font-medium">${selectedInvoice.paid}</span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between">
                    <span className="font-medium">Balance Due:</span>
                    <span className="font-bold text-destructive">
                      ${selectedInvoice.amount - selectedInvoice.paid}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" className="gap-2">
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button variant="gold" className="gap-2">
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoicesSection;
