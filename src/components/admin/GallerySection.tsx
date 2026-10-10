import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type GalleryImage = { id: number; title: string; category: string; item_type: string; image_url: string; date: string | null };
const getRows = (response: GalleryImage[] | { results?: GalleryImage[] }) => Array.isArray(response) ? response : response.results ?? [];
const path = "/content/gallery/";

const GallerySection = () => {
  const queryClient = useQueryClient();
  const { data = [], isLoading, error } = useQuery({ queryKey: ["admin-gallery"], queryFn: async () => getRows(await api.get<GalleryImage[] | { results?: GalleryImage[] }>(path)) });
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ title: "", category: "Events", image_url: "", item_type: "image", date: new Date().toISOString().slice(0, 10) });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-gallery"] });
  const add = useMutation({ mutationFn: () => api.post(path, draft), onSuccess: () => { void refresh(); setOpen(false); setDraft({ title: "", category: "Events", image_url: "", item_type: "image", date: new Date().toISOString().slice(0, 10) }); toast.success("Gallery item added"); }, onError: e => toast.error(getErrorMessage(e)) });
  const remove = useMutation({ mutationFn: (id: number) => api.delete(`${path}${id}/`), onSuccess: () => { void refresh(); toast.success("Gallery item removed"); }, onError: e => toast.error(getErrorMessage(e)) });
  return <div className="space-y-6">
    <div className="flex items-center justify-between"><div><h2 className="font-heading text-xl font-bold">Gallery Management</h2><p className="text-sm text-muted-foreground">Manage published school photos and media links</p></div><Button onClick={() => setOpen(true)} variant="gold"><Plus className="mr-2 h-4 w-4"/>Add Image</Button></div>
    {isLoading ? <p className="py-12 text-center text-muted-foreground">Loading gallery…</p> : error ? <p className="rounded-xl border border-destructive/30 p-5 text-destructive">Could not load gallery: {getErrorMessage(error)}</p> : data.length === 0 ? <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground"><ImageIcon className="mx-auto mb-3 h-10 w-10 opacity-40"/>No gallery items yet. Add an image URL to publish the first item.</div> : <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{data.map(img => <div key={img.id} className="overflow-hidden rounded-2xl border bg-card shadow-sm"><div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-secondary">{img.image_url ? <img src={img.image_url} alt={img.title} className="h-full w-full object-cover"/> : <ImageIcon className="h-12 w-12 text-muted-foreground/40"/>}</div><div className="flex items-start justify-between gap-2 p-4"><div className="min-w-0"><h3 className="truncate font-semibold">{img.title}</h3><p className="mt-1 text-xs text-muted-foreground">{img.category}{img.date ? ` · ${img.date}` : ""}</p></div><Button variant="outline" size="icon" aria-label={`Delete ${img.title}`} onClick={() => window.confirm(`Remove “${img.title}” from the gallery?`) && remove.mutate(img.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button></div></div>)}</div>}
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setOpen(false)}><div className="w-full max-w-md space-y-4 rounded-xl bg-card p-6" onClick={e => e.stopPropagation()}><h3 className="text-xl font-bold">Add gallery image</h3><label className="block text-sm">Title<Input value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })}/></label><label className="block text-sm">Image URL<Input type="url" placeholder="https://…" value={draft.image_url} onChange={e => setDraft({ ...draft, image_url: e.target.value })}/></label><label className="block text-sm">Category<select className="mt-1 w-full rounded-lg border bg-background p-2" value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })}>{["Events", "Academic", "Sports", "Campus", "Arts"].map(category => <option key={category}>{category}</option>)}</select></label><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button variant="gold" disabled={add.isPending || !draft.title.trim() || !draft.image_url.trim()} onClick={() => add.mutate()}>{add.isPending ? "Saving…" : "Add to Gallery"}</Button></div></div></div>}
  </div>;
};
export default GallerySection;
