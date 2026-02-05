import { User, Edit, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Teacher {
    id: number | string;
    name: string;
    department: string;
    phone: string;
}

interface TeachersSectionProps {
    teachers: Teacher[] | undefined;
    isLoading: boolean;
    onAddTeacher: () => void;
}

const TeachersSection = ({ teachers, isLoading, onAddTeacher }: TeachersSectionProps) => {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h2 className="font-heading text-xl font-bold text-foreground">Teacher Management</h2>
                <Button onClick={onAddTeacher} variant="gold" className="shadow-lg shadow-accent/20 transition-all hover:scale-105 active:scale-95">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Teacher
                </Button>
            </div>

            {isLoading ? (
                <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
                    <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <span>Loading teachers...</span>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(teachers || []).map((teacher) => (
                        <div key={teacher.id} className="bg-card rounded-xl border border-border p-6 shadow-elegant hover:shadow-lg transition-all group">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform">
                                        <User className="h-7 w-7 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-foreground leading-tight">{teacher.name}</h3>
                                        <div className="flex flex-col gap-0.5 mt-1">
                                            <span className="text-sm font-medium text-accent">{teacher.department} Department</span>
                                            <span className="text-xs text-muted-foreground">{teacher.phone || "No contact"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-6">
                                <Button variant="outline" size="sm" className="flex-1 rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-colors">
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                </Button>
                                <Button variant="outline" size="sm" className="rounded-lg hover:border-destructive/50 hover:bg-destructive/5 transition-colors group/del">
                                    <Trash2 className="h-4 w-4 text-muted-foreground group-hover/del:text-destructive" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    {teachers?.length === 0 && (
                        <div className="col-span-full p-12 text-center border-2 border-dashed border-border rounded-xl text-muted-foreground">
                            No teachers registered in the system.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TeachersSection;
