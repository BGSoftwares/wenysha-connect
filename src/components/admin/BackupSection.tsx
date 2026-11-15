import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Download, HardDriveDownload, Loader2, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, downloadAuthenticatedFile, getErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Backup = { name: string; size: number; created_at: string; created_by: string; includes_files: boolean };
type BackupList = { results: Backup[]; keep: number };

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

const BackupSection = () => {
  const client = useQueryClient();
  const [includeFiles, setIncludeFiles] = useState(false);
  const [toDelete, setToDelete] = useState<Backup | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const backups = useQuery({ queryKey: ["portal-backups"], queryFn: () => api.get<BackupList>("/auth/backups/") });
  const refresh = () => client.invalidateQueries({ queryKey: ["portal-backups"] });

  const create = useMutation({
    mutationFn: () => api.post<Backup>("/auth/backups/", { include_files: includeFiles }),
    onSuccess: () => { toast.success("Backup created"); void refresh(); },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const remove = useMutation({
    mutationFn: (name: string) => api.delete(`/auth/backups/${name}/`),
    onSuccess: () => { toast.success("Backup deleted"); setToDelete(null); void refresh(); },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const download = async (backup: Backup) => {
    setDownloading(backup.name);
    try {
      await downloadAuthenticatedFile(`/auth/backups/${backup.name}/`, backup.name);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDownloading(null);
    }
  };

  const items = backups.data?.results ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold text-foreground">Backups</h2>
        <p className="text-sm text-muted-foreground">Save a copy of the school's records, then download it to keep somewhere safe.</p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <HardDriveDownload className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-semibold text-foreground">Back up now</h3>
              <p className="max-w-xl text-sm text-muted-foreground">
                Saves students, teachers, classes, marks, attendance, notices, fees and the rest of the school's records. Passwords,
                sign-in tokens and two-step verification secrets are never included.
              </p>
              <label className="mt-3 flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={includeFiles}
                  onChange={(e) => setIncludeFiles(e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-[hsl(var(--primary))]"
                />
                Also include uploaded files (photos, documents). Makes the backup much larger.
              </label>
            </div>
          </div>
          <Button variant="gold" onClick={() => create.mutate()} disabled={create.isPending} className="shrink-0">
            {create.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating backup…</> : <><Archive className="mr-2 h-4 w-4" />Back up now</>}
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <header className="mb-4 flex items-baseline justify-between gap-3">
          <h3 className="font-heading text-lg font-semibold text-foreground">Saved backups</h3>
          {backups.data && <p className="text-xs text-muted-foreground">The {backups.data.keep} newest are kept. Older ones are removed automatically.</p>}
        </header>

        {backups.isLoading ? (
          <div className="space-y-2" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />)}</div>
        ) : backups.error ? (
          <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            Backups could not be loaded: {getErrorMessage(backups.error)}
          </p>
        ) : items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
            No backups yet. Choose Back up now to make the first one.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((b) => (
              <li key={b.name} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">
                    {new Date(b.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatSize(b.size)} · made by {b.created_by} · {b.includes_files ? "records and files" : "records only"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => void download(b)} disabled={downloading === b.name}>
                    {downloading === b.name ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Download className="mr-1.5 h-4 w-4" />}
                    Download
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setToDelete(b)} aria-label={`Delete backup from ${new Date(b.created_at).toLocaleDateString()}`}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          These backups hold learners' names, results and fees. Keep downloaded files private. They do not replace the server's daily
          database backup, which also covers accounts and passwords and is what you restore from after a failure.
        </span>
      </p>

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this backup?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete && `The backup from ${new Date(toDelete.created_at).toLocaleString()} will be removed from the server. This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep backup</AlertDialogCancel>
            <AlertDialogAction onClick={() => toDelete && remove.mutate(toDelete.name)}>Delete backup</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BackupSection;
