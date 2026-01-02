import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Import all carousel images
import slideGroupClass from "@/assets/slide-group-class.webp";
import slideBlazers from "@/assets/slide-blazers.webp";
import slideSportsTeam from "@/assets/slide-sports-team.webp";
import slideExam from "@/assets/slide-exam.webp";
import slideOutdoorGroup from "@/assets/slide-outdoor-group.webp";
import slidePrizeGiving from "@/assets/slide-prize-giving.jpeg";
import slideAward from "@/assets/slide-award.jpeg";
import slideStudentsSeated from "@/assets/slide-students-seated.jpeg";

const slides = [
  { image: slideGroupClass, title: "Welcome to Wenyasha International School" },
  { image: slideBlazers, title: "Excellence in Education" },
  { image: slideSportsTeam, title: "Sports & Recreation" },
  { image: slideExam, title: "Academic Focus" },
  { image: slideOutdoorGroup, title: "Building Future Leaders" },
  { image: slidePrizeGiving, title: "Celebrating Achievement" },
  { image: slideAward, title: "Recognizing Excellence" },
  { image: slideStudentsSeated, title: "Proud Students" },
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
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${slide.image})` }}
          />
          {/* Overlay gradient for readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-forest-dark/80 via-forest-dark/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/60 via-transparent to-forest-dark/40" />
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-accent/80 hover:text-accent-foreground transition-all border border-white/20"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-accent/80 hover:text-accent-foreground transition-all border border-white/20"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Dot Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-3 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? "w-10 bg-accent shadow-lg shadow-accent/50"
                : "w-3 bg-white/50 hover:bg-white/70"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Slide Title Indicator */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 text-center">
        <p className="text-white/80 text-lg font-heading font-medium tracking-wide drop-shadow-lg">
          {slides[currentSlide].title}
        </p>
      </div>
    </div>
  );
};

export default HeroCarousel;
