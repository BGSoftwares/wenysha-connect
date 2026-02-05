import { ChevronLeft, ChevronRight } from "lucide-react";

interface TimetableSectionProps {
    classes: any[];
}

const TimetableSection = ({ classes }: TimetableSectionProps) => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const periods = [
        { time: "08:00-08:40", label: "Period 1" },
        { time: "08:40-09:20", label: "Period 2" },
        { time: "09:20-10:00", label: "Period 3" },
        { time: "10:00-10:30", label: "Break", isBreak: true },
        { time: "10:30-11:10", label: "Period 4" },
        { time: "11:10-11:50", label: "Period 5" },
        { time: "11:50-12:30", label: "Period 6" },
        { time: "12:30-14:00", label: "Lunch", isBreak: true },
        { time: "14:00-14:40", label: "Period 7" },
        { time: "14:40-15:20", label: "Period 8" },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h2 className="font-heading text-xl font-bold text-foreground">School Timetable</h2>
                <div className="flex items-center gap-3">
                    <select className="px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                        <option>Select Class</option>
                        {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                    <div className="flex border border-border rounded-lg overflow-hidden">
                        <button className="p-2 hover:bg-secondary transition-colors"><ChevronLeft className="h-4 w-4" /></button>
                        <button className="p-2 hover:bg-secondary transition-colors border-l border-border"><ChevronRight className="h-4 w-4" /></button>
                    </div>
                </div>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-elegant overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] border-collapse">
                        <thead>
                            <tr className="bg-secondary/30">
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground border-r border-border/50 sticky left-0 bg-background z-10 w-32">
                                    Time Slot
                                </th>
                                {days.map(day => (
                                    <th key={day} className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        {day}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {periods.map((period, idx) => (
                                <tr key={period.time} className={period.isBreak ? "bg-secondary/10" : "hover:bg-secondary/5 transition-colors"}>
                                    <td className="px-6 py-5 text-xs font-bold text-foreground border-r border-border/50 sticky left-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col">
                                        <span>{period.time}</span>
                                        <span className="text-[10px] text-muted-foreground font-normal mt-0.5">{period.label}</span>
                                    </td>
                                    {days.map(day => (
                                        <td key={day} className="px-3 py-3 text-center border-r border-border last:border-0 group">
                                            {period.isBreak ? (
                                                <div className="text-[10px] font-bold text-muted-foreground uppercase py-2 tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">
                                                    {period.label}
                                                </div>
                                            ) : (
                                                <div className="mx-auto max-w-[140px] p-2.5 rounded-xl bg-white dark:bg-background border border-border shadow-sm group-hover:shadow-md group-hover:border-primary/30 transition-all hover:-translate-y-0.5 pointer-events-none">
                                                    <p className="text-xs font-bold text-foreground truncate">Mathematics</p>
                                                    <p className="text-[10px] text-primary font-medium mt-1">Form 4A</p>
                                                    <p className="text-[9px] text-muted-foreground mt-0.5">Room 203</p>
                                                </div>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mt-8">
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-center gap-4">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <div>
                        <p className="text-xs font-bold text-foreground">Core Subjects</p>
                        <p className="text-[10px] text-muted-foreground">Mandatory curriculum</p>
                    </div>
                </div>
                <div className="p-4 rounded-xl bg-accent/5 border border-accent/10 flex items-center gap-4">
                    <div className="h-2 w-2 rounded-full bg-accent" />
                    <div>
                        <p className="text-xs font-bold text-foreground">Electives</p>
                        <p className="text-[10px] text-muted-foreground">Student choice modules</p>
                    </div>
                </div>
                <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/10 flex items-center gap-4">
                    <div className="h-2 w-2 rounded-full bg-destructive" />
                    <div>
                        <p className="text-xs font-bold text-foreground">Exams/Tests</p>
                        <p className="text-[10px] text-muted-foreground">Assessment slots</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimetableSection;
