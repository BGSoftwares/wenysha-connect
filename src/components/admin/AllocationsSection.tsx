import { Edit, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

interface Allocation {
    id: number;
    teacher: number;
    teacher_name: string;
    subject: number;
    subject_name: string;
    school_class: number;
    class_name: string;
    periods: number;
}

interface AllocationsSectionProps {
    allocations: Allocation[];
    onAddAllocation: () => void;
}

const AllocationsSection = ({ allocations, onAddAllocation }: AllocationsSectionProps) => {
    const queryClient = useQueryClient();
    const removeAllocation = async (allocation: Allocation) => {
        if (!window.confirm(`Remove ${allocation.teacher_name}'s ${allocation.subject_name} allocation for ${allocation.class_name}?`)) return;
        try {
            await api.delete(`/school/allocations/${allocation.id}/`);
            await queryClient.invalidateQueries({ queryKey: ["allocations"] });
            toast.success("Allocation removed");
        } catch (error) { toast.error(getErrorMessage(error)); }
    };
    const editAllocation = async (allocation: Allocation) => {
        const entered = window.prompt("Periods per week", String(allocation.periods));
        if (entered === null) return;
        const periods = Number(entered);
        if (!Number.isInteger(periods) || periods < 1 || periods > 40) { toast.error("Enter a whole number between 1 and 40"); return; }
        try {
            await api.patch(`/school/allocations/${allocation.id}/`, { periods });
            await queryClient.invalidateQueries({ queryKey: ["allocations"] });
            toast.success("Allocation updated");
        } catch (error) { toast.error(getErrorMessage(error)); }
    };
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h2 className="font-heading text-xl font-bold text-foreground">Teacher-Class Allocations</h2>
                <Button onClick={onAddAllocation} variant="gold" className="shadow-lg shadow-accent/20 transition-all hover:scale-105 active:scale-95">
                    <Plus className="h-4 w-4 mr-2" />
                    New Allocation
                </Button>
            </div>

            <div className="bg-card rounded-xl border border-border overflow-hidden shadow-elegant">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-secondary/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Teacher</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Subject</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Class</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground text-center">Periods/Week</th>
                                <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {allocations.map((alloc) => (
                                <tr key={alloc.id} className="hover:bg-secondary/30 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-foreground">{alloc.teacher_name}</td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">
                                        <span className="bg-secondary px-2 py-0.5 rounded text-xs font-medium">{alloc.subject_name}</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">{alloc.class_name}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-foreground text-center">{alloc.periods}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button aria-label={`Edit allocation for ${alloc.teacher_name}`} onClick={() => void editAllocation(alloc)} className="p-2 hover:bg-white dark:hover:bg-background rounded-lg transition-colors border border-transparent hover:border-border group">
                                                <Edit className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                            </button>
                                            <button aria-label={`Delete allocation for ${alloc.teacher_name}`} onClick={() => void removeAllocation(alloc)} className="p-2 hover:bg-white dark:hover:bg-background rounded-lg transition-colors border border-transparent hover:border-border group">
                                                <Trash2 className="h-4 w-4 text-muted-foreground group-hover:text-destructive transition-colors" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AllocationsSection;
