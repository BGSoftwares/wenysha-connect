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
import { Search, DollarSign, FileText, Download, Printer, Eye } from "lucide-react";

interface StudentBalance {
  id: number;
  studentId: string;
  student: string;
  class: string;
  totalBilled: number;
  totalPaid: number;
  balance: number;
  lastPayment: string;
  status: "cleared" | "owing" | "overpaid";
}

const mockBalances: StudentBalance[] = [
  { id: 1, studentId: "STU001", student: "John Mutasa", class: "Form 4A", totalBilled: 1200, totalPaid: 1200, balance: 0, lastPayment: "2024-01-25", status: "cleared" },
  { id: 2, studentId: "STU002", student: "Sarah Moyo", class: "Form 3B", totalBilled: 1200, totalPaid: 600, balance: 600, lastPayment: "2024-01-22", status: "owing" },
  { id: 3, studentId: "STU003", student: "Peter Ncube", class: "Form 2A", totalBilled: 1200, totalPaid: 0, balance: 1200, lastPayment: "-", status: "owing" },
  { id: 4, studentId: "STU004", student: "Grace Dube", class: "Form 1C", totalBilled: 1200, totalPaid: 1200, balance: 0, lastPayment: "2024-01-18", status: "cleared" },
  { id: 5, studentId: "STU005", student: "David Chuma", class: "Form 4B", totalBilled: 1500, totalPaid: 1600, balance: -100, lastPayment: "2024-01-23", status: "overpaid" },
  { id: 6, studentId: "STU006", student: "Lisa Phiri", class: "Form 3A", totalBilled: 1200, totalPaid: 800, balance: 400, lastPayment: "2024-01-20", status: "owing" },
];

const BalancesSection = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterClass, setFilterClass] = useState("all");
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentBalance | null>(null);

  const filteredBalances = mockBalances.filter(balance => {
    const matchesSearch = 
      balance.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
      balance.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || balance.status === filterStatus;
    const matchesClass = filterClass === "all" || balance.class === filterClass;
    return matchesSearch && matchesStatus && matchesClass;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "cleared":
        return <Badge className="bg-primary/10 text-primary border-primary/20">Cleared</Badge>;
      case "owing":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Owing</Badge>;
      case "overpaid":
        return <Badge className="bg-accent/10 text-accent border-accent/20">Overpaid</Badge>;
      default:
        return null;
    }
  };

  const handleViewStatement = (student: StudentBalance) => {
    setSelectedStudent(student);
    setShowStatementModal(true);
  };

  const totalOwing = mockBalances
    .filter(b => b.balance > 0)
    .reduce((sum, b) => sum + b.balance, 0);

  const totalOverpaid = mockBalances
    .filter(b => b.balance < 0)
    .reduce((sum, b) => sum + Math.abs(b.balance), 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-elegant">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Students</p>
            <h3 className="text-2xl font-bold text-foreground">{mockBalances.length}</h3>
          </CardContent>
        </Card>
        <Card className="border-none shadow-elegant">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Cleared Accounts</p>
            <h3 className="text-2xl font-bold text-primary">
              {mockBalances.filter(b => b.status === "cleared").length}
            </h3>
          </CardContent>
        </Card>
        <Card className="border-none shadow-elegant">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Outstanding</p>
            <h3 className="text-2xl font-bold text-destructive">${totalOwing.toLocaleString()}</h3>
          </CardContent>
        </Card>
        <Card className="border-none shadow-elegant">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Overpayments</p>
            <h3 className="text-2xl font-bold text-accent">${totalOverpaid.toLocaleString()}</h3>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-elegant">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Student Balances
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or student ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="cleared">Cleared</SelectItem>
                <SelectItem value="owing">Owing</SelectItem>
                <SelectItem value="overpaid">Overpaid</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                <SelectItem value="Form 1A">Form 1A</SelectItem>
                <SelectItem value="Form 1C">Form 1C</SelectItem>
                <SelectItem value="Form 2A">Form 2A</SelectItem>
                <SelectItem value="Form 3A">Form 3A</SelectItem>
                <SelectItem value="Form 3B">Form 3B</SelectItem>
                <SelectItem value="Form 4A">Form 4A</SelectItem>
                <SelectItem value="Form 4B">Form 4B</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Student ID</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Total Billed</TableHead>
                  <TableHead>Total Paid</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Last Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBalances.map((balance) => (
                  <TableRow key={balance.id}>
                    <TableCell className="font-medium">{balance.studentId}</TableCell>
                    <TableCell>{balance.student}</TableCell>
                    <TableCell>{balance.class}</TableCell>
                    <TableCell>${balance.totalBilled}</TableCell>
                    <TableCell>${balance.totalPaid}</TableCell>
                    <TableCell className={`font-medium ${
                      balance.balance > 0 ? "text-destructive" : 
                      balance.balance < 0 ? "text-accent" : "text-primary"
                    }`}>
                      {balance.balance < 0 ? `+$${Math.abs(balance.balance)}` : `$${balance.balance}`}
                    </TableCell>
                    <TableCell>{balance.lastPayment}</TableCell>
                    <TableCell>{getStatusBadge(balance.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleViewStatement(balance)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <FileText className="h-4 w-4" />
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

      {/* Statement Modal */}
      <Dialog open={showStatementModal} onOpenChange={setShowStatementModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Fee Statement</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4 py-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Student Name</p>
                    <p className="font-medium">{selectedStudent.student}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Student ID</p>
                    <p className="font-medium">{selectedStudent.studentId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Class</p>
                    <p className="font-medium">{selectedStudent.class}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Term</p>
                    <p className="font-medium">Term 1 2024</p>
                  </div>
                </div>
              </div>

              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Debit</TableHead>
                      <TableHead>Credit</TableHead>
                      <TableHead>Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>2024-01-15</TableCell>
                      <TableCell>Term 1 Fees</TableCell>
                      <TableCell>${selectedStudent.totalBilled}</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>${selectedStudent.totalBilled}</TableCell>
                    </TableRow>
                    {selectedStudent.totalPaid > 0 && (
                      <TableRow>
                        <TableCell>{selectedStudent.lastPayment}</TableCell>
                        <TableCell>Payment Received</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>${selectedStudent.totalPaid}</TableCell>
                        <TableCell>${selectedStudent.balance}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Current Balance:</span>
                  <span className={`text-xl font-bold ${
                    selectedStudent.balance > 0 ? "text-destructive" : 
                    selectedStudent.balance < 0 ? "text-accent" : "text-primary"
                  }`}>
                    {selectedStudent.balance < 0 
                      ? `Credit: $${Math.abs(selectedStudent.balance)}` 
                      : `$${selectedStudent.balance}`
                    }
                  </span>
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
              Export PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BalancesSection;
