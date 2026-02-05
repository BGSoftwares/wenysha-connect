import { Edit, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Subject {
    id: number | string;
    name: string;
    code: string;
    department: string;
    curriculum?: string;
}

interface SubjectsSectionProps {
    subjects: Subject[] | undefined;
    onAddSubject: () => void;
}

const SubjectsSection = ({ subjects, onAddSubject }: SubjectsSectionProps) => {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h2 className="font-heading text-xl font-bold text-foreground">Subject Management</h2>
                <Button onClick={onAddSubject} variant="gold" className="shadow-lg shadow-accent/20 transition-all hover:scale-105 active:scale-95">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Subject
                </Button>
            </div>

            <div className="bg-card rounded-xl border border-border overflow-hidden shadow-elegant">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-secondary/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Subject Name</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Code</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Department</th>
                                <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {(subjects || []).map((subject) => (
                                <tr key={subject.id} className="hover:bg-secondary/30 transition-colors">
                                    <td className="px-6 py-4 text-sm font-bold text-foreground">{subject.name}</td>
                                    <td className="px-6 py-4 text-sm font-mono text-accent">{subject.code}</td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">{subject.department}</td>
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
                            {subjects?.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-muted-foreground italic">
                                        No subjects defined in the curriculum.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SubjectsSection;
