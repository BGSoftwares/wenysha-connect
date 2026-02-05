import { Edit, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

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
                                            <button className="p-2 hover:bg-white dark:hover:bg-background rounded-lg transition-colors border border-transparent hover:border-border group">
                                                <Edit className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                            </button>
                                            <button className="p-2 hover:bg-white dark:hover:bg-background rounded-lg transition-colors border border-transparent hover:border-border group">
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
