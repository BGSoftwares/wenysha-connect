import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image as ImageIcon, Link as LinkIcon, Plus, Trash2, Upload, X, Edit, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, getErrorMessage } from "@/lib/api";
import { defaultHeroSlides } from "@/lib/heroCarouselDefaults";

type HeroSlide = {
  id: number;
  title: string;
  description: string;
  image_url: string;
  display_order: number;
  display_mode: "cover" | "contain";
};

type CarouselResponse = { managed: boolean; slides: HeroSlide[] };
const carouselUrl = "/content/gallery/carousel/";
const galleryUrl = "/content/gallery/";

const HeroCarouselSection = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<"device" | "url">("device");
  const [displayMode, setDisplayMode] = useState<"cover" | "contain">("cover");

  // Editing state
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editFilePreview, setEditFilePreview] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<"device" | "url">("device");
  const [isUpdating, setIsUpdating] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["hero-carousel"],
    queryFn: async () => {
      let result = await api.get<CarouselResponse>(carouselUrl);
      if (!result.managed) {
        result = await api.post<CarouselResponse>("/content/gallery/initialize-carousel/", {
          slides: defaultHeroSlides.map((slide) => ({
            title: slide.title,
            description: slide.description,
            image_url: slide.image,
            display_mode: slide.fit,
          })),
        });
      }
      return result;
    },
    retry: false,
  });

  const addSlide = useMutation({
    mutationFn: async () => {
      const payload = new FormData();
      payload.append("title", title.trim());
      payload.append("description", description.trim());
      payload.append("category", "Hero Carousel");
      payload.append("item_type", "image");
      payload.append("show_on_homepage", "true");
      payload.append("display_order", String(Math.max(-1, ...(data?.slides.map((slide) => slide.display_order) ?? [-1])) + 1));
      payload.append("display_mode", displayMode);
      if (uploadMode === "device" && file) payload.append("media_file", file);
      else payload.append("image_url", imageUrl.trim());
      return api.postForm(galleryUrl, payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["hero-carousel"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-gallery"] });
      void queryClient.invalidateQueries({ queryKey: ["public-gallery"] });
      toast.success("Carousel picture added");
      setTitle("");
      setDescription("");
      setImageUrl("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const removeSlide = useMutation({
    mutationFn: (id: number) => api.delete(`${galleryUrl}${id}/`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["hero-carousel"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-gallery"] });
      void queryClient.invalidateQueries({ queryKey: ["public-gallery"] });
      toast.success("Carousel picture removed");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("Enter a title for this picture");
      return;
    }
    if (uploadMode === "device" && !file) {
      toast.error("Choose a picture to upload");
      return;
    }
    if (uploadMode === "url" && !imageUrl.trim()) {
      toast.error("Enter an image URL");
      return;
    }
    if (file && file.size > 50 * 1024 * 1024) {
      toast.error("Picture must be 50MB or smaller");
      return;
    }
    addSlide.mutate();
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.size > 50 * 1024 * 1024) {
      toast.error("File size must be under 50MB");
      return;
    }
    setEditFile(selected);
    setEditFilePreview(URL.createObjectURL(selected));
  };

  const handleEditSubmit = async () => {
    if (!editingSlide) return;
    if (!editingSlide.title.trim()) {
      toast.error("Please enter a slide title");
      return;
    }

    setIsUpdating(true);
    try {
      if (editMode === "device" && editFile) {
        toast.info("Uploading replacement picture...");
        const formData = new FormData();
        formData.append("title", editingSlide.title.trim());
        formData.append("description", editingSlide.description || "");
        formData.append("display_mode", editingSlide.display_mode);
        formData.append("category", "Hero Carousel");
        formData.append("show_on_homepage", "true");
        formData.append("media_file", editFile);
        await api.patchForm(`${galleryUrl}${editingSlide.id}/`, formData);
      } else {
        await api.patch(`${galleryUrl}${editingSlide.id}/`, {
          title: editingSlide.title.trim(),
          description: editingSlide.description || "",
          image_url: editingSlide.image_url,
          display_mode: editingSlide.display_mode,
          category: "Hero Carousel",
          show_on_homepage: true,
        });
      }

      void queryClient.invalidateQueries({ queryKey: ["hero-carousel"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-gallery"] });
      void queryClient.invalidateQueries({ queryKey: ["public-gallery"] });
      toast.success("Carousel slide updated successfully!");
      setEditingSlide(null);
      setEditFile(null);
      setEditFilePreview(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-bold">Hero Carousel Management</h2>
          <p className="text-sm text-muted-foreground">Manage and update pictures featured in the homepage hero banner.</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        {/* Slides List */}
        <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Current Carousel Pictures ({data?.slides.length ?? 0})</h3>
            </div>
          </div>

          {isLoading ? (
            <p className="py-8 text-center text-muted-foreground">Loading carousel pictures…</p>
          ) : error ? (
            <p className="rounded-xl border border-destructive/30 p-4 text-sm text-destructive">Could not load carousel pictures: {getErrorMessage(error)}</p>
          ) : data?.slides.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {data.slides.map((slide, index) => (
                <article key={slide.id} className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all">
                  <div className="relative aspect-video bg-slate-950 overflow-hidden">
                    <img
                      src={slide.image_url}
                      alt={slide.title}
                      className={`h-full w-full transition-transform duration-500 group-hover:scale-105 ${slide.display_mode === "contain" ? "object-contain bg-slate-900" : "object-cover"}`}
                      loading="lazy"
                    />
                    {/* High contrast badges over image regardless of brightness */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
                      <span className="rounded-md bg-[#c51f67] px-2 py-0.5 text-[11px] font-bold text-white shadow-md">
                        Slide #{index + 1}
                      </span>
                      <span className="rounded-md bg-black/80 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-md border border-white/20 shadow-md">
                        {slide.display_mode === "contain" ? "Fit / Full" : "Fill / Cover"}
                      </span>
                    </div>

                    {/* Dark gradient scrim at bottom so title is always crisp white */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 pt-8 pointer-events-none">
                      <p className="truncate text-sm font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                        {slide.title}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-card">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate font-semibold text-sm text-foreground">{slide.title}</h4>
                        {slide.description ? (
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{slide.description}</p>
                        ) : (
                          <p className="mt-1 text-xs text-muted-foreground/60 italic">No description</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          aria-label={`Edit ${slide.title}`}
                          onClick={() => {
                            setEditingSlide(slide);
                            setEditMode(slide.image_url.startsWith("http") ? "url" : "device");
                            setEditFile(null);
                            setEditFilePreview(null);
                          }}
                        >
                          <Edit className="h-3.5 w-3.5 text-foreground" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-destructive/10"
                          aria-label={`Remove ${slide.title} from the carousel`}
                          disabled={removeSlide.isPending}
                          onClick={() => window.confirm(`Remove “${slide.title}” from the homepage carousel?`) && removeSlide.mutate(slide.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No carousel pictures are active. Add one to show it on the homepage.</div>
          )}
        </section>

        {/* Add Slide Panel */}
        <section className="h-fit space-y-4 rounded-2xl border border-border bg-card p-5">
          <div>
            <h3 className="font-semibold text-foreground">Add a picture</h3>
            <p className="text-xs text-muted-foreground">Upload an image from this device or paste a public image URL.</p>
          </div>

          <div className="flex rounded-lg border border-border p-1 bg-muted/40">
            <button type="button" className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold transition-all ${uploadMode === "device" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`} onClick={() => setUploadMode("device")}>
              <Upload className="mr-1 inline h-3.5 w-3.5" />This device
            </button>
            <button type="button" className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold transition-all ${uploadMode === "url" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`} onClick={() => setUploadMode("url")}>
              <LinkIcon className="mr-1 inline h-3.5 w-3.5" />Image URL
            </button>
          </div>

          {uploadMode === "device" ? (
            <div className="space-y-2">
              <Input ref={fileInputRef} type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
              {file && <p className="text-xs text-muted-foreground">{file.name} · {(file.size / (1024 * 1024)).toFixed(2)} MB</p>}
            </div>
          ) : (
            <Input type="url" placeholder="https://example.com/photo.jpg" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} />
          )}

          <label className="block space-y-1 text-sm font-medium">
            Title / caption
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="School assembly" />
          </label>
          <label className="block space-y-1 text-sm font-medium">
            Description
            <Input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Learners at morning assembly" />
          </label>
          <label className="block space-y-1 text-sm font-medium">
            Image display
            <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={displayMode} onChange={(event) => setDisplayMode(event.target.value as "cover" | "contain")}>
              <option value="cover">Fill the banner (cover)</option>
              <option value="contain">Show the full picture (contain)</option>
            </select>
          </label>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            {file && <Button variant="ghost" onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}><X className="mr-1 h-4 w-4" />Clear</Button>}
            <Button variant="gold" onClick={handleSubmit} disabled={addSlide.isPending}>
              <Plus className="mr-2 h-4 w-4" />{addSlide.isPending ? "Adding…" : "Add to carousel"}
            </Button>
          </div>
        </section>
      </div>

      {/* Edit Slide Modal */}
      {editingSlide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-lg font-bold text-foreground">Edit Carousel Picture</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Update slide details or upload a new photo from your device</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setEditingSlide(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Current Media Preview with high-contrast indicator */}
            <div className="relative aspect-video rounded-xl border border-border overflow-hidden bg-slate-950 flex items-center justify-center">
              <img
                src={editFilePreview || editingSlide.image_url}
                alt={editingSlide.title}
                className={`h-full w-full ${editingSlide.display_mode === "contain" ? "object-contain bg-slate-900" : "object-cover"}`}
              />
              <div className="absolute top-2 left-2 z-10">
                <span className="rounded-md bg-[#c51f67] px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
                  {editFilePreview ? "New Photo Selected" : "Current Photo"}
                </span>
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 pt-6 pointer-events-none">
                <p className="text-xs font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] truncate">
                  {editingSlide.title || "Slide Preview"}
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
                  accept="image/*"
                  className="hidden"
                  onChange={handleEditFileChange}
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
                Image URL
                <Input
                  type="url"
                  value={editingSlide.image_url}
                  onChange={(e) => setEditingSlide({ ...editingSlide, image_url: e.target.value })}
                  className="mt-1"
                />
              </label>
            )}

            <label className="block text-sm font-medium">
              Title / Caption
              <Input
                value={editingSlide.title}
                onChange={(e) => setEditingSlide({ ...editingSlide, title: e.target.value })}
                className="mt-1"
              />
            </label>

            <label className="block text-sm font-medium">
              Description
              <Input
                value={editingSlide.description}
                onChange={(e) => setEditingSlide({ ...editingSlide, description: e.target.value })}
                className="mt-1"
              />
            </label>

            <label className="block text-sm font-medium">
              Display Mode
              <select
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={editingSlide.display_mode}
                onChange={(e) => setEditingSlide({ ...editingSlide, display_mode: e.target.value as "cover" | "contain" })}
              >
                <option value="cover">Fill the banner (cover)</option>
                <option value="contain">Show the full picture (contain)</option>
              </select>
            </label>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <Button variant="outline" onClick={() => setEditingSlide(null)} disabled={isUpdating}>
                Cancel
              </Button>
              <Button variant="gold" onClick={handleEditSubmit} disabled={isUpdating || !editingSlide.title.trim()}>
                {isUpdating ? "Saving changes..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeroCarouselSection;
