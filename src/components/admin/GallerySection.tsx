import { Plus, Trash2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GalleryImage {
    id: number | string;
    title: string;
    category: string;
    date: string;
    url?: string;
}

interface GallerySectionProps {
    images: GalleryImage[];
    onAddImage: () => void;
}

const GallerySection = ({ images, onAddImage }: GallerySectionProps) => {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h2 className="font-heading text-xl font-bold text-foreground">Gallery Management</h2>
                <Button onClick={onAddImage} variant="gold" className="shadow-lg shadow-accent/20 transition-all hover:scale-105 active:scale-95">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Image
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {images.map((img) => (
                    <div key={img.id} className="bg-card rounded-2xl border border-border overflow-hidden group shadow-elegant hover:shadow-xl transition-all relative">
                        <div className="aspect-[4/3] bg-secondary flex items-center justify-center relative overflow-hidden">
                            {img.url ? (
                                <img src={img.url} alt={img.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            ) : (
                                <ImageIcon className="h-16 w-16 text-muted-foreground/20 group-hover:scale-110 transition-transform duration-700" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                <p className="text-white text-xs font-medium">Uploaded on {img.date}</p>
                            </div>
                        </div>
                        <div className="p-4">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <h4 className="font-bold text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors">{img.title}</h4>
                                    <span className="text-[10px] uppercase tracking-widest text-accent font-bold mt-1 inline-block">{img.category}</span>
                                </div>
                                <button className="p-2 rounded-xl bg-destructive/5 hover:bg-destructive/10 text-destructive transition-colors border border-transparent hover:border-destructive/20">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <Button variant="outline" size="sm" className="w-full text-xs h-8 rounded-lg">View Details</Button>
                            </div>
                        </div>
                    </div>
                ))}

                <button
                    onClick={onAddImage}
                    className="aspect-[4/3] rounded-2xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-primary transition-all group"
                >
                    <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/10 transition-all">
                        <Plus className="h-6 w-6" />
                    </div>
                    <div className="text-center">
                        <span className="text-sm font-bold block">Upload New</span>
                        <span className="text-[10px] uppercase font-medium">Max 5MB per image</span>
                    </div>
                </button>
            </div>
        </div>
    );
};

export default GallerySection;
