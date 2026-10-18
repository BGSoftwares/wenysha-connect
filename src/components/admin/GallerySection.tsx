import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Edit, Image as ImageIcon, Upload, Video as VideoIcon, Link as LinkIcon, X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type GalleryImage = {
  id: number;
  title: string;
  category: string;
  item_type: string;
  image_url: string;
  date: string | null;
};

const getRows = (response: GalleryImage[] | { results?: GalleryImage[] }) =>
  Array.isArray(response) ? response : response.results ?? [];
const path = "/content/gallery/";

const isVideoUrl = (url: string, itemType?: string) => {
  if (itemType === "video") return true;
  return /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(url);
};

const GallerySection = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["admin-gallery"],
    queryFn: async () => getRows(await api.get<GalleryImage[] | { results?: GalleryImage[] }>(path)),
  });

  const [open, setOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<"device" | "url">("device");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [draft, setDraft] = useState({
    title: "",
    category: "Events",
    image_url: "",
    item_type: "image",
    date: new Date().toISOString().slice(0, 10),
  });

  const [editingItem, setEditingItem] = useState<GalleryImage | null>(null);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editFilePreview, setEditFilePreview] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<"device" | "url">("device");

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-gallery"] });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error("File size must be under 50MB");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const isVideo = file.type.startsWith("video/") || /\.(mp4|mov|webm)$/i.test(file.name);

    if (isEdit) {
      setEditFile(file);
      setEditFilePreview(previewUrl);
      if (editingItem) {
        setEditingItem({
          ...editingItem,
          item_type: isVideo ? "video" : "image",
        });
      }
    } else {
      setSelectedFile(file);
      setFilePreview(previewUrl);
      setDraft((curr) => ({
        ...curr,
        title: curr.title || file.name.replace(/\.[^/.]+$/, ""),
        item_type: isVideo ? "video" : "image",
      }));
    }
  };

  const uploadFileToMedia = async (file: File, title: string, category: string): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title || file.name);
    formData.append("subject_name", "School Gallery");
    formData.append("class_name", category);
    formData.append("uploaded_by", "Admin");

    const res = await api.postForm<{ file_url: string }>("/content/materials/", formData);
    return res.file_url;
  };

  const handleAddSubmit = async () => {
    if (!draft.title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (uploadMode === "device" && !selectedFile && !draft.image_url) {
      toast.error("Please select a photo or video from your device");
      return;
    }

    if (uploadMode === "url" && !draft.image_url.trim()) {
      toast.error("Please enter an image or video URL");
      return;
    }

    setIsSubmitting(true);
    try {
      let finalUrl = draft.image_url.trim();
      let itemType = draft.item_type;

      if (uploadMode === "device" && selectedFile) {
        toast.info("Uploading media from device...");
        finalUrl = await uploadFileToMedia(selectedFile, draft.title, draft.category);
        itemType = selectedFile.type.startsWith("video/") ? "video" : "image";
      }

      await api.post(path, {
        title: draft.title.trim(),
        category: draft.category,
        image_url: finalUrl,
        item_type: itemType,
        date: draft.date,
      });

      void refresh();
      setOpen(false);
      setSelectedFile(null);
      setFilePreview(null);
      setDraft({
        title: "",
        category: "Events",
        image_url: "",
        item_type: "image",
        date: new Date().toISOString().slice(0, 10),
      });
      toast.success("Gallery item added successfully!");
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!editingItem) return;
    if (!editingItem.title.trim()) {
      toast.error("Title is required");
      return;
    }

    setIsSubmitting(true);
    try {
      let finalUrl = editingItem.image_url;
      let itemType = editingItem.item_type;

      if (editMode === "device" && editFile) {
        toast.info("Uploading replacement media from device...");
        finalUrl = await uploadFileToMedia(editFile, editingItem.title, editingItem.category);
        itemType = editFile.type.startsWith("video/") ? "video" : "image";
      }

      await api.patch(`${path}${editingItem.id}/`, {
        ...editingItem,
        image_url: finalUrl,
        item_type: itemType,
      });

      void refresh();
      setEditingItem(null);
      setEditFile(null);
      setEditFilePreview(null);
      toast.success("Gallery item updated");
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setIsSubmitting(false);
    }
  };

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`${path}${id}/`),
    onSuccess: () => {
      void refresh();
      toast.success("Gallery item removed");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold">Gallery Management</h2>
          <p className="text-sm text-muted-foreground">Upload and manage school photos, event albums, and videos</p>
        </div>
        <Button onClick={() => setOpen(true)} variant="gold">
          <Plus className="mr-2 h-4 w-4" />
          Add Photo / Video
        </Button>
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-muted-foreground">Loading gallery...</p>
      ) : error ? (
        <p className="rounded-xl border border-destructive/30 p-5 text-destructive">Could not load gallery: {getErrorMessage(error)}</p>
      ) : data.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
          <ImageIcon className="mx-auto mb-3 h-10 w-10 opacity-40" />
          No gallery items yet. Click &quot;Add Photo / Video&quot; to upload the first memory from your device.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.map((img) => {
            const isVid = isVideoUrl(img.image_url, img.item_type);
            return (
              <div key={img.id} className="overflow-hidden rounded-2xl border bg-card shadow-sm hover:shadow-md transition-shadow">
                <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-secondary">
                  {img.image_url ? (
                    isVid ? (
                      <video src={img.image_url} controls className="h-full w-full object-cover" preload="metadata" />
                    ) : (
                      <img src={img.image_url} alt={img.title} className="h-full w-full object-cover" />
                    )
                  ) : (
                    <ImageIcon className="h-12 w-12 text-muted-foreground/40" />
                  )}
                  {isVid && (
                    <span className="absolute top-2 left-2 rounded-md bg-black/70 px-2 py-0.5 text-xs text-white flex items-center gap-1">
                      <VideoIcon className="h-3 w-3 text-gold" /> Video
                    </span>
                  )}
                </div>
                <div className="flex items-start justify-between gap-2 p-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-foreground">{img.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {img.category}
                      {img.date ? ` • ${img.date}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label={`Edit ${img.title}`}
                      onClick={() => {
                        setEditingItem({ ...img });
                        setEditMode("device");
                        setEditFile(null);
                        setEditFilePreview(null);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label={`Delete ${img.title}`}
                      onClick={() => window.confirm(`Remove "${img.title}" from the gallery?`) && remove.mutate(img.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Media Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setOpen(false)}>
          <div className="w-full max-w-lg space-y-4 rounded-xl bg-card border border-border p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-xl font-bold">Add Photo or Video to Gallery</h3>
                <p className="text-xs text-muted-foreground">Upload from your computer/device or paste a link</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Source Mode Selector */}
            <div className="flex rounded-lg border border-border p-1 bg-muted/30">
              <button
                type="button"
                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                  uploadMode === "device" ? "bg-card text-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setUploadMode("device")}
              >
                <Upload className="h-3.5 w-3.5 text-primary" />
                Upload from This Device
              </button>
              <button
                type="button"
                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                  uploadMode === "url" ? "bg-card text-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setUploadMode("url")}
              >
                <LinkIcon className="h-3.5 w-3.5" />
                Web URL Link
              </button>
            </div>

            {/* Device File Picker */}
            {uploadMode === "device" ? (
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*,.mp4,.mov,.webm"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, false)}
                />

                {filePreview ? (
                  <div className="relative rounded-xl border border-border overflow-hidden bg-muted/40 p-2">
                    <div className="flex items-center gap-3">
                      {selectedFile?.type.startsWith("video/") ? (
                        <div className="h-16 w-20 rounded-lg bg-black/80 flex items-center justify-center text-white shrink-0">
                          <VideoIcon className="h-8 w-8 text-gold" />
                        </div>
                      ) : (
                        <img src={filePreview} alt="Preview" className="h-16 w-20 rounded-lg object-cover shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{selectedFile?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedFile ? (selectedFile.size / (1024 * 1024)).toFixed(2) : 0} MB • {selectedFile?.type.startsWith("video/") ? "Video" : "Photo"}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-xs text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Ready to upload
                          </span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedFile(null);
                          setFilePreview(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border hover:border-primary/60 cursor-pointer rounded-xl p-6 text-center transition-all bg-card hover:bg-muted/30"
                  >
                    <Upload className="mx-auto h-8 w-8 text-primary/80 mb-2" />
                    <p className="text-sm font-medium text-foreground">Click to select photo or video from this computer</p>
                    <p className="text-xs text-muted-foreground mt-1">Supports JPG, PNG, WEBP, MP4, MOV (up to 50MB)</p>
                  </div>
                )}
              </div>
            ) : (
              <label className="block text-sm">
                Image or Video URL
                <Input
                  type="url"
                  placeholder="https://images.unsplash.com/... or https://..."
                  value={draft.image_url}
                  onChange={(e) => setDraft({ ...draft, image_url: e.target.value })}
                  className="mt-1"
                />
              </label>
            )}

            <label className="block text-sm">
              Title / Caption
              <Input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="e.g. Science Fair 2026 or Inter-house Sports"
                className="mt-1"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                Category
                <select
                  className="mt-1 w-full rounded-lg border border-border bg-background p-2 text-sm"
                  value={draft.category}
                  onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                >
                  {["Events", "Academic", "Sports", "Campus", "Arts"].map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>

              <label className="block text-sm">
                Date
                <Input
                  type="date"
                  value={draft.date}
                  onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                  className="mt-1"
                />
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                variant="gold"
                disabled={isSubmitting || !draft.title.trim() || (uploadMode === "device" ? !selectedFile && !draft.image_url : !draft.image_url.trim())}
                onClick={handleAddSubmit}
              >
                {isSubmitting ? "Uploading..." : "Add to Gallery"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Media Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setEditingItem(null)}>
          <div className="w-full max-w-lg space-y-4 rounded-xl bg-card border border-border p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-xl font-bold">Edit Gallery Item</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Update details or upload a new photo/video from your device</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setEditingItem(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Current Media Preview */}
            <div className="rounded-xl border border-border overflow-hidden bg-secondary aspect-[16/9] max-h-48 relative flex items-center justify-center">
              {editFilePreview ? (
                editFile?.type.startsWith("video/") ? (
                  <video src={editFilePreview} controls className="h-full w-full object-cover" />
                ) : (
                  <img src={editFilePreview} alt="New Preview" className="h-full w-full object-cover" />
                )
              ) : editingItem.image_url ? (
                isVideoUrl(editingItem.image_url, editingItem.item_type) ? (
                  <video src={editingItem.image_url} controls className="h-full w-full object-cover" />
                ) : (
                  <img src={editingItem.image_url} alt={editingItem.title} className="h-full w-full object-cover" />
                )
              ) : (
                <ImageIcon className="h-12 w-12 text-muted-foreground/40" />
              )}
            </div>

            {/* Replace Source Toggle */}
            <div className="flex rounded-lg border border-border p-1 bg-muted/30">
              <button
                type="button"
                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                  editMode === "device" ? "bg-card text-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setEditMode("device")}
              >
                <Upload className="h-3.5 w-3.5 text-primary" />
                Replace from Device
              </button>
              <button
                type="button"
                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                  editMode === "url" ? "bg-card text-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setEditMode("url")}
              >
                <LinkIcon className="h-3.5 w-3.5" />
                Edit URL Link
              </button>
            </div>

            {editMode === "device" ? (
              <div>
                <input
                  ref={editFileInputRef}
                  type="file"
                  accept="image/*,video/*,.mp4,.mov,.webm"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, true)}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-dashed"
                  onClick={() => editFileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {editFile ? `Selected: ${editFile.name}` : "Choose new photo or video from device"}
                </Button>
              </div>
            ) : (
              <label className="block text-sm">
                Image or Video URL
                <Input
                  type="url"
                  value={editingItem.image_url}
                  onChange={(e) => setEditingItem({ ...editingItem, image_url: e.target.value })}
                  className="mt-1"
                />
              </label>
            )}

            <label className="block text-sm">
              Title
              <Input
                value={editingItem.title}
                onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                className="mt-1"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                Category
                <select
                  className="mt-1 w-full rounded-lg border border-border bg-background p-2 text-sm"
                  value={editingItem.category}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                >
                  {["Events", "Academic", "Sports", "Campus", "Arts"].map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>

              <label className="block text-sm">
                Date
                <Input
                  type="date"
                  value={editingItem.date ? editingItem.date.slice(0, 10) : ""}
                  onChange={(e) => setEditingItem({ ...editingItem, date: e.target.value })}
                  className="mt-1"
                />
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button variant="outline" onClick={() => setEditingItem(null)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                variant="gold"
                disabled={isSubmitting || !editingItem.title.trim()}
                onClick={handleEditSubmit}
              >
                {isSubmitting ? "Saving changes..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GallerySection;
