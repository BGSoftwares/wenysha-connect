import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [previousSlide, setPreviousSlide] = useState<number | null>(null);
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
  const currentSlideRef = useRef(0);
  const { data: carousel } = useQuery({
    queryKey: ["hero-carousel"],
    queryFn: () => api.get<CarouselResponse>("/content/gallery/carousel/"),
    retry: false,
    staleTime: 60_000,
  });
  const slides = carousel?.managed
    ? carousel.slides.map((slide) => ({
        image: slide.image_url,
        title: slide.title,
        description: slide.description,
        fit: slide.display_mode || "cover",
      }))
    : defaultHeroSlides;

  const goToSlide = useCallback((nextSlide: number, direction?: 1 | -1) => {
    if (!slides.length) return;
    const current = currentSlideRef.current;
    if (nextSlide === current) return;

    const forwardDistance = (nextSlide - current + slides.length) % slides.length;
    const resolvedDirection = direction ?? (forwardDistance <= slides.length / 2 ? 1 : -1);
    setPreviousSlide(current);
    setSlideDirection(resolvedDirection);
    currentSlideRef.current = nextSlide;
    setCurrentSlide(nextSlide);
  }, [slides.length]);

  const goToPrevious = useCallback(() => {
    if (!slides.length) return;
    goToSlide((currentSlideRef.current - 1 + slides.length) % slides.length, -1);
  }, [goToSlide, slides.length]);

  const goToNext = useCallback(() => {
    if (!slides.length) return;
    goToSlide((currentSlideRef.current + 1) % slides.length, 1);
  }, [goToSlide, slides.length]);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setInterval(goToNext, 6500);
    return () => window.clearInterval(timer);
  }, [goToNext, slides.length]);

  useEffect(() => {
    if (currentSlide >= slides.length) {
      currentSlideRef.current = 0;
      setCurrentSlide(0);
    }
  }, [currentSlide, slides.length]);

  useEffect(() => {
    const timer = window.setTimeout(() => setPreviousSlide(null), 1100);
    return () => window.clearTimeout(timer);
  }, [currentSlide]);

  if (!slides.length) {
    return <div className="absolute inset-0 flex items-center justify-center bg-[#10264f] text-center text-white">
      <p className="font-heading text-3xl font-bold">Able God College</p>
    </div>;
  }

  const activeSlideIndex = currentSlide < slides.length ? currentSlide : 0;

  return (
    <div
      className="absolute inset-0 h-full w-full overflow-hidden bg-[#10264f]"
      aria-roledescription="carousel"
      aria-label="Able God College highlights"
    >
      {slides.map((slide, index) => {
        const isActive = index === activeSlideIndex;
        const isLeaving = index === previousSlide;
        const offset = isActive ? 0 : isLeaving ? -slideDirection * 100 : slideDirection * 100;
        return (
        <div
          key={slide.image}
          className={`hero-slide absolute inset-0 ${isActive ? "opacity-100" : "pointer-events-none opacity-0"}`}
          style={{ transform: `translate3d(${offset}%, 0, 0)`, zIndex: isActive ? 20 : isLeaving ? 10 : 0 }}
          aria-hidden={!isActive}
        >
          {slide.fit === "contain" && (
            <img
              src={slide.image}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full scale-110 object-cover opacity-45 blur-2xl"
              loading="lazy"
            />
          )}
          <img
            src={slide.image}
            alt={slide.title}
            className={`hero-slide-image absolute inset-0 h-full w-full ${slide.fit === "contain" ? "object-contain" : "object-cover"} ${isActive ? slide.fit === "contain" ? "hero-slide-image-active-contained" : "hero-slide-image-active" : ""}`}
            loading={index === 0 ? "eager" : "lazy"}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#07132a]/20 via-transparent to-[#07132a]/45" />
          <span className="sr-only">{slide.description}</span>
        </div>
        );
      })}

      <div key={activeSlideIndex} aria-live="polite" className="hero-caption absolute bottom-20 left-4 z-20 max-w-[calc(100%-2rem)] rounded-2xl border border-white/20 border-l-4 border-l-[#ed2d86] bg-[#10264f]/90 px-4 py-3 text-white shadow-xl backdrop-blur-md md:bottom-8 md:left-8 md:max-w-[min(45%,28rem)] md:px-6 md:py-4">
        <p className="text-sm font-bold leading-snug md:text-lg">{slides[activeSlideIndex].title}</p>
        <p className="mt-1 text-xs leading-relaxed text-white/85 md:text-sm">{slides[activeSlideIndex].description}</p>
      </div>

      <div className="absolute bottom-5 right-5 z-20 flex items-center gap-3 rounded-full border border-white/25 bg-[#102a60]/75 px-3 py-2 text-white shadow-lg backdrop-blur-sm md:bottom-8 md:right-8">
        <button onClick={goToPrevious} aria-label="Previous slide" className="rounded-full p-1 hover:text-pink-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex gap-2" aria-label={`Slide ${activeSlideIndex + 1} of ${slides.length}`}>
          {slides.map((slide, index) => (
            <button
              key={slide.image}
              aria-label={`Show slide ${index + 1}: ${slide.title}`}
              aria-current={index === activeSlideIndex}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all ${index === activeSlideIndex ? "w-7 bg-pink-400" : "w-2 bg-white/60 hover:bg-white"}`}
            />
          ))}
        </div>
        <button onClick={goToNext} aria-label="Next slide" className="rounded-full p-1 hover:text-pink-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default HeroCarousel;
