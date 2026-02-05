import { Search, Edit, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Student {
    id: number | string;
    name: string;
    student_id: string;
    class_name?: string;
    school_class?: string;
    gender: string;
    status: string;
}

interface StudentsSectionProps {
    students: Student[] | undefined;
    isLoading: boolean;
    error: any;
    classes: any[] | undefined;
    onAddStudent: () => void;
}

const StudentsSection = ({ students, isLoading, error, classes, onAddStudent }: StudentsSectionProps) => {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h2 className="font-heading text-xl font-bold text-foreground">Student Management</h2>
                <Button onClick={onAddStudent} variant="gold" className="shadow-lg shadow-accent/20 transition-all hover:scale-105 active:scale-95">
                    <Plus className="h-4 w-4 mr-2" />
                    Enroll Student
                </Button>
            </div>

            <div className="bg-card rounded-xl border border-border overflow-hidden shadow-elegant">
                <div className="p-4 border-b border-border flex items-center gap-4 bg-secondary/20">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search students..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                    </div>
                    <select className="px-4 py-2 rounded-lg border border-border bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                        <option>All Classes</option>
                        {classes?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>

                {isLoading ? (
                    <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
                        <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <span>Loading students...</span>
                    </div>
                ) : error ? (
                    <div className="p-12 text-center text-destructive bg-destructive/5 border-b border-border">
                        Failed to load students. Please tray again later.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-secondary/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Name</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Student ID</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Class</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Gender</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {(students || []).map((student) => (
                                    <tr key={student.id} className="hover:bg-secondary/30 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-foreground">{student.name}</td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground">{student.student_id}</td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground">{student.class_name || student.school_class}</td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground">{student.gender}</td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${student.status === 'Active'
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                {student.status}
                                            </span>
                                        </td>
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
                                {students?.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-muted-foreground italic">
                                            No students found in the database.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentsSection;
