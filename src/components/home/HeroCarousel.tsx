import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Import all carousel images
import heroImage from "@/assets/hero-school.jpg";
import africaDay from "@/assets/africa_day_wenyasha.jpg";
import chris from "@/assets/chris_wenyasha.jpg";
import wenyasha from "@/assets/wenyasha.jpg";
import classroom from "@/assets/carousel-classroom.jpg";
import sports from "@/assets/carousel-sports.jpg";
import lab from "@/assets/carousel-lab.jpg";
import library from "@/assets/carousel-library.jpg";

const slides = [
  { image: heroImage, title: "Welcome to Wenyasha International School" },
  { image: africaDay, title: "Celebrating Our Heritage" },
  { image: chris, title: "Excellence in Education" },
  { image: wenyasha, title: "Building Future Leaders" },
  { image: classroom, title: "Interactive Learning" },
  { image: sports, title: "Sports & Athletics" },
  { image: lab, title: "Science & Innovation" },
  { image: library, title: "Knowledge & Discovery" },
];

const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${slide.image})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-forest-dark/95 via-forest-dark/80 to-forest-dark/40" />
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-card/20 backdrop-blur-sm flex items-center justify-center text-primary-foreground hover:bg-card/40 transition-all"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-card/20 backdrop-blur-sm flex items-center justify-center text-primary-foreground hover:bg-card/40 transition-all"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Dot Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? "w-8 bg-accent"
                : "w-2.5 bg-primary-foreground/50 hover:bg-primary-foreground/70"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;
