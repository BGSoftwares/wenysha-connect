import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import g1 from "@/assets/IMG_6134.jpg";
import g2 from "@/assets/IMG_6135.jpg";
import g3 from "@/assets/IMG_6136.jpg";
import g4 from "@/assets/IMG_6137.jpg";
import g5 from "@/assets/IMG_6138.jpg";
import g6 from "@/assets/IMG_6139.jpg";
import g7 from "@/assets/IMG_6140.jpg";
import g8 from "@/assets/IMG_6141.jpg";
import g9 from "@/assets/IMG_6142.jpg";
import g10 from "@/assets/IMG_6143.jpg";
import g11 from "@/assets/IMG_6144.jpg";
import g12 from "@/assets/IMG_6145.jpg";
import communityGroup1 from "@/assets/new-school-media/school-community-group-1.jpeg";
import communityGroup2 from "@/assets/new-school-media/school-community-group-2.jpeg";
import communityGroup3 from "@/assets/new-school-media/school-community-group-3.jpeg";
import communityGroup4 from "@/assets/new-school-media/school-community-group-4.jpeg";
import preparationProgram from "@/assets/new-school-media/grade7-form1-preparation.jpeg";
import communityGathering from "@/assets/new-school-media/school-community-gathering.jpeg";
import groupOfSchools from "@/assets/new-school-media/group-of-schools-flyer.jpeg";
import schoolAssembly from "@/assets/new-school-media/school-assembly.jpeg";
import examWishesShirt from "@/assets/new-school-media/exam-wishes-shirt.jpeg";
import communityCelebration from "@/assets/new-school-media/school-community-celebration.jpeg";
import novemberExams from "@/assets/new-school-media/november-2026-exams-poster.jpeg";
import { Layout } from "@/components/layout/Layout";
import { Image, X } from "lucide-react";

type GalleryCategory = "School Photos" | "School Posters & Designs";
type GalleryItem = {
  id: number;
  src: string;
  category: GalleryCategory;
  title: string;
  alt: string;
  isPoster?: boolean;
};

const categories = ["All", "School Photos", "School Posters & Designs"];

const galleryItems: GalleryItem[] = [
  ...[
    { src: g1, alt: "Able God College learners and school activities" },
    { src: g2, alt: "Learners at Able God College" },
    { src: g3, alt: "Able God College school community" },
    { src: g4, alt: "Able God College learners in uniform" },
    { src: g5, alt: "School event at Able God College" },
    { src: g6, alt: "Able God College learners and teachers" },
    { src: g7, alt: "Able God College school gathering" },
    { src: g8, alt: "Able God College learners" },
    { src: g9, alt: "Able God College school event" },
    { src: g10, alt: "Able God College learners and staff" },
    { src: g11, alt: "Able God College celebration" },
    { src: g12, alt: "Able God College community" },
  ].map((item, index) => ({
    ...item,
    category: "School Photos" as const,
    title: `Able God College photograph ${String(index + 1).padStart(2, "0")}`,
  })),
  ...[
    {
      src: communityGroup1,
      title: "Able God College community",
      alt: "Able God College learners and staff gathered outdoors for a group photograph",
    },
    {
      src: communityGroup2,
      title: "Learners and staff together",
      alt: "Able God College learners and teachers standing together in school uniform",
    },
    {
      src: communityGroup3,
      title: "A school community gathering",
      alt: "Staff and learners gathered together in navy and pink uniforms",
    },
    {
      src: communityGroup4,
      title: "School gathering",
      alt: "Able God College students and staff gathered outdoors",
    },
  ].map((item) => ({ ...item, category: "School Photos" as const })),
  {
    src: preparationProgram,
    category: "School Posters & Designs",
    title: "Grade 7 to Form 1 Preparation Programme",
    alt: "Able God College flyer for the free Grade 7 to Form 1 preparation programme, 12 October to December 2026",
    isPoster: true,
  },
  {
    src: communityGathering,
    category: "School Photos",
    title: "Able God College Community",
    alt: "Able God College staff and community members gathered outdoors",
  },
  {
    src: groupOfSchools,
    category: "School Posters & Designs",
    title: "Able God Group of Schools",
    alt: "Able God Group of Schools flyer featuring Able God Junior and Able God College",
    isPoster: true,
  },
  {
    src: schoolAssembly,
    category: "School Photos",
    title: "School Assembly",
    alt: "Able God College learners gathered in navy and pink uniforms",
  },
  {
    src: examWishesShirt,
    category: "School Posters & Designs",
    title: "Best Wishes in Your Exams T-shirt",
    alt: "Navy Able God College T-shirt design wishing learners success in their exams",
    isPoster: true,
  },
  {
    src: communityCelebration,
    category: "School Photos",
    title: "School Community Gathering",
    alt: "Able God College staff and community members together outdoors",
  },
  {
    src: novemberExams,
    category: "School Posters & Designs",
    title: "November 2026 Exams",
    alt: "Best wishes in your exams, Class of November 2026 poster",
    isPoster: true,
  },
].map((item, index) => ({ ...item, id: index + 1 }));

const Gallery = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const filteredItems = activeCategory === "All"
    ? galleryItems
    : galleryItems.filter(item => item.category === activeCategory);
  const pos = filteredItems.findIndex(i => i.id === selectedImage);
  const selectedItem = galleryItems.find((item) => item.id === selectedImage);
  const step = (d: number) => {
    if (pos < 0) return;
    setSelectedImage(filteredItems[(pos + d + filteredItems.length) % filteredItems.length].id);
  };
  useEffect(() => {
    if (selectedImage === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedImage(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
            Photo Gallery
          </h1>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            Photographs from Able God College.
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
              <button
                type="button"
                key={item.id}
                onClick={() => setSelectedImage(item.id)}
                aria-label={`Open image: ${item.title}`}
                className={`group relative w-full ${item.isPoster ? "aspect-[4/5]" : "aspect-square"} overflow-hidden rounded-xl bg-secondary text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <img src={item.src} alt={item.alt} loading="lazy" className={`absolute inset-0 h-full w-full ${item.isPoster ? "bg-white object-contain" : "object-cover transition-transform duration-700 group-hover:scale-110"}`} />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/90 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <span className="text-xs text-accent font-medium">{item.category}</span>
                    <h3 className="text-primary-foreground font-semibold">{item.title}</h3>
                  </div>
                </div>

              </button>
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
          
          <button aria-label="Previous" onClick={(e) => { e.stopPropagation(); step(-1); }} className="absolute left-4 md:left-8 h-12 w-12 rounded-full bg-card/10 flex items-center justify-center hover:bg-card/20">
            <ChevronLeft className="h-7 w-7 text-primary-foreground" />
          </button>
          <figure className="max-w-5xl w-full animate-scale-in" onClick={(e) => e.stopPropagation()}>
            {selectedItem && <img src={selectedItem.src} alt={selectedItem.alt} className="max-h-[80vh] w-full rounded-xl object-contain" />}
            <figcaption className="mt-4 text-center text-primary-foreground">
              {selectedItem?.title}
              <span className="ml-3 text-sm text-primary-foreground/60">{pos + 1} / {filteredItems.length}</span>
            </figcaption>
          </figure>
          <button aria-label="Next" onClick={(e) => { e.stopPropagation(); step(1); }} className="absolute right-4 md:right-8 h-12 w-12 rounded-full bg-card/10 flex items-center justify-center hover:bg-card/20">
            <ChevronRight className="h-7 w-7 text-primary-foreground" />
          </button>
        </div>
      )}

    </Layout>
  );
};

export default Gallery;
