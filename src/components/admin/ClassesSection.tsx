import { Edit, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Class {
    id: number | string;
    name: string;
    capacity: number;
    enrolled: number;
    class_teacher_name?: string;
}

interface ClassesSectionProps {
    classes: Class[] | undefined;
    onAddClass: () => void;
}

const ClassesSection = ({ classes, onAddClass }: ClassesSectionProps) => {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h2 className="font-heading text-xl font-bold text-foreground">Class Management</h2>
                <Button onClick={onAddClass} variant="gold" className="shadow-lg shadow-accent/20 transition-all hover:scale-105 active:scale-95">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Class
                </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes?.map((cls) => {
                    const occupancyRate = (cls.enrolled / cls.capacity) * 100;
                    let progressColor = "bg-primary";
                    if (occupancyRate >= 90) progressColor = "bg-destructive";
                    else if (occupancyRate >= 75) progressColor = "bg-orange-500";

                    return (
                        <div key={cls.id} className="bg-card rounded-xl border border-border p-6 shadow-elegant hover:shadow-lg transition-all group overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-3 flex gap-1 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                                <button className="p-2 hover:bg-background rounded-lg border border-border transition-colors"><Edit className="h-4 w-4 text-muted-foreground" /></button>
                                <button className="p-2 hover:bg-background rounded-lg border border-border transition-colors"><Trash2 className="h-4 w-4 text-destructive" /></button>
                            </div>

                            <div className="mb-4">
                                <span className="text-xs font-bold uppercase tracking-wider text-accent bg-accent/10 px-2 py-1 rounded">Grade/Stage</span>
                                <h3 className="font-bold text-2xl text-foreground mt-2">{cls.name}</h3>
                            </div>

                            <p className="text-sm text-muted-foreground mb-6 flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                Teacher: <span className="font-medium text-foreground">{cls.class_teacher_name || "Unassigned"}</span>
                            </p>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground font-medium">Class Capacity</span>
                                    <span className="font-bold text-foreground">{cls.enrolled} / {cls.capacity} <span className="text-xs font-normal text-muted-foreground">Students</span></span>
                                </div>
                                <div className="h-2.5 bg-secondary/50 rounded-full overflow-hidden border border-border/50">
                                    <div
                                        className={`h-full ${progressColor} transition-all duration-1000 ease-out`}
                                        style={{ width: `${Math.min(occupancyRate, 100)}%` }}
                                    />
                                </div>
                                <p className="text-[10px] text-right text-muted-foreground font-medium uppercase tracking-tight">
                                    {occupancyRate >= 100 ? "FULLY ENROLLED" : `${100 - occupancyRate.toFixed(0)}% SEATS VACANT`}
                                </p>
                            </div>
                        </div>
                    );
                })}
                {classes?.length === 0 && (
                    <div className="col-span-full p-12 text-center border-2 border-dashed border-border rounded-xl text-muted-foreground">
                        No classes created yet.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClassesSection;
