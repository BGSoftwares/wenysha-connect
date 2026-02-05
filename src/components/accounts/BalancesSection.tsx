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
import { Search, DollarSign, FileText, Download, Printer, Eye, Loader2, CheckCircle, AlertTriangle, TrendingDown } from "lucide-react";
import { useStudentBalances, useInvoices, usePayments, StudentBalance as StudentBalanceType } from "@/lib/hooks";
import { format } from "date-fns";

const BalancesSection = () => {
  const { data: balances, isLoading: loadingBalances } = useStudentBalances();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentBalanceType | null>(null);

  const filteredBalances = (balances || []).filter(balance => {
    const matchesSearch =
      balance.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
      balance.student_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || balance.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "cleared":
        return <Badge className="bg-primary/10 text-primary border-primary/20">All Clear</Badge>;
      case "owing":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20 border-2">Action Required</Badge>;
      case "overpaid":
        return <Badge className="bg-accent/10 text-accent border-accent/20">Credit Balance</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleViewStatement = (student: StudentBalanceType) => {
    setSelectedStudent(student);
    setShowStatementModal(true);
  };

  const totalOwing = balances?.filter(b => b.balance > 0).reduce((sum, b) => sum + b.balance, 0) || 0;
  const totalOverpaid = balances?.filter(b => b.balance < 0).reduce((sum, b) => sum + Math.abs(b.balance), 0) || 0;
  const clearedCount = balances?.filter(b => b.status === "cleared").length || 0;

  if (loadingBalances) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-elegant bg-white">
          <CardContent className="p-6">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Registry</p>
            <h3 className="text-3xl font-black text-foreground tracking-tight">{balances?.length || 0}</h3>
            <p className="text-xs text-muted-foreground mt-2">Active Students</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-elegant bg-primary text-primary-foreground">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-1">
              <p className="text-primary-foreground/70 text-[10px] font-bold uppercase tracking-widest">Cleared Accounts</p>
              <CheckCircle className="h-4 w-4 text-primary-foreground/40" />
            </div>
            <h3 className="text-3xl font-black tracking-tight">{clearedCount}</h3>
            <p className="text-xs text-primary-foreground/70 mt-2">Full Compliance</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-elegant bg-destructive text-destructive-foreground">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-1">
              <p className="text-destructive-foreground/70 text-[10px] font-bold uppercase tracking-widest">Total Outstanding</p>
              <AlertTriangle className="h-4 w-4 text-destructive-foreground/40" />
            </div>
            <h3 className="text-3xl font-black tracking-tight">${totalOwing.toLocaleString()}</h3>
            <p className="text-xs text-destructive-foreground/70 mt-2">Net Collectible</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-elegant bg-accent text-accent-foreground">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-1">
              <p className="text-accent-foreground/70 text-[10px] font-bold uppercase tracking-widest">Pre-payments</p>
              <TrendingDown className="h-4 w-4 text-accent-foreground/40" />
            </div>
            <h3 className="text-3xl font-black tracking-tight">${totalOverpaid.toLocaleString()}</h3>
            <p className="text-xs text-accent-foreground/70 mt-2">Credit Liability</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-elegant overflow-hidden">
        <CardHeader className="bg-muted/30 pb-8">
          <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            Financial Accountability Ledger
          </CardTitle>
        </CardHeader>
        <CardContent className="-mt-6">
          <div className="bg-card rounded-2xl border border-border shadow-soft p-6">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="relative flex-1 min-w-[300px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search master registry by name or student ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-14 rounded-xl border-muted bg-muted/20 focus:bg-white transition-all text-lg"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[200px] h-14 rounded-xl font-bold uppercase text-[10px] tracking-widest">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  <SelectItem value="cleared">Cleared Only</SelectItem>
                  <SelectItem value="owing">Arrears Only</SelectItem>
                  <SelectItem value="overpaid">Credits Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="py-4 font-bold uppercase text-[10px] tracking-wider">Student Profile</TableHead>
                    <TableHead className="py-4 font-bold uppercase text-[10px] tracking-wider text-right">Total Indebtedness</TableHead>
                    <TableHead className="py-4 font-bold uppercase text-[10px] tracking-wider text-right">Redemption Value</TableHead>
                    <TableHead className="py-4 font-bold uppercase text-[10px] tracking-wider text-right">Net Position</TableHead>
                    <TableHead className="py-4 font-bold uppercase text-[10px] tracking-wider text-center">Last Transaction</TableHead>
                    <TableHead className="py-4 font-bold uppercase text-[10px] tracking-wider">Status</TableHead>
                    <TableHead className="py-4 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBalances.length > 0 ? (
                    filteredBalances.map((balance) => (
                      <TableRow key={balance.id} className="hover:bg-muted/20 transition-all border-b border-border/50">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-black text-foreground tracking-tight">{balance.student}</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">{balance.student_id} • {balance.class_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">${balance.totalBilled.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-medium text-primary">${balance.totalPaid.toLocaleString()}</TableCell>
                        <TableCell className={`text-right font-black ${balance.balance > 0 ? "text-destructive" :
                            balance.balance < 0 ? "text-accent" : "text-primary text-xl"
                          }`}>
                          {balance.balance < 0 ? `+$${Math.abs(balance.balance).toLocaleString()}` : `$${balance.balance.toLocaleString()}`}
                        </TableCell>
                        <TableCell className="text-center text-xs font-medium text-muted-foreground">
                          {balance.lastPayment ? format(new Date(balance.lastPayment), "dd MMM yyyy") : "---"}
                        </TableCell>
                        <TableCell>{getStatusBadge(balance.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                              onClick={() => handleViewStatement(balance)}
                            >
                              <Eye className="h-5 w-5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-accent/10 hover:text-accent transition-colors">
                              <FileText className="h-5 w-5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg transition-colors">
                              <Download className="h-5 w-5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                        No records found in the financial master ledger
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statement Modal */}
      <Dialog open={showStatementModal} onOpenChange={setShowStatementModal}>
        <DialogContent className="max-w-3xl bg-card border-none shadow-2xl p-0 overflow-hidden">
          {selectedStudent && (
            <div className="animate-in fade-in duration-300">
              <div className="bg-primary p-8 text-primary-foreground relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <DollarSign className="h-32 w-32" />
                </div>
                <div className="relative z-10">
                  <Badge className="bg-white/20 text-white border-none py-1 px-3 mb-4 uppercase text-[10px] tracking-widest font-black">Official Record</Badge>
                  <h2 className="text-3xl font-black tracking-tight mb-1">Fiscal Accountability Statement</h2>
                  <p className="text-primary-foreground/70 text-sm font-medium">Detailed financial history for current academic session</p>
                </div>
              </div>

              <div className="p-8 space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  <div>
                    <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-1">Stakeholder</p>
                    <p className="font-black text-foreground tracking-tight leading-tight">{selectedStudent.student}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-1">ID Ref</p>
                    <p className="font-bold text-foreground">{selectedStudent.student_id}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-1">Group</p>
                    <p className="font-bold text-foreground">{selectedStudent.class_name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-1">Current Cycle</p>
                    <p className="font-bold text-foreground">Term 1, 2024</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-border overflow-hidden bg-muted/10">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 border-none">
                        <TableHead className="py-4 font-bold uppercase text-[9px] tracking-widest">Entry Date</TableHead>
                        <TableHead className="py-4 font-bold uppercase text-[9px] tracking-widest">Transaction Abstract</TableHead>
                        <TableHead className="py-4 font-bold uppercase text-[9px] tracking-widest text-right">Gross Liability</TableHead>
                        <TableHead className="py-4 font-bold uppercase text-[9px] tracking-widest text-right">Settlement</TableHead>
                        <TableHead className="py-4 font-bold uppercase text-[9px] tracking-widest text-right">Net Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="border-b border-border/30">
                        <TableCell className="text-xs font-medium">15 Jan 2024</TableCell>
                        <TableCell className="text-xs font-black">Seasonal Tuition Assessment</TableCell>
                        <TableCell className="text-right text-xs font-bold">${selectedStudent.totalBilled.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-xs font-bold text-muted-foreground">---</TableCell>
                        <TableCell className="text-right text-xs font-black">${selectedStudent.totalBilled.toLocaleString()}</TableCell>
                      </TableRow>
                      {selectedStudent.totalPaid > 0 && (
                        <TableRow className="bg-primary/[0.03]">
                          <TableCell className="text-xs font-medium">{selectedStudent.lastPayment ? format(new Date(selectedStudent.lastPayment), "dd MMM yyyy") : "---"}</TableCell>
                          <TableCell className="text-xs font-black text-primary">Consolidated Settlement Batch</TableCell>
                          <TableCell className="text-right text-xs font-bold text-muted-foreground">---</TableCell>
                          <TableCell className="text-right text-xs font-black text-primary">(${selectedStudent.totalPaid.toLocaleString()})</TableCell>
                          <TableCell className="text-right text-xs font-black text-foreground">${selectedStudent.balance.toLocaleString()}</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-secondary/20 p-6 rounded-2xl border border-border flex flex-col justify-center col-span-2">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Account Standing</p>
                    <h4 className={`text-3xl font-black tracking-tighter ${selectedStudent.balance > 0 ? "text-destructive" : "text-primary"
                      }`}>
                      {selectedStudent.balance < 0
                        ? `Active Credit: $${Math.abs(selectedStudent.balance).toLocaleString()}`
                        : `$${selectedStudent.balance.toLocaleString()}`
                      }
                    </h4>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button variant="gold" className="h-full rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-accent/20" onClick={() => window.print()}>
                      <Printer className="mr-3 h-5 w-5" />
                      Print Official Record
                    </Button>
                    <Button variant="outline" className="h-full rounded-2xl font-black uppercase text-[10px] tracking-widest border-border text-muted-foreground hover:bg-muted/50">
                      <Download className="mr-3 h-5 w-5" />
                      Secure Export
                    </Button>
                  </div>
                </div>
              </div>
              <div className="bg-muted p-4 text-center border-t border-border mt-4">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">© 2024 Wenyasha Connect Financial Compliance Engine</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BalancesSection;

export default BalancesSection;
