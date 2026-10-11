import { useState } from "react";
import { User, Edit, Trash2, Plus, School } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SchoolClass, Teacher } from "@/lib/hooks";

interface TeachersSectionProps {
    teachers: Teacher[] | undefined;
    classes: SchoolClass[] | undefined;
    isLoading: boolean;
    onAddTeacher: () => void;
    onEditTeacher: (teacher: Teacher) => void;
    onDeleteTeacher: (teacher: Teacher) => void;
    onAssignClassTeacher: (schoolClassId: number, teacherId: number | null) => void;
}

const TeachersSection = ({ teachers, classes, isLoading, onAddTeacher, onEditTeacher, onDeleteTeacher, onAssignClassTeacher }: TeachersSectionProps) => {
    const [selectedClasses, setSelectedClasses] = useState<Record<number, string>>({});

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
                                <Button variant="outline" size="sm" onClick={() => onEditTeacher(teacher)} className="flex-1 rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-colors">
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                </Button>
                                <Button variant="outline" size="sm" aria-label={`Delete ${teacher.name}`} onClick={() => onDeleteTeacher(teacher)} className="rounded-lg hover:border-destructive/50 hover:bg-destructive/5 transition-colors group/del">
                                    <Trash2 className="h-4 w-4 text-muted-foreground group-hover/del:text-destructive" />
                                </Button>
                            </div>

                            <div className="mt-5 rounded-xl border border-border bg-secondary/20 p-4">
                                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                                    <School className="h-4 w-4 text-primary" />
                                    Class teacher assignment
                                </div>
                                <p className="mb-3 text-xs text-muted-foreground">
                                    Assigned class{classes?.filter(cls => cls.class_teacher === Number(teacher.id)).length === 1 ? "" : "es"}:{" "}
                                    {classes?.some(cls => cls.class_teacher === Number(teacher.id))
                                        ? classes.filter(cls => cls.class_teacher === Number(teacher.id)).map(cls => (
                                            <span key={cls.id} className="mr-1 inline-flex items-center gap-1">
                                                {cls.name}
                                                <button
                                                    type="button"
                                                    className="text-destructive underline"
                                                    onClick={() => onAssignClassTeacher(cls.id, null)}
                                                    aria-label={`Remove ${teacher.name} as class teacher of ${cls.name}`}
                                                >
                                                    remove
                                                </button>
                                            </span>
                                        ))
                                        : "None"}
                                </p>
                                <div className="flex gap-2">
                                    <select
                                        aria-label={`Choose a class for ${teacher.name}`}
                                        className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2 py-2 text-sm text-foreground"
                                        value={selectedClasses[Number(teacher.id)] ?? ""}
                                        onChange={event => setSelectedClasses(previous => ({
                                            ...previous,
                                            [Number(teacher.id)]: event.target.value,
                                        }))}
                                    >
                                        <option value="">Select class</option>
                                        {classes?.map(schoolClass => (
                                            <option key={schoolClass.id} value={schoolClass.id}>
                                                {schoolClass.name}{schoolClass.class_teacher && schoolClass.class_teacher !== Number(teacher.id) ? ` · ${schoolClass.class_teacher_name || "Assigned"}` : ""}
                                            </option>
                                        ))}
                                    </select>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        disabled={!selectedClasses[Number(teacher.id)]}
                                        onClick={() => {
                                            const classId = Number(selectedClasses[Number(teacher.id)]);
                                            if (classId) onAssignClassTeacher(classId, Number(teacher.id));
                                        }}
                                    >
                                        Assign
                                    </Button>
                                </div>
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
