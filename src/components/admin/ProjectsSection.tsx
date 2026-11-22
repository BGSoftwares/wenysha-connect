import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  PROJECT_STATUSES, useDeleteProject, useDeleteProjectItem, useProjects, useSaveProject, useSaveProjectItem, useTeachers,
  type ProjectStatus, type SchoolProject,
} from "@/lib/hooks";
import { getErrorMessage } from "@/lib/api";
import { formatMoney, formatSchoolDate } from "@/lib/finance";

import { confirmAction } from "@/lib/confirm";
const selectClass = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";
const emptyProject = { name: "", description: "", status: "planned" as ProjectStatus, start_date: "", end_date: "", lead: "", budget: "", currency: "USD" as "USD" | "ZWG" };

const ProjectCard = ({ project }: { project: SchoolProject }) => {
  const saveProject = useSaveProject();
  const saveItem = useSaveProjectItem();
  const removeItem = useDeleteProjectItem();
  const removeProject = useDeleteProject();
  const [item, setItem] = useState({ kind: "activity" as "activity" | "resource", title: "", due_date: "", cost: "" });
  const budget = project.budget ? Number(project.budget) : null;
  const spent = Number(project.spent);
  const over = budget !== null && spent > budget;
  const percent = project.progress.total ? Math.round((project.progress.done / project.progress.total) * 100) : 0;

  const run = async (action: () => Promise<unknown>, message?: string) => {
    try {
      await action();
      if (message) toast.success(message);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const addItem = (event: React.FormEvent) => {
    event.preventDefault();
    if (!item.title.trim()) return;
    run(async () => {
      await saveItem.mutateAsync({ project: project.id, kind: item.kind, title: item.title.trim(), due_date: item.due_date || null, cost: item.cost || "0" });
      setItem({ kind: item.kind, title: "", due_date: "", cost: "" });
    });
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{project.name}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {project.lead_name ? `Led by ${project.lead_name}` : "No lead assigned"}
              {project.start_date ? ` · ${formatSchoolDate(project.start_date)}` : ""}{project.end_date ? ` to ${formatSchoolDate(project.end_date)}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select aria-label="Project status" className={`${selectClass} w-36`} value={project.status}
              onChange={(event) => run(() => saveProject.mutateAsync({ id: project.id, status: event.target.value as ProjectStatus }))}>
              {PROJECT_STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
            </select>
            <Button type="button" variant="ghost" size="icon" aria-label={`Delete ${project.name}`}
              onClick={async () => { if ((await confirmAction(`Delete "${project.name}" and everything in it?`))) run(() => removeProject.mutateAsync(project.id), "Project deleted"); }}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {project.description && <p className="text-sm">{project.description}</p>}
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground">Activities done</p>
            <p className="font-semibold">{project.progress.done} of {project.progress.total}</p>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full bg-emerald-600" style={{ width: `${percent}%` }} />
            </div>
          </div>
          <div>
            <p className="text-muted-foreground">Cost so far{budget !== null ? " against budget" : ""}</p>
            <p className={`font-semibold ${over ? "text-rose-700" : ""}`}>
              {formatMoney(spent, project.currency)}{budget !== null ? ` of ${formatMoney(budget, project.currency)}` : ""}{over ? " (over budget)" : ""}
            </p>
          </div>
        </div>

        {project.items.length > 0 && (
          <ul className="divide-y rounded-md border text-sm">
            {project.items.map((entry) => (
              <li key={entry.id} className="flex items-center gap-3 px-3 py-2">
                <input type="checkbox" className="h-4 w-4" aria-label={`Mark ${entry.title} done`} checked={entry.done}
                  onChange={(event) => run(() => saveItem.mutateAsync({ id: entry.id, done: event.target.checked }))} />
                <div className="min-w-0 flex-1">
                  <p className={entry.done ? "text-muted-foreground line-through" : ""}>{entry.title}</p>
                  <p className="text-xs text-muted-foreground">{entry.kind === "resource" ? "Resource" : "Activity"}{entry.due_date ? ` · due ${formatSchoolDate(entry.due_date)}` : ""}</p>
                </div>
                {Number(entry.cost) > 0 && <span className="shrink-0 text-xs">{formatMoney(Number(entry.cost), project.currency)}</span>}
                <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${entry.title}`} onClick={() => run(() => removeItem.mutateAsync(entry.id))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={addItem} className="grid gap-2 sm:grid-cols-[130px_1fr_150px_110px_auto]">
          <select aria-label="Type" className={selectClass} value={item.kind} onChange={(event) => setItem({ ...item, kind: event.target.value as "activity" | "resource" })}>
            <option value="activity">Activity</option><option value="resource">Resource</option>
          </select>
          <Input aria-label="What" placeholder="Activity or resource" value={item.title} onChange={(event) => setItem({ ...item, title: event.target.value })} />
          <Input aria-label="Due date" type="date" value={item.due_date} onChange={(event) => setItem({ ...item, due_date: event.target.value })} />
          <Input aria-label="Cost" type="number" min="0" step="0.01" placeholder="Cost" value={item.cost} onChange={(event) => setItem({ ...item, cost: event.target.value })} />
          <Button type="submit" disabled={saveItem.isPending}>Add</Button>
        </form>
      </CardContent>
    </Card>
  );
};

const ProjectsSection = () => {
  const { data: projects = [], isLoading, error } = useProjects();
  const { data: teachers = [] } = useTeachers();
  const save = useSaveProject();
  const [form, setForm] = useState(emptyProject);
  const set = (key: keyof typeof emptyProject, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await save.mutateAsync({
        name: form.name.trim(), description: form.description.trim(), status: form.status,
        start_date: form.start_date || null, end_date: form.end_date || null,
        lead: form.lead ? Number(form.lead) : null, budget: form.budget || null, currency: form.currency,
      });
      toast.success("Project created");
      setForm(emptyProject);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold">Projects</h2>
        <p className="text-sm text-muted-foreground">Plan school projects and events: the activities to do, the resources needed, and what they cost against the budget.</p>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">New project</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={create} className="grid gap-3 md:grid-cols-3">
            <Input required aria-label="Project name" placeholder="Project name" value={form.name} onChange={(event) => set("name", event.target.value)} className="md:col-span-2" />
            <select aria-label="Project lead" className={selectClass} value={form.lead} onChange={(event) => set("lead", event.target.value)}>
              <option value="">No lead yet</option>
              {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}
            </select>
            <Input aria-label="Start date" type="date" value={form.start_date} onChange={(event) => set("start_date", event.target.value)} />
            <Input aria-label="End date" type="date" value={form.end_date} onChange={(event) => set("end_date", event.target.value)} />
            <select aria-label="Status" className={selectClass} value={form.status} onChange={(event) => set("status", event.target.value)}>
              {PROJECT_STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
            </select>
            <Input aria-label="Budget" type="number" min="0" step="0.01" placeholder="Budget (optional)" value={form.budget} onChange={(event) => set("budget", event.target.value)} />
            <select aria-label="Currency" className={selectClass} value={form.currency} onChange={(event) => set("currency", event.target.value)}>
              <option value="USD">US dollars</option><option value="ZWG">Zimbabwe Gold</option>
            </select>
            <Input aria-label="Description" placeholder="What is this project for?" value={form.description} onChange={(event) => set("description", event.target.value)} />
            <div className="md:col-span-3"><Button type="submit" disabled={save.isPending}><Plus className="mr-2 h-4 w-4" />Create project</Button></div>
          </form>
        </CardContent>
      </Card>

      {isLoading && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading projects</p>}
      {error && <p className="text-sm text-destructive">{getErrorMessage(error)}</p>}
      {!isLoading && !error && projects.length === 0 && <p className="text-sm text-muted-foreground">No projects yet. Create the first one above.</p>}
      <div className="space-y-4">{projects.map((project) => <ProjectCard key={project.id} project={project} />)}</div>
    </div>
  );
};

export default ProjectsSection;
