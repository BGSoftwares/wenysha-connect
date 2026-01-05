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
import { Plus, Edit2, Trash2, Search, Filter, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FeeItem {
  id: number;
  name: string;
  amount: number;
  term: string;
  form: string;
  category: string;
  boardingType: string;
  active: boolean;
}

const mockFeeStructures: FeeItem[] = [
  { id: 1, name: "Tuition Fee", amount: 500, term: "Term 1", form: "Form 1", category: "Academic", boardingType: "Day Scholar", active: true },
  { id: 2, name: "Tuition Fee", amount: 500, term: "Term 1", form: "Form 2", category: "Academic", boardingType: "Day Scholar", active: true },
  { id: 3, name: "Boarding Fee", amount: 800, term: "Term 1", form: "Form 1", category: "Accommodation", boardingType: "Boarding", active: true },
  { id: 4, name: "Sports Levy", amount: 50, term: "Term 1", form: "All Forms", category: "Extra-curricular", boardingType: "All", active: true },
  { id: 5, name: "ICT Levy", amount: 75, term: "Term 1", form: "All Forms", category: "Academic", boardingType: "All", active: true },
  { id: 6, name: "Exam Fee", amount: 100, term: "Term 2", form: "Form 4", category: "Academic", boardingType: "All", active: true },
  { id: 7, name: "Development Levy", amount: 150, term: "Annual", form: "All Forms", category: "Infrastructure", boardingType: "All", active: false },
];

interface FeeStructuresSectionProps {
  activeSubNav: string;
}

const FeeStructuresSection = ({ activeSubNav }: FeeStructuresSectionProps) => {
  const [feeStructures, setFeeStructures] = useState<FeeItem[]>(mockFeeStructures);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTerm, setFilterTerm] = useState("all");
  const [filterForm, setFilterForm] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingFee, setEditingFee] = useState<FeeItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    term: "",
    form: "",
    category: "",
    boardingType: "",
  });
  const { toast } = useToast();

  const filteredFees = feeStructures.filter(fee => {
    const matchesSearch = fee.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTerm = filterTerm === "all" || fee.term === filterTerm;
    const matchesForm = filterForm === "all" || fee.form === filterForm || fee.form === "All Forms";
    return matchesSearch && matchesTerm && matchesForm;
  });

  const handleAddFee = () => {
    setEditingFee(null);
    setFormData({ name: "", amount: "", term: "", form: "", category: "", boardingType: "" });
    setShowModal(true);
  };

  const handleEditFee = (fee: FeeItem) => {
    setEditingFee(fee);
    setFormData({
      name: fee.name,
      amount: fee.amount.toString(),
      term: fee.term,
      form: fee.form,
      category: fee.category,
      boardingType: fee.boardingType,
    });
    setShowModal(true);
  };

  const handleSaveFee = () => {
    if (!formData.name || !formData.amount || !formData.term || !formData.form) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    if (editingFee) {
      setFeeStructures(prev => prev.map(f => 
        f.id === editingFee.id 
          ? { ...f, ...formData, amount: parseFloat(formData.amount) }
          : f
      ));
      toast({ title: "Success", description: "Fee structure updated successfully" });
    } else {
      const newFee: FeeItem = {
        id: Date.now(),
        ...formData,
        amount: parseFloat(formData.amount),
        active: true,
      };
      setFeeStructures(prev => [...prev, newFee]);
      toast({ title: "Success", description: "Fee structure created successfully" });
    }
    setShowModal(false);
  };

  const handleToggleActive = (id: number) => {
    setFeeStructures(prev => prev.map(f => 
      f.id === id ? { ...f, active: !f.active } : f
    ));
  };

  const handleDeleteFee = (id: number) => {
    setFeeStructures(prev => prev.filter(f => f.id !== id));
    toast({ title: "Deleted", description: "Fee structure removed" });
  };

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-elegant">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Fee Structures
          </CardTitle>
          <Button onClick={handleAddFee} variant="gold" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Fee Structure
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search fee structures..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterTerm} onValueChange={setFilterTerm}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Terms</SelectItem>
                <SelectItem value="Term 1">Term 1</SelectItem>
                <SelectItem value="Term 2">Term 2</SelectItem>
                <SelectItem value="Term 3">Term 3</SelectItem>
                <SelectItem value="Annual">Annual</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterForm} onValueChange={setFilterForm}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by form" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Forms</SelectItem>
                <SelectItem value="Form 1">Form 1</SelectItem>
                <SelectItem value="Form 2">Form 2</SelectItem>
                <SelectItem value="Form 3">Form 3</SelectItem>
                <SelectItem value="Form 4">Form 4</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Fee Name</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Form/Grade</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Boarding Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFees.map((fee) => (
                  <TableRow key={fee.id}>
                    <TableCell className="font-medium">{fee.name}</TableCell>
                    <TableCell>${fee.amount}</TableCell>
                    <TableCell>{fee.term}</TableCell>
                    <TableCell>{fee.form}</TableCell>
                    <TableCell>{fee.category}</TableCell>
                    <TableCell>{fee.boardingType}</TableCell>
                    <TableCell>
                      <Switch
                        checked={fee.active}
                        onCheckedChange={() => handleToggleActive(fee.id)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEditFee(fee)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteFee(fee.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingFee ? "Edit Fee Structure" : "Add Fee Structure"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Fee Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Tuition Fee"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Amount ($) *</label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Term *</label>
                <Select value={formData.term} onValueChange={(v) => setFormData({ ...formData, term: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Term 1">Term 1</SelectItem>
                    <SelectItem value="Term 2">Term 2</SelectItem>
                    <SelectItem value="Term 3">Term 3</SelectItem>
                    <SelectItem value="Annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Form/Grade *</label>
                <Select value={formData.form} onValueChange={(v) => setFormData({ ...formData, form: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select form" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Form 1">Form 1</SelectItem>
                    <SelectItem value="Form 2">Form 2</SelectItem>
                    <SelectItem value="Form 3">Form 3</SelectItem>
                    <SelectItem value="Form 4">Form 4</SelectItem>
                    <SelectItem value="All Forms">All Forms</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Academic">Academic</SelectItem>
                    <SelectItem value="Accommodation">Accommodation</SelectItem>
                    <SelectItem value="Extra-curricular">Extra-curricular</SelectItem>
                    <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Boarding Type</label>
                <Select value={formData.boardingType} onValueChange={(v) => setFormData({ ...formData, boardingType: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Day Scholar">Day Scholar</SelectItem>
                    <SelectItem value="Boarding">Boarding</SelectItem>
                    <SelectItem value="All">All</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="gold" onClick={handleSaveFee}>
              {editingFee ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeeStructuresSection;
