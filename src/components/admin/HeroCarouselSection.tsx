import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image as ImageIcon, Link as LinkIcon, Plus, Trash2, Upload, X } from "lucide-react";
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
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<"device" | "url">("device");
  const [displayMode, setDisplayMode] = useState<"cover" | "contain">("cover");

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold">Hero Carousel</h2>
        <p className="text-sm text-muted-foreground">Add or remove pictures shown in the homepage banner. The existing homepage pictures are loaded here the first time an admin opens this page.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <section className="space-y-4 rounded-2xl border bg-card p-5">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Current carousel pictures</h3>
          </div>
          {isLoading ? (
            <p className="py-8 text-center text-muted-foreground">Loading carousel pictures…</p>
          ) : error ? (
            <p className="rounded-xl border border-destructive/30 p-4 text-sm text-destructive">Could not load carousel pictures: {getErrorMessage(error)}</p>
          ) : data?.slides.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {data.slides.map((slide) => (
                <article key={slide.id} className="overflow-hidden rounded-xl border bg-background">
                  <div className="aspect-video bg-muted">
                    <img src={slide.image_url} alt={slide.title} className={`h-full w-full ${slide.display_mode === "contain" ? "object-contain" : "object-cover"}`} loading="lazy" />
                  </div>
                  <div className="flex items-start justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{slide.title}</p>
                      {slide.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{slide.description}</p>}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label={`Remove ${slide.title} from the carousel`}
                      disabled={removeSlide.isPending}
                      onClick={() => window.confirm(`Remove “${slide.title}” from the homepage carousel?`) && removeSlide.mutate(slide.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No carousel pictures are active. Add one to show it on the homepage.</div>
          )}
        </section>

        <section className="h-fit space-y-4 rounded-2xl border bg-card p-5">
          <div>
            <h3 className="font-semibold">Add a picture</h3>
            <p className="text-xs text-muted-foreground">Upload an image from this device or paste a public image URL.</p>
          </div>

          <div className="flex rounded-lg border p-1">
            <button type="button" className={`flex-1 rounded-md px-3 py-2 text-xs font-medium ${uploadMode === "device" ? "bg-muted text-foreground" : "text-muted-foreground"}`} onClick={() => setUploadMode("device")}>
              <Upload className="mr-1 inline h-3.5 w-3.5" />This device
            </button>
            <button type="button" className={`flex-1 rounded-md px-3 py-2 text-xs font-medium ${uploadMode === "url" ? "bg-muted text-foreground" : "text-muted-foreground"}`} onClick={() => setUploadMode("url")}>
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

          <label className="block space-y-1 text-sm">
            Title / caption
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="School assembly" />
          </label>
          <label className="block space-y-1 text-sm">
            Description
            <Input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Learners at morning assembly" />
          </label>
          <label className="block space-y-1 text-sm">
            Image display
            <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={displayMode} onChange={(event) => setDisplayMode(event.target.value as "cover" | "contain")}>
              <option value="cover">Fill the banner</option>
              <option value="contain">Show the full picture</option>
            </select>
          </label>
          <div className="flex justify-end gap-2 border-t pt-4">
            {file && <Button variant="ghost" onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}><X className="mr-1 h-4 w-4" />Clear</Button>}
            <Button variant="gold" onClick={handleSubmit} disabled={addSlide.isPending}>
              <Plus className="mr-2 h-4 w-4" />{addSlide.isPending ? "Adding…" : "Add to carousel"}
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HeroCarouselSection;
