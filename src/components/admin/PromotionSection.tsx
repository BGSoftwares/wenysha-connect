import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowUp, Download, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/lib/api";
import { useClasses, useStudents } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const PromotionSection = () => {
  const client = useQueryClient();
  const { data: students = [], isLoading, error } = useStudents();
  const { data: classes = [] } = useClasses();
  const [sourceClass, setSourceClass] = useState("");
  const [targetClass, setTargetClass] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const visible = useMemo(() => students.filter(s => s.status === "Active" && (!sourceClass || String(s.school_class) === sourceClass) && `${s.name} ${s.student_id}`.toLowerCase().includes(search.toLowerCase())), [students, sourceClass, search]);
  const toggle = (id: number) => setSelected(current => current.includes(id) ? current.filter(x => x !== id) : [...current, id]);
  const promote = async () => {
    if (!selected.length || !targetClass || selected.some(id => students.find(s => s.id === id)?.school_class === Number(targetClass))) { toast.error("Select students and a different destination class"); return; }
    if (!window.confirm(`Move ${selected.length} selected student record(s) to ${classes.find(c => c.id === Number(targetClass))?.name}?`)) return;
    const results = await Promise.allSettled(selected.map(id => api.patch(`/school/students/${id}/`, { school_class: Number(targetClass) })));
    const failed = results.filter(x => x.status === "rejected");
    await client.invalidateQueries({ queryKey: ["students"] });
    setSelected([]);
    if (failed.length) toast.error(`${results.length - failed.length} promoted; ${failed.length} could not be updated. ${getErrorMessage((failed[0] as PromiseRejectedResult).reason)}`);
    else toast.success(`${selected.length} student(s) promoted to the selected class`);
  };
  const exportCsv = () => {
    const content = ["Student ID,Name,Current Class,Status", ...visible.map(s => [s.student_id, s.name, s.class_name, s.status].map(x => `"${String(x).replaceAll('"', '""')}"`).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv" })); const a = document.createElement("a"); a.href = url; a.download = "able-god-college-student-register.csv"; a.click(); URL.revokeObjectURL(url);
  };
  return <div className="space-y-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-heading text-2xl font-bold">Student Class Promotion</h2><p className="text-sm text-muted-foreground">Update real student class records. Academic eligibility must be reviewed by staff.</p></div><Button variant="outline" onClick={exportCsv}><Download className="mr-2 h-4 w-4"/>Export Register</Button></div><div className="grid gap-4 md:grid-cols-3"><Card><CardContent className="flex items-center gap-3 p-4"><Users className="h-5 w-5 text-primary"/><div><p className="text-2xl font-bold">{students.length}</p><p className="text-xs text-muted-foreground">Student records</p></div></CardContent></Card><Card><CardContent className="p-4"><p className="text-2xl font-bold">{visible.length}</p><p className="text-xs text-muted-foreground">Students in selection</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-2xl font-bold">{selected.length}</p><p className="text-xs text-muted-foreground">Selected to move</p></CardContent></Card></div><div className="flex flex-col gap-3 lg:flex-row"><select className="rounded-lg border bg-background px-3 py-2" value={sourceClass} onChange={e=>{setSourceClass(e.target.value);setSelected([]);}}><option value="">All current classes</option>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><select className="rounded-lg border bg-background px-3 py-2" value={targetClass} onChange={e=>setTargetClass(e.target.value)}><option value="">Destination class</option>{classes.filter(c=>String(c.id)!==sourceClass).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><Input className="pl-10" placeholder="Search by student name or ID" value={search} onChange={e=>setSearch(e.target.value)}/></div><Button variant="gold" disabled={!selected.length||!targetClass} onClick={()=>void promote()}><ArrowUp className="mr-2 h-4 w-4"/>Promote selected</Button></div>{isLoading?<p className="py-8 text-center text-muted-foreground">Loading students…</p>:error?<p className="text-destructive">{getErrorMessage(error)}</p>:<div className="overflow-x-auto rounded-xl border bg-card"><table className="w-full"><thead className="bg-secondary/50"><tr><th className="p-3 text-left"><input type="checkbox" aria-label="Select all visible" checked={visible.length>0&&visible.every(s=>selected.includes(s.id))} onChange={e=>setSelected(e.target.checked?visible.map(s=>s.id):selected.filter(id=>!visible.some(s=>s.id===id)))}/></th>{["Student ID","Name","Current class","Status"].map(k=><th key={k} className="p-3 text-left text-sm">{k}</th>)}</tr></thead><tbody>{visible.map(s=><tr key={s.id} className="border-t"><td className="p-3"><input type="checkbox" aria-label={`Select ${s.name}`} checked={selected.includes(s.id)} onChange={()=>toggle(s.id)}/></td><td className="p-3">{s.student_id}</td><td className="p-3 font-medium">{s.name}</td><td className="p-3">{s.class_name}</td><td className="p-3">{s.status}</td></tr>)}{visible.length===0&&<tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No active students in this selection.</td></tr>}</tbody></table></div>}</div>;
};
export default PromotionSection;
