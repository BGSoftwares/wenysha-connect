import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

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
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform ease-out"
            style={{
              backgroundImage: `url(${slide.image})`,
              transform: index === currentSlide ? 'scale(1.1)' : 'scale(1)',
              transitionDuration: '8000ms'
            }}
          />
          {/* Starlink-style darkening */}
          <div className="absolute inset-0 bg-forest-dark/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        </div>
      ))}

      {/* Hero Content — bottom-left, minimal */}
      <div className="absolute inset-x-0 bottom-28 md:bottom-32 z-10 px-6 md:px-20">
        <div key={currentSlide} className="max-w-3xl animate-fade-in">
          <p className="text-xs md:text-sm uppercase tracking-[0.35em] text-white/70 mb-4">
            Est. 2024 • Wenyasha International
          </p>
          <h1 className="text-4xl md:text-6xl font-medium uppercase tracking-wide text-white leading-[1.05]">
            {slides[currentSlide].title}
          </h1>
          <p className="mt-5 text-base md:text-lg text-white/75 max-w-xl font-light">
            Empowering the next generation of global leaders through academic excellence and character.
          </p>
          <div className="flex flex-wrap gap-4 pt-8">
            <Link to="/contact" className="sl-btn">Apply Now</Link>
            <Link to="/about" className="sl-btn sl-btn-gold">Learn More</Link>
          </div>
        </div>
      </div>

      {/* Minimal controls */}
      <div className="absolute bottom-10 right-6 md:right-20 z-20 flex items-center gap-5">
        <button onClick={goToPrevious} aria-label="Previous slide" className="text-white/60 hover:text-white transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              aria-label={`Slide ${index + 1}`}
              onClick={() => goToSlide(index)}
              className={`h-[2px] transition-all duration-700 ${index === currentSlide ? "w-10 bg-white" : "w-4 bg-white/30 hover:bg-white/60"}`}
            />
          ))}
        </div>
        <button onClick={goToNext} aria-label="Next slide" className="text-white/60 hover:text-white transition-colors">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default HeroCarousel;
