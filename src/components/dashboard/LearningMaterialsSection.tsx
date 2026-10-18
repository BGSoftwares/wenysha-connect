import { useState } from "react";
import { Edit, Eye, FileText, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api";
import {
  useCreateLearningMaterial,
  useDeleteLearningMaterial,
  useLearningMaterials,
  useUpdateLearningMaterial,
  type LearningMaterial,
} from "@/lib/hooks";

const ACCEPT = ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.png,.jpg,.jpeg,.webp,.mp4,.zip";
const MAX_BYTES = 20 * 1024 * 1024;

type NamedOption = { id: number; name: string };

interface Props {
  classes: NamedOption[];
  subjects: NamedOption[];
  uploadedBy: string;
  emptyHint?: string;
}

const LearningMaterialsSection = ({ classes, subjects, uploadedBy, emptyHint }: Props) => {
  const { data: learningMaterials = [] } = useLearningMaterials();
  const createMaterial = useCreateLearningMaterial();
  const updateMaterial = useUpdateLearningMaterial();
  const deleteMaterial = useDeleteLearningMaterial();
  const [file, setFile] = useState<File | null>(null);
  const [draft, setDraft] = useState({ title: "", subject_name: "", class_name: "" });
  const [editing, setEditing] = useState<LearningMaterial | null>(null);
  const [replacementFile, setReplacementFile] = useState<File | null>(null);

  const classNames = new Set(classes.map((item) => item.name));
  const subjectNames = new Set(subjects.map((item) => item.name));
  const visible = learningMaterials.filter((material) => {
    const matchesClass = classNames.size === 0 || classNames.has(material.class_name);
    const matchesSubject = subjectNames.size === 0 || subjectNames.has(material.subject_name);
    return matchesClass && matchesSubject;
  });

  const validateFile = (next: File | null) => {
    if (!next) return "Select a file from your computer.";
    if (next.size > MAX_BYTES) return "File must be 20MB or smaller.";
    return null;
  };

  const handleUpload = async () => {
    const error = !draft.title.trim() || !draft.subject_name || !draft.class_name
      ? "Add a title, class, and subject, then choose a file from your computer."
      : validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }
    try {
      await createMaterial.mutateAsync({
        title: draft.title.trim(),
        subject_name: draft.subject_name,
        class_name: draft.class_name,
        uploaded_by: uploadedBy,
        file: file as File,
      });
      setDraft({ title: "", subject_name: "", class_name: "" });
      setFile(null);
      toast.success("Learning material uploaded from this computer.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold text-foreground">Learning Materials</h2>
        <span className="text-sm text-muted-foreground">{visible.length} files</span>
      </div>

      <div className="grid gap-4">
        {visible.length === 0 ? (
          <div className="bg-card rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
            {emptyHint || "No notes or materials have been uploaded yet. Choose a file from this computer to share with the class."}
          </div>
        ) : (
          visible.map((material) => (
            <div key={material.id} className="bg-card rounded-xl border border-border p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">{material.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {material.subject_name} • {material.class_name || "Class"} • {material.file_type}
                    {material.file_name ? ` • ${material.file_name}` : ""} • {new Date(material.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Uploaded by {material.uploaded_by || "staff"}</span>
                <div className="flex gap-2">
                  {material.file_url ? (
                    <a href={material.file_url} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm" aria-label={`View ${material.title}`}><Eye className="h-4 w-4" /></Button>
                    </a>
                  ) : null}
                  <Button variant="outline" size="sm" aria-label={`Edit ${material.title}`} onClick={() => { setEditing({ ...material }); setReplacementFile(null); }}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label={`Delete ${material.title}`}
                    onClick={async () => {
                      if (!window.confirm(`Delete "${material.title}"?`)) return;
                      try {
                        await deleteMaterial.mutateAsync(material.id);
                        toast.success("Material deleted.");
                      } catch {
                        toast.error("Unable to delete this material.");
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-2 border-dashed border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3 text-foreground">
          <Upload className="h-6 w-6 text-muted-foreground" />
          <div>
            <h3 className="font-medium">Upload from this computer</h3>
            <p className="text-sm text-muted-foreground">PDF, Word, PowerPoint, images, or video notes — no web link required.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <input
            type="text"
            value={draft.title}
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
            placeholder="Material title"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
          <select
            value={draft.class_name}
            onChange={(event) => setDraft((current) => ({ ...current, class_name: event.target.value }))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="">Select class</option>
            {classes.map((schoolClass) => (
              <option key={schoolClass.id} value={schoolClass.name}>{schoolClass.name}</option>
            ))}
          </select>
          <select
            value={draft.subject_name}
            onChange={(event) => setDraft((current) => ({ ...current, subject_name: event.target.value }))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="">Select subject</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.name}>{subject.name}</option>
            ))}
          </select>
          <input
            type="file"
            accept={ACCEPT}
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1 file:text-primary-foreground"
          />
        </div>
        {file ? <p className="text-sm text-muted-foreground">Selected: {file.name}</p> : null}

        <div className="flex justify-end">
          <Button variant="gold" onClick={() => void handleUpload()} disabled={createMaterial.isPending}>
            {createMaterial.isPending ? "Uploading..." : "Upload Material"}
          </Button>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setEditing(null)}>
          <div className="w-full max-w-lg space-y-4 rounded-xl bg-card border border-border p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="border-b border-border pb-3">
              <h3 className="text-xl font-bold">Edit Learning Material</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Update details or replace the file from this computer</p>
            </div>
            <label className="block text-sm">
              Title
              <input
                type="text"
                value={editing.title}
                onChange={(event) => setEditing({ ...editing, title: event.target.value })}
                className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                Class
                <select
                  value={editing.class_name}
                  onChange={(event) => setEditing({ ...editing, class_name: event.target.value })}
                  className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                >
                  <option value="">Select class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.name}>{cls.name}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                Subject
                <select
                  value={editing.subject_name}
                  onChange={(event) => setEditing({ ...editing, subject_name: event.target.value })}
                  className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                >
                  <option value="">Select subject</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.name}>{sub.name}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block text-sm">
              Replace file (optional)
              <input
                type="file"
                accept={ACCEPT}
                onChange={(event) => setReplacementFile(event.target.files?.[0] ?? null)}
                className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1 file:text-primary-foreground"
              />
            </label>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button
                variant="gold"
                disabled={updateMaterial.isPending || !editing.title.trim()}
                onClick={async () => {
                  try {
                    await updateMaterial.mutateAsync({
                      id: editing.id,
                      data: {
                        title: editing.title,
                        class_name: editing.class_name,
                        subject_name: editing.subject_name,
                        file: replacementFile || undefined,
                      },
                    });
                    toast.success("Learning material updated");
                    setEditing(null);
                    setReplacementFile(null);
                  } catch (err) {
                    toast.error(getErrorMessage(err));
                  }
                }}
              >
                {updateMaterial.isPending ? "Saving changes…" : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningMaterialsSection;
