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
import { Switch } from "@/components/ui/switch";
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
import { Plus, Edit2, Trash2, Search, Filter, DollarSign, Loader2, Landmark, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useFeeStructures, useUpdateFeeStructure, useDeleteFeeStructure, useCreateFeeStructure, FeeStructure } from "@/lib/hooks";
import { toast } from "sonner";

interface FeeStructuresSectionProps {
  activeSubNav: string;
}

const FeeStructuresSection = ({ activeSubNav }: FeeStructuresSectionProps) => {
  const { data: feeStructures, isLoading } = useFeeStructures();
  const createMutation = useCreateFeeStructure();
  const updateMutation = useUpdateFeeStructure();
  const deleteMutation = useDeleteFeeStructure();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterTerm, setFilterTerm] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingFee, setEditingFee] = useState<FeeStructure | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    amount: "0",
    term: "Term 1",
    form: "All Forms",
    category: "Academic",
    boarding_type: "All",
    active: true
  });

  const filteredFees = (feeStructures || []).filter(fee => {
    const matchesSearch = fee.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTerm = filterTerm === "all" || fee.term === filterTerm;
    return matchesSearch && matchesTerm;
  });

  const handleAddFee = () => {
    setEditingFee(null);
    setFormData({ name: "", amount: "0", term: "Term 1", form: "All Forms", category: "Academic", boarding_type: "All", active: true });
    setShowModal(true);
  };

  const handleEditFee = (fee: FeeStructure) => {
    setEditingFee(fee);
    setFormData({
      name: fee.name,
      amount: fee.amount.toString(),
      term: fee.term,
      form: fee.form || "All Forms",
      category: fee.category || "Academic",
      boarding_type: fee.boarding_type || "All",
      active: fee.active,
    });
    setShowModal(true);
  };

  const handleSaveFee = async () => {
    if (!formData.name || !formData.amount || !formData.term) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      if (editingFee) {
        await updateMutation.mutateAsync({
          id: editingFee.id,
          data: { ...formData, amount: formData.amount }
        });
        toast.success("Structure updated successfully");
      } else {
        await createMutation.mutateAsync({
          ...formData,
          amount: formData.amount
        });
        toast.success("New structure added to registry");
      }
      setShowModal(false);
    } catch (error) {
      toast.error("Failed to persist fee structure");
    }
  };

  const handleToggleActive = async (fee: FeeStructure) => {
    try {
      await updateMutation.mutateAsync({
        id: fee.id,
        data: { active: !fee.active }
      });
      toast.success(`Structure ${!fee.active ? 'activated' : 'deactivated'}`);
    } catch (error) {
      toast.error("Operation failed");
    }
  };

  const handleDeleteFee = async (id: number) => {
    if (confirm("Are you sure you want to delete this fee structure? This may affect historical billing records.")) {
      try {
        await deleteMutation.mutateAsync(id);
        toast.success("Structure removed from registry");
      } catch (error) {
        toast.error("Failed to remove structure");
      }
    }
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
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-foreground">Fee Policy Registry</h2>
          <p className="text-muted-foreground font-medium">Define and manage institutional billing structures</p>
        </div>
        <Button onClick={handleAddFee} variant="gold" className="gap-2 h-12 px-6 rounded-xl shadow-lg shadow-accent/20">
          <Plus className="h-5 w-5" />
          New Structure
        </Button>
      </div>

      <Card className="border-none shadow-elegant overflow-hidden">
        <CardContent className="p-0">
          {/* Filters Bar */}
          <div className="p-4 bg-muted/30 border-b border-border flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Lookup structure by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 bg-white border-muted rounded-xl"
              />
            </div>
            <div className="flex items-center gap-3">
              <Select value={filterTerm} onValueChange={setFilterTerm}>
                <SelectTrigger className="w-[180px] h-12 rounded-xl bg-white border-muted font-bold text-[10px] uppercase tracking-wider">
                  <SelectValue placeholder="Term/Cycle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Every Cycle</SelectItem>
                  <SelectItem value="Term 1">Term 1</SelectItem>
                  <SelectItem value="Term 2">Term 2</SelectItem>
                  <SelectItem value="Term 3">Term 3</SelectItem>
                  <SelectItem value="Annual">Annual Levy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/10 border-none">
                  <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest pl-8">Structure Name</TableHead>
                  <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest text-right">Target Amount</TableHead>
                  <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest">Cycle</TableHead>
                  <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest">Scope</TableHead>
                  <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest text-center">Status</TableHead>
                  <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest text-right pr-8">Management</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFees.length > 0 ? (
                  filteredFees.map((fee) => (
                    <TableRow key={fee.id} className="hover:bg-muted/5 transition-colors border-b border-border/50">
                      <TableCell className="pl-8 font-black text-foreground">{fee.name}</TableCell>
                      <TableCell className="text-right font-black text-primary text-lg">${parseFloat(fee.amount.toString()).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-bold border-muted text-muted-foreground uppercase text-[10px]">{fee.term}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-foreground">{fee.form || "All Forms"}</span>
                          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-tighter truncate w-32">{fee.boarding_type} • {fee.category}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={fee.is_active}
                          onCheckedChange={() => handleToggleActive(fee)}
                          className="data-[state=checked]:bg-primary"
                        />
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-lg hover:bg-accent/10 hover:text-accent"
                            onClick={() => handleEditFee(fee)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleDeleteFee(fee.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center text-muted-foreground italic">
                      No billing structures archived for this filter
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-none shadow-elegant bg-primary/5 border border-primary/10">
          <CardContent className="p-6 flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-primary/20">
              <Landmark className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h4 className="font-black text-foreground mb-1">Fee Allocation Logic</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">Fees are automatically matched to students based on their <b>Boarding Status</b> and <b>Current Form</b> during invoice generation.</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-elegant bg-accent/5 border border-accent/10">
          <CardContent className="p-6 flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-accent/20">
              <ShieldCheck className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h4 className="font-black text-foreground mb-1">Compliance & Auditing</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">Deactivating a structure prevents it from being added to <b>new</b> invoices, but maintains history for existing records.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-xl bg-card border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-primary p-8 text-primary-foreground relative overflow-hidden">
            <DollarSign className="absolute -right-8 -bottom-8 h-48 w-48 text-white/10" />
            <div className="relative z-10">
              <DialogTitle className="text-3xl font-black tracking-tighter">
                {editingFee ? "Modify Structure" : "Establish Structure"}
              </DialogTitle>
              <p className="text-primary-foreground/70 font-medium">Setup billing parameters for the academic ledger</p>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-accent uppercase tracking-widest ml-1">Fee Descriptor *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., General Tuition"
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-accent uppercase tracking-widest ml-1">Valuation ($) *</label>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  className="h-12 rounded-xl font-black text-primary text-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-accent uppercase tracking-widest ml-1">Academic Cycle *</label>
                <Select value={formData.term} onValueChange={(v) => setFormData({ ...formData, term: v })}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Term 1">Term 1</SelectItem>
                    <SelectItem value="Term 2">Term 2</SelectItem>
                    <SelectItem value="Term 3">Term 3</SelectItem>
                    <SelectItem value="Annual">Annual Levy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-accent uppercase tracking-widest ml-1">Target Group *</label>
                <Select value={formData.form} onValueChange={(v) => setFormData({ ...formData, form: v })}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Select form" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Form 1">Form 1 Only</SelectItem>
                    <SelectItem value="Form 2">Form 2 Only</SelectItem>
                    <SelectItem value="Form 3">Form 3 Only</SelectItem>
                    <SelectItem value="Form 4">Form 4 Only</SelectItem>
                    <SelectItem value="All Forms">Universal Allocation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-accent uppercase tracking-widest ml-1">Fiscal Category</label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Academic">Academic Fees</SelectItem>
                    <SelectItem value="Accommodation">Accommodation/Boarding</SelectItem>
                    <SelectItem value="Extra-curricular">Sports & Culture</SelectItem>
                    <SelectItem value="Infrastructure">Development & Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-accent uppercase tracking-widest ml-1">Residency Status</label>
                <Select value={formData.boarding_type} onValueChange={(v) => setFormData({ ...formData, boarding_type: v })}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Day Scholar">Day Scholars Only</SelectItem>
                    <SelectItem value="Boarding">Boarders Only</SelectItem>
                    <SelectItem value="All">All Students</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 pt-0 gap-3">
            <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest">Discard Changes</Button>
            <Button
              variant="gold"
              onClick={handleSaveFee}
              className="flex-1 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-accent/20"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="h-5 w-5 animate-spin" /> : (editingFee ? "Save Amendments" : "Confirm Structure")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeeStructuresSection;
