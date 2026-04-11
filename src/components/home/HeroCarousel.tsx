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
          className={`absolute inset-0 transition-all duration-1500 cubic-bezier(0.4, 0, 0.2, 1) ${index === currentSlide ? "opacity-100 scale-100" : "opacity-0 scale-110"
            }`}
        >
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[8000ms] ease-out"
            style={{
              backgroundImage: `url(${slide.image})`,
              transform: index === currentSlide ? 'scale(1.1)' : 'scale(1)'
            }}
          />
          {/* Multi-layered gradients for cinematic feel */}
          <div className="absolute inset-0 bg-gradient-to-r from-forest-dark/90 via-forest-dark/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/80 via-transparent to-forest-dark/30" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
        </div>
      ))}

      {/* Hero Content Overlay */}
      <div className="absolute inset-0 z-10 flex flex-col items-start justify-center px-6 md:px-20 max-w-5xl">
        <div className="space-y-4 animate-in slide-in-from-left duration-1000">
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-bold uppercase tracking-widest shadow-lg shadow-accent/20">
            Est. 2024 • Wenyasha International
          </span>
          <h1 className="text-4xl md:text-7xl font-heading font-black text-white leading-tight transition-all duration-1000">
            {slides[currentSlide].title.split(' ').map((word, i) => (
              <span key={i} className="inline-block mr-4 opacity-0 animate-in slide-in-from-bottom fill-mode-forwards" style={{ animationDelay: `${i * 100}ms` }}>
                {word}
              </span>
            ))}
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl font-light border-l-4 border-accent pl-6 py-2 opacity-0 animate-in fade-in slide-in-from-left duration-1000 delay-500 fill-mode-forwards">
            Empowering the next generation of global leaders through academic excellence, character building, and innovative learning.
          </p>
          <div className="flex gap-4 pt-8 opacity-0 animate-in fade-in slide-in-from-bottom duration-1000 delay-700 fill-mode-forwards">
            <button className="px-8 py-4 rounded-xl bg-accent text-accent-foreground font-bold shadow-xl shadow-accent/30 hover:scale-105 active:scale-95 transition-all">
              Apply for Admission
            </button>
            <button className="px-8 py-4 rounded-xl bg-white/10 backdrop-blur-md text-white border border-white/20 font-bold hover:bg-white/20 transition-all">
              Take a Virtual Tour
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="absolute inset-y-0 right-0 w-24 flex flex-col items-center justify-center gap-4 z-20 pr-6">
        <button
          onClick={goToPrevious}
          className="h-12 w-12 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-accent hover:text-accent-foreground transition-all group"
        >
          <ChevronLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
        </button>
        <button
          onClick={goToNext}
          className="h-12 w-12 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-accent hover:text-accent-foreground transition-all group"
        >
          <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Progressive Page Indicators */}
      <div className="absolute bottom-12 right-12 z-20 flex items-center gap-4">
        <div className="flex gap-2.5">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-1.5 rounded-full transition-all duration-700 ${index === currentSlide
                  ? "w-12 bg-accent"
                  : "w-2 bg-white/30 hover:bg-white/60"
                }`}
            />
          ))}
        </div>
        <span className="text-white font-mono text-sm opacity-60">
          0{currentSlide + 1} / 0{slides.length}
        </span>
      </div>
    </div>
  );
};

export default HeroCarousel;
