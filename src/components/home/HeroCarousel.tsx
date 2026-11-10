import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, GraduationCap, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { defaultHeroSlides } from "@/lib/heroCarouselDefaults";

type ManagedSlide = {
  id: number;
  title: string;
  description: string;
  image_url: string;
  display_mode: "cover" | "contain";
};

type CarouselResponse = { managed: boolean; slides: ManagedSlide[] };

// Filter to authentic campus photographs for cinematic hero scaling
const curatedHeroSlides = defaultHeroSlides.filter(
  (s) => s.fit === "cover" || !s.image.includes("poster")
);

const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const currentSlideRef = useRef(0);

  const { data: carousel } = useQuery({
    queryKey: ["hero-carousel"],
    queryFn: () => api.get<CarouselResponse>("/content/gallery/carousel/"),
    retry: false,
    staleTime: 60_000,
  });

  const slides = carousel?.managed && carousel.slides.length > 0
    ? carousel.slides.map((slide) => ({
        image: slide.image_url,
        title: slide.title,
        description: slide.description,
        fit: "cover" as const,
      }))
    : curatedHeroSlides;

  const goToSlide = useCallback((nextSlide: number) => {
    if (!slides.length) return;
    const target = (nextSlide + slides.length) % slides.length;
    currentSlideRef.current = target;
    setCurrentSlide(target);
  }, [slides.length]);

  const goToPrevious = useCallback(() => {
    goToSlide(currentSlideRef.current - 1);
  }, [goToSlide]);

  const goToNext = useCallback(() => {
    goToSlide(currentSlideRef.current + 1);
  }, [goToSlide]);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setInterval(goToNext, 6000);
    return () => window.clearInterval(timer);
  }, [goToNext, slides.length]);

  useEffect(() => {
    if (currentSlide >= slides.length) {
      currentSlideRef.current = 0;
      setCurrentSlide(0);
    }
  }, [currentSlide, slides.length]);

  if (!slides.length) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-[#10264f] text-center text-white">
        <p className="font-serif text-3xl font-bold">Able God College</p>
      </div>
    );
  }

  const active = slides[currentSlide] ?? slides[0];

  return (
    <div
      className="relative min-h-[600px] md:h-[92vh] w-full flex items-center justify-center overflow-hidden bg-[#10264f] select-none"
      aria-roledescription="carousel"
      aria-label="Able God College Highlights Carousel"
    >
      {/* Background slide images with Gateway High scaling */}
      <div className="absolute inset-0 z-0 bg-[#10264f]">
        {slides.map((slide, index) => {
          const isActive = index === currentSlide;
          return (
            <div
              key={slide.image + index}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isActive ? "opacity-100 z-10" : "opacity-0 pointer-events-none z-0"
              }`}
              aria-hidden={!isActive}
            >
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover object-center transform scale-100 transition-transform duration-1000 ease-out"
                loading={index === 0 ? "eager" : "lazy"}
              />
            </div>
          );
        })}

        {/* Gateway High collegiate gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#10264f]/25 via-[#10264f]/60 to-[#10264f]/95 z-10 pointer-events-none" />
      </div>

      {/* Gateway High Centered Collegiate Content */}
      <div className="container relative z-10 mx-auto px-4 text-center py-20 sm:pb-28 lg:pb-32">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Pill Badge */}
          <div className="inline-block bg-[#c51f67] text-white px-5 py-1.5 rounded-full text-xs sm:text-sm font-bold tracking-widest uppercase mb-2 shadow-md">
            Able God College • Chitungwiza
          </div>

          {/* Heading */}
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.08] drop-shadow-sm">
            A Place Where Every Student Thrives
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg md:text-xl text-white/90 max-w-4xl mx-auto font-light leading-relaxed">
            Excellence in Christian secondary education, disciplined character formation, and holistic academic growth. Motto: <span className="font-semibold italic text-pink-300">B&apos;EZRAT HESHAM</span>.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Link
              to="/admissions"
              className="inline-flex items-center justify-center gap-2 bg-[#c51f67] text-white hover:bg-[#a61755] px-10 h-14 text-base sm:text-lg font-bold rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 w-full sm:w-auto"
            >
              <GraduationCap className="h-5 w-5" />
              <span>Admissions & Fees (US$ 200/Term)</span>
            </Link>
            <Link
              to="/academics"
              className="inline-flex items-center justify-center gap-2 bg-transparent text-white border-2 border-white/70 hover:bg-white hover:text-[#10264f] px-10 h-14 text-base sm:text-lg font-bold rounded-xl backdrop-blur-sm transition-all hover:-translate-y-0.5 w-full sm:w-auto"
            >
              <span>Explore Academics</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Slide counter badge (Gateway High style) */}
      <div className="absolute top-5 right-5 sm:top-8 sm:right-10 z-20 bg-black/40 backdrop-blur-md text-white text-xs font-bold px-3.5 py-1.5 rounded-full border border-white/15">
        {currentSlide + 1} / {slides.length}
      </div>

      {/* Slide caption pill (bottom-left) */}
      <div className="absolute bottom-6 sm:bottom-8 left-4 sm:left-10 z-20 max-w-xs sm:max-w-md bg-[#10264f]/85 border border-white/20 backdrop-blur-md rounded-xl px-4 py-2.5 text-white shadow-xl text-left hidden sm:block">
        <span className="block text-[10px] font-bold uppercase tracking-wider text-pink-300">Campus Highlight</span>
        <p className="text-sm font-bold truncate">{active.title}</p>
        <p className="text-xs text-white/80 truncate">{active.description}</p>
      </div>

      {/* Navigation arrows (frosted circular buttons) */}
      <button
        onClick={goToPrevious}
        aria-label="Previous slide"
        className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/40 transition-colors flex items-center justify-center text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={goToNext}
        aria-label="Next slide"
        className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/40 transition-colors flex items-center justify-center text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Slide dot indicators (bottom-right) */}
      <div className="absolute bottom-6 sm:bottom-8 right-4 sm:right-10 z-20 flex gap-1.5 items-center">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={`rounded-full transition-all duration-300 ${
              index === currentSlide
                ? "w-7 h-2.5 bg-[#c51f67]"
                : "w-2.5 h-2.5 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>

      {/* Animated scroll down indicator (Gateway High signature) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 hidden sm:block pointer-events-none">
        <div className="w-[1px] h-10 bg-white/40 mx-auto animate-pulse" />
      </div>
    </div>
  );
};

export default HeroCarousel;
