import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Image, Play, X } from "lucide-react";

const categories = ["All", "Sports", "Academics", "Arts", "Events", "Campus"];

const galleryItems = [
  { id: 1, category: "Sports", title: "Inter-School Athletics", type: "image" },
  { id: 2, category: "Academics", title: "Science Fair 2025", type: "image" },
  { id: 3, category: "Arts", title: "Annual Drama Performance", type: "image" },
  { id: 4, category: "Events", title: "Independence Day Celebration", type: "image" },
  { id: 5, category: "Campus", title: "Our Modern Campus", type: "image" },
  { id: 6, category: "Sports", title: "Soccer Championship", type: "image" },
  { id: 7, category: "Academics", title: "Mathematics Olympiad", type: "image" },
  { id: 8, category: "Arts", title: "Choir Performance", type: "image" },
  { id: 9, category: "Events", title: "Prize Giving Day", type: "image" },
  { id: 10, category: "Campus", title: "Library Facilities", type: "image" },
  { id: 11, category: "Sports", title: "Swimming Gala", type: "image" },
  { id: 12, category: "Academics", title: "Computer Lab Session", type: "image" },
];

const Gallery = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const filteredItems = activeCategory === "All" 
    ? galleryItems 
    : galleryItems.filter(item => item.category === activeCategory);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
            Photo Gallery
          </h1>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            Capturing memories and celebrating moments at Wenyasha International School.
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 bg-card border-b border-border sticky top-20 z-40">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === category
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item, index) => (
              <div
                key={item.id}
                onClick={() => setSelectedImage(item.id)}
                className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer bg-secondary"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Placeholder for image */}
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                  <Image className="h-12 w-12 text-primary/30" />
                </div>
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <span className="text-xs text-accent font-medium">{item.category}</span>
                    <h3 className="text-primary-foreground font-semibold">{item.title}</h3>
                  </div>
                </div>

                {item.type === "video" && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-16 w-16 rounded-full bg-accent/90 flex items-center justify-center">
                      <Play className="h-8 w-8 text-accent-foreground ml-1" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-20">
              <Image className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No images found in this category.</p>
            </div>
          )}
        </div>
      </section>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-forest-dark/95 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-6 right-6 h-12 w-12 rounded-full bg-card/10 flex items-center justify-center hover:bg-card/20 transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <X className="h-6 w-6 text-primary-foreground" />
          </button>
          
          <div className="max-w-4xl w-full aspect-video bg-secondary rounded-xl flex items-center justify-center">
            <div className="text-center">
              <Image className="h-24 w-24 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {galleryItems.find(i => i.id === selectedImage)?.title}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Video Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-3xl font-bold text-foreground text-center mb-12">
            Video Highlights
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              "Annual Prize Giving Ceremony",
              "Sports Day Highlights",
              "Choir Performance at National Competition",
            ].map((video, index) => (
              <div 
                key={index}
                className="group relative aspect-video rounded-xl overflow-hidden bg-secondary cursor-pointer"
              >
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                  <div className="h-16 w-16 rounded-full bg-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="h-7 w-7 text-accent-foreground ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-forest-dark/80 to-transparent">
                  <p className="text-primary-foreground font-medium">{video}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Gallery;
