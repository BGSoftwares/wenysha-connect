import { useState, useRef, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Edit, Image as ImageIcon, Upload, Video as VideoIcon, Link as LinkIcon, X, CheckCircle2, Search, SlidersHorizontal, Sparkles } from "lucide-react";
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
  description?: string;
  show_on_homepage?: boolean;
  display_order?: number;
  display_mode?: "cover" | "contain";
  date: string | null;
};

const getRows = (response: GalleryImage[] | { results?: GalleryImage[] }) =>
  Array.isArray(response) ? response : response.results ?? [];
const path = "/content/gallery/";

const isVideoUrl = (url: string, itemType?: string) => {
  if (itemType === "video") return true;
  return /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(url);
};

const CATEGORIES = [
  "All",
  "Hero Carousel",
  "School Photos",
  "School Posters & Designs",
  "Events",
  "Academic",
  "Campus",
  "Sports",
  "Arts",
];

const GallerySection = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Fetch all gallery items (including homepage hero slides)
  const { data = [], isLoading, error } = useQuery({
    queryKey: ["admin-gallery"],
    queryFn: async () => getRows(await api.get<GalleryImage[] | { results?: GalleryImage[] }>(path)),
  });

  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const [open, setOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<"device" | "url">("device");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [draft, setDraft] = useState({
    title: "",
    category: "School Photos",
    description: "",
    image_url: "",
    item_type: "image",
    show_on_homepage: false,
    display_mode: "cover" as "cover" | "contain",
    date: new Date().toISOString().slice(0, 10),
  });

  const [editingItem, setEditingItem] = useState<GalleryImage | null>(null);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editFilePreview, setEditFilePreview] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<"device" | "url">("device");

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-gallery"] });
    void queryClient.invalidateQueries({ queryKey: ["hero-carousel"] });
    void queryClient.invalidateQueries({ queryKey: ["public-gallery"] });
  };

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
      let itemType = draft.item_type;

      if (uploadMode === "device" && selectedFile) {
        toast.info("Uploading media...");
        itemType = selectedFile.type.startsWith("video/") ? "video" : "image";
        const formData = new FormData();
        formData.append("title", draft.title.trim());
        formData.append("category", draft.category);
        formData.append("description", draft.description.trim());
        formData.append("item_type", itemType);
        formData.append("show_on_homepage", draft.show_on_homepage ? "true" : "false");
        formData.append("display_mode", draft.display_mode);
        formData.append("date", draft.date);
        formData.append("media_file", selectedFile);
        await api.postForm(path, formData);
      } else {
        await api.post(path, {
          title: draft.title.trim(),
          category: draft.category,
          description: draft.description.trim(),
          image_url: draft.image_url.trim(),
          item_type: itemType,
          show_on_homepage: draft.show_on_homepage,
          display_mode: draft.display_mode,
          date: draft.date,
        });
      }

      refresh();
      setOpen(false);
      setSelectedFile(null);
      setFilePreview(null);
      setDraft({
        title: "",
        category: "School Photos",
        description: "",
        image_url: "",
        item_type: "image",
        show_on_homepage: false,
        display_mode: "cover",
        date: new Date().toISOString().slice(0, 10),
      });
      toast.success("Picture added successfully!");
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
      let itemType = editingItem.item_type;

      if (editMode === "device" && editFile) {
        toast.info("Uploading replacement picture...");
        itemType = editFile.type.startsWith("video/") ? "video" : "image";
        const formData = new FormData();
        formData.append("title", editingItem.title.trim());
        formData.append("category", editingItem.category);
        formData.append("description", editingItem.description || "");
        formData.append("item_type", itemType);
        formData.append("show_on_homepage", editingItem.show_on_homepage ? "true" : "false");
        formData.append("display_mode", editingItem.display_mode || "cover");
        formData.append("date", editingItem.date ?? "");
        formData.append("media_file", editFile);
        await api.patchForm(`${path}${editingItem.id}/`, formData);
      } else {
        await api.patch(`${path}${editingItem.id}/`, {
          title: editingItem.title.trim(),
          category: editingItem.category,
          description: editingItem.description || "",
          image_url: editingItem.image_url,
          item_type: itemType,
          show_on_homepage: editingItem.show_on_homepage,
          display_mode: editingItem.display_mode || "cover",
          date: editingItem.date,
        });
      }

      refresh();
      setEditingItem(null);
      setEditFile(null);
      setEditFilePreview(null);
      toast.success("Picture updated successfully!");
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setIsSubmitting(false);
    }
  };

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`${path}${id}/`),
    onSuccess: () => {
      refresh();
      toast.success("Picture removed");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  // Filtered items
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesCategory =
        activeCategory === "All"
          ? true
          : activeCategory === "Hero Carousel"
          ? item.category === "Hero Carousel" || item.show_on_homepage
          : item.category.toLowerCase() === activeCategory.toLowerCase();

      const matchesSearch =
        !searchQuery.trim() ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [data, activeCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">Picture &amp; Media Management</h2>
          <p className="text-sm text-muted-foreground">Manage and update every picture across Able God College: carousel slides, campus photos, and posters.</p>
        </div>
        <Button onClick={() => setOpen(true)} variant="gold" className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Add Photo / Video
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const count =
              cat === "All"
                ? data.length
                : cat === "Hero Carousel"
                ? data.filter((i) => i.category === "Hero Carousel" || i.show_on_homepage).length
                : data.filter((i) => i.category.toLowerCase() === cat.toLowerCase()).length;
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-border text-foreground"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search pictures..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* Grid of Pictures */}
      {isLoading ? (
        <p className="py-12 text-center text-muted-foreground">Loading pictures…</p>
      ) : error ? (
        <p className="rounded-xl border border-destructive/30 p-5 text-destructive">Could not load pictures: {getErrorMessage(error)}</p>
      ) : filteredData.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground bg-card">
          <ImageIcon className="mx-auto mb-3 h-10 w-10 opacity-40 text-primary" />
          <p className="font-semibold text-foreground">No pictures found in this category.</p>
          <p className="text-xs text-muted-foreground mt-1">Try selecting another category or click &quot;Add Photo / Video&quot; to upload one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredData.map((img) => {
            const isVid = isVideoUrl(img.image_url, img.item_type);
            return (
              <div key={img.id} className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all flex flex-col">
                {/* Media Container with Adaptive Dark Scrim for Perfect Text Contrast */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-950 flex items-center justify-center">
                  {img.image_url ? (
                    isVid ? (
                      <video src={img.image_url} controls className="h-full w-full object-cover" preload="metadata" />
                    ) : (
                      <img
                        src={img.image_url}
                        alt={img.title}
                        className={`h-full w-full transition-transform duration-500 group-hover:scale-105 ${img.display_mode === "contain" ? "object-contain bg-slate-900" : "object-cover"}`}
                        loading="lazy"
                      />
                    )
                  ) : (
                    <ImageIcon className="h-12 w-12 text-white/40" />
                  )}

                  {/* High contrast badges over image regardless of brightness */}
                  <div className="absolute top-2.5 left-2.5 flex flex-wrap items-center gap-1.5 z-10">
                    <span className="rounded-md bg-black/80 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-md border border-white/20 shadow-md">
                      {img.category}
                    </span>
                    {img.show_on_homepage && (
                      <span className="rounded-md bg-[#c51f67] px-2 py-0.5 text-[11px] font-bold text-white shadow-md">
                        Homepage
                      </span>
                    )}
                    {isVid && (
                      <span className="rounded-md bg-black/85 px-2 py-0.5 text-[11px] font-semibold text-amber-300 flex items-center gap-1 border border-white/20">
                        <VideoIcon className="h-3 w-3" /> Video
                      </span>
                    )}
                  </div>

                  {/* Dark gradient scrim at the bottom so title text is 100% readable even on bright white photos */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent p-3 pt-8 pointer-events-none">
                    <p className="truncate text-xs font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                      {img.title}
                    </p>
                  </div>
                </div>

                {/* Card Content Body */}
                <div className="p-4 flex-1 flex flex-col justify-between bg-card">
                  <div>
                    <h3 className="truncate font-semibold text-sm text-foreground">{img.title}</h3>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground font-medium">
                      <span>{img.category}</span>
                      {img.date && <span>• {img.date}</span>}
                    </div>
                    {img.description && (
                      <p className="mt-1.5 text-xs text-muted-foreground/80 line-clamp-2">{img.description}</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-[11px] font-medium text-muted-foreground">
                      ID #{img.id}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2.5 text-xs gap-1"
                        aria-label={`Edit ${img.title}`}
                        onClick={() => {
                          setEditingItem({ ...img });
                          setEditMode(img.image_url?.startsWith("http") ? "url" : "device");
                          setEditFile(null);
                          setEditFilePreview(null);
                        }}
                      >
                        <Edit className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-destructive/10"
                        aria-label={`Delete ${img.title}`}
                        onClick={() => window.confirm(`Remove "${img.title}" from the school gallery?`) && remove.mutate(img.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Media Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto" onClick={() => setOpen(false)}>
          <div className="w-full max-w-lg space-y-4 rounded-2xl bg-card border border-border p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-xl font-bold text-foreground">Add Picture or Media</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Upload a picture from your device or paste an image link</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Source Mode Selector */}
            <div className="flex rounded-lg border border-border p-1 bg-muted/40">
              <button
                type="button"
                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  uploadMode === "device" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setUploadMode("device")}
              >
                <Upload className="h-3.5 w-3.5 text-primary" />
                Upload from Device
              </button>
              <button
                type="button"
                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  uploadMode === "url" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setUploadMode("url")}
              >
                <LinkIcon className="h-3.5 w-3.5" />
                Paste Image URL
              </button>
            </div>

            {/* Device File Input */}
            {uploadMode === "device" ? (
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*,.mp4,.mov,.webm"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, false)}
                />
                <div
                  className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:bg-muted/40 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mx-auto h-8 w-8 text-primary/70 mb-2" />
                  <p className="text-sm font-semibold text-foreground">Click to browse picture or video</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP, or MP4 up to 50MB</p>
                  {selectedFile && (
                    <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1 text-xs text-primary font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </div>
                  )}
                </div>

                {filePreview && (
                  <div className="relative aspect-video rounded-xl border border-border overflow-hidden bg-slate-950 flex items-center justify-center">
                    {draft.item_type === "video" ? (
                      <video src={filePreview} controls className="h-full w-full object-cover" />
                    ) : (
                      <img src={filePreview} alt="Preview" className="h-full w-full object-cover" />
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-center text-xs text-white">
                      Selected Preview
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <label className="block text-sm font-medium">
                Picture or Video URL
                <Input
                  type="url"
                  placeholder="https://example.com/school-photo.jpg"
                  value={draft.image_url}
                  onChange={(e) => setDraft({ ...draft, image_url: e.target.value })}
                  className="mt-1"
                />
              </label>
            )}

            <label className="block text-sm font-medium">
              Title / Caption
              <Input
                placeholder="e.g. Science Laboratory Session"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                className="mt-1"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-medium">
                Category
                <select
                  className="mt-1 w-full rounded-lg border border-border bg-background p-2 text-sm"
                  value={draft.category}
                  onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                >
                  {CATEGORIES.filter((c) => c !== "All").map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium">
                Date
                <Input
                  type="date"
                  value={draft.date}
                  onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                  className="mt-1"
                />
              </label>
            </div>

            <label className="block text-sm font-medium">
              Description (Optional)
              <Input
                placeholder="Short description of this picture"
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                className="mt-1"
              />
            </label>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <label className="block text-sm font-medium">
                Display Mode
                <select
                  className="mt-1 w-full rounded-lg border border-border bg-background p-2 text-sm"
                  value={draft.display_mode}
                  onChange={(e) => setDraft({ ...draft, display_mode: e.target.value as "cover" | "contain" })}
                >
                  <option value="cover">Fill Area (Cover)</option>
                  <option value="contain">Show Full Image (Contain)</option>
                </select>
              </label>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="show_homepage"
                  checked={draft.show_on_homepage}
                  onChange={(e) => setDraft({ ...draft, show_on_homepage: e.target.checked })}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-accent"
                />
                <label htmlFor="show_homepage" className="text-xs font-semibold cursor-pointer text-foreground">
                  Feature on Homepage
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button variant="gold" disabled={isSubmitting || !draft.title.trim()} onClick={handleAddSubmit}>
                {isSubmitting ? "Uploading..." : "Add Picture"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Media Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto" onClick={() => setEditingItem(null)}>
          <div className="w-full max-w-lg space-y-4 rounded-2xl bg-card border border-border p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-xl font-bold text-foreground">Edit Picture Details</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Update details, category, or replace photo from your device</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setEditingItem(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Current Media Preview with high-contrast text overlay */}
            <div className="relative aspect-video rounded-xl border border-border overflow-hidden bg-slate-950 flex items-center justify-center">
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
                <ImageIcon className="h-12 w-12 text-white/40" />
              )}
              <div className="absolute top-2 left-2 z-10">
                <span className="rounded-md bg-[#c51f67] px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
                  {editFilePreview ? "New Picture Selected" : "Current Picture"}
                </span>
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 pt-6 pointer-events-none">
                <p className="text-xs font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] truncate">
                  {editingItem.title}
                </p>
              </div>
            </div>

            {/* Replace Source Toggle */}
            <div className="flex rounded-lg border border-border p-1 bg-muted/40">
              <button
                type="button"
                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  editMode === "device" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setEditMode("device")}
              >
                <Upload className="h-3.5 w-3.5 text-primary" />
                Replace from Device
              </button>
              <button
                type="button"
                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  editMode === "url" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
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
                  {editFile ? `Selected: ${editFile.name}` : "Choose replacement picture from device"}
                </Button>
              </div>
            ) : (
              <label className="block text-sm font-medium">
                Picture URL
                <Input
                  type="url"
                  value={editingItem.image_url}
                  onChange={(e) => setEditingItem({ ...editingItem, image_url: e.target.value })}
                  className="mt-1"
                />
              </label>
            )}

            <label className="block text-sm font-medium">
              Title / Caption
              <Input
                value={editingItem.title}
                onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                className="mt-1"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-medium">
                Category
                <select
                  className="mt-1 w-full rounded-lg border border-border bg-background p-2 text-sm"
                  value={editingItem.category}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                >
                  {CATEGORIES.filter((c) => c !== "All").map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium">
                Date
                <Input
                  type="date"
                  value={editingItem.date ? editingItem.date.slice(0, 10) : ""}
                  onChange={(e) => setEditingItem({ ...editingItem, date: e.target.value })}
                  className="mt-1"
                />
              </label>
            </div>

            <label className="block text-sm font-medium">
              Description
              <Input
                value={editingItem.description || ""}
                onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                className="mt-1"
              />
            </label>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <label className="block text-sm font-medium">
                Display Mode
                <select
                  className="mt-1 w-full rounded-lg border border-border bg-background p-2 text-sm"
                  value={editingItem.display_mode || "cover"}
                  onChange={(e) => setEditingItem({ ...editingItem, display_mode: e.target.value as "cover" | "contain" })}
                >
                  <option value="cover">Fill Area (Cover)</option>
                  <option value="contain">Show Full Image (Contain)</option>
                </select>
              </label>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="edit_show_homepage"
                  checked={!!editingItem.show_on_homepage}
                  onChange={(e) => setEditingItem({ ...editingItem, show_on_homepage: e.target.checked })}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-accent"
                />
                <label htmlFor="edit_show_homepage" className="text-xs font-semibold cursor-pointer text-foreground">
                  Feature on Homepage
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
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
