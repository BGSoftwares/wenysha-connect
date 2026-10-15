import { useState } from "react";
import { Edit, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { useTeachers, useSubjects, useClasses, type Allocation } from "@/lib/hooks";

interface AllocationsSectionProps {
    allocations: Allocation[];
    onAddAllocation: () => void;
}

const AllocationsSection = ({ allocations, onAddAllocation }: AllocationsSectionProps) => {
    const queryClient = useQueryClient();
    const { data: teachers = [] } = useTeachers();
    const { data: subjects = [] } = useSubjects();
    const { data: classes = [] } = useClasses();

    const [editingAllocation, setEditingAllocation] = useState<Allocation | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const removeAllocation = async (allocation: Allocation) => {
        if (!window.confirm(`Remove ${allocation.teacher_name}'s ${allocation.subject_name} allocation for ${allocation.class_name}?`)) return;
        try {
            await api.delete(`/school/allocations/${allocation.id}/`);
            await queryClient.invalidateQueries({ queryKey: ["allocations"] });
            await queryClient.invalidateQueries({ queryKey: ["teachers"] });
            toast.success("Allocation removed");
        } catch (error) { toast.error(getErrorMessage(error)); }
    };

    const handleSaveEdit = async () => {
        if (!editingAllocation) return;
        const periods = Number(editingAllocation.periods);
        if (!Number.isInteger(periods) || periods < 1 || periods > 40) {
            toast.error("Enter a whole number between 1 and 40 for periods");
            return;
        }

        setIsSaving(true);
        try {
            await api.patch(`/school/allocations/${editingAllocation.id}/`, {
                teacher: Number(editingAllocation.teacher),
                subject: Number(editingAllocation.subject),
                school_class: Number(editingAllocation.school_class),
                periods,
            });
            await queryClient.invalidateQueries({ queryKey: ["allocations"] });
            await queryClient.invalidateQueries({ queryKey: ["teachers"] });
            toast.success("Allocation updated successfully");
            setEditingAllocation(null);
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-heading text-xl font-bold text-foreground">Teacher-Class Allocations</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Manage which teachers instruct each subject across classrooms</p>
                </div>
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
                                            <button
                                                aria-label={`Edit allocation for ${alloc.teacher_name}`}
                                                onClick={() => setEditingAllocation({ ...alloc })}
                                                className="p-2 hover:bg-white dark:hover:bg-background rounded-lg transition-colors border border-transparent hover:border-border group"
                                            >
                                                <Edit className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                            </button>
                                            <button
                                                aria-label={`Delete allocation for ${alloc.teacher_name}`}
                                                onClick={() => void removeAllocation(alloc)}
                                                className="p-2 hover:bg-white dark:hover:bg-background rounded-lg transition-colors border border-transparent hover:border-border group"
                                            >
                                                <Trash2 className="h-4 w-4 text-muted-foreground group-hover:text-destructive transition-colors" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {allocations.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-muted-foreground italic">
                                        No teacher allocations recorded yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Allocation Modal */}
            {editingAllocation && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300" onClick={() => setEditingAllocation(null)}>
                    <div className="bg-card rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-border animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-heading text-2xl font-bold text-foreground">Edit Allocation</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Teacher</label>
                                <select
                                    className="w-full p-2.5 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                                    value={editingAllocation.teacher}
                                    onChange={e => setEditingAllocation({ ...editingAllocation, teacher: Number(e.target.value) })}
                                >
                                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Subject</label>
                                <select
                                    className="w-full p-2.5 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                                    value={editingAllocation.subject}
                                    onChange={e => setEditingAllocation({ ...editingAllocation, subject: Number(e.target.value) })}
                                >
                                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Classroom</label>
                                <select
                                    className="w-full p-2.5 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                                    value={editingAllocation.school_class}
                                    onChange={e => setEditingAllocation({ ...editingAllocation, school_class: Number(e.target.value) })}
                                >
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Periods per Week (1-40)</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={40}
                                    className="w-full p-2.5 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                                    value={editingAllocation.periods}
                                    onChange={e => setEditingAllocation({ ...editingAllocation, periods: Number(e.target.value) })}
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <Button variant="outline" onClick={() => setEditingAllocation(null)} className="flex-1 rounded-xl h-11">Cancel</Button>
                                <Button variant="gold" disabled={isSaving} onClick={handleSaveEdit} className="flex-1 rounded-xl h-11 font-bold shadow-lg shadow-accent/20">
                                    {isSaving ? "Saving..." : "Save Changes"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AllocationsSection;
