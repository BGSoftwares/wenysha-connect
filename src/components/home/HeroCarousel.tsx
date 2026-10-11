import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import s6252 from "@/assets/slides/slide-6252.jpeg.asset.json";
import s6255 from "@/assets/slides/slide-6255.jpeg.asset.json";
import s6256 from "@/assets/slides/slide-6256.jpeg.asset.json";
import s6254 from "@/assets/slides/slide-6254.jpeg.asset.json";
import s6258 from "@/assets/slides/slide-6258.jpeg.asset.json";
import s6259 from "@/assets/slides/slide-6259.jpeg.asset.json";
import s6260 from "@/assets/slides/slide-6260.jpeg.asset.json";
import s6262 from "@/assets/slides/slide-6262.jpeg.asset.json";
import s6263 from "@/assets/slides/slide-6263.jpeg.asset.json";
import s6264 from "@/assets/slides/slide-6264.jpeg.asset.json";

const slides = [
  { image: s6252.url, title: "Learners gathered at assembly", description: "Able God College learners in uniform at morning assembly." },
  { image: s6255.url, title: "Our learners", description: "Learners standing together on the school grounds." },
  { image: s6256.url, title: "Proud in pink and navy", description: "Able God College learners in full uniform." },
  { image: s6254.url, title: "School gathering", description: "Learners gathered around the Able God College banner." },
  { image: s6258.url, title: "Prize giving", description: "A staff member speaks with a learner on stage." },
  { image: s6259.url, title: "Celebrating achievement", description: "Staff and learners at an awards ceremony." },
  { image: s6260.url, title: "Staff and community", description: "Staff and guests celebrating together." },
  { image: s6262.url, title: "Celebration day", description: "The school community singing together." },
  { image: s6263.url, title: "Joyful moments", description: "Staff and guests clapping during celebrations." },
  { image: s6264.url, title: "Together as one", description: "Staff, learners and guests standing together." },
];

const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentSlide((previous) => (previous + 1) % slides.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, []);

  const goToPrevious = () => {
    setCurrentSlide((previous) => (previous - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentSlide((previous) => (previous + 1) % slides.length);
  };

  return (
    <div
      className="absolute inset-0 h-full w-full overflow-hidden bg-gradient-to-br from-[#102a60] via-[#392862] to-[#e72d86]"
      aria-roledescription="carousel"
      aria-label="Able God College highlights"
    >
      {slides.map((slide, index) => (
        <div
          key={slide.image}
          className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? "opacity-100" : "pointer-events-none opacity-0"}`}
          aria-hidden={index !== currentSlide}
        >
          <img
            src={slide.image}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full scale-110 object-cover opacity-45 blur-2xl"
            loading="lazy"
          />
          <img
            src={slide.image}
            alt={slide.title}
            className="absolute inset-0 h-full w-full object-contain p-2 md:p-5"
            loading={index === 0 ? "eager" : "lazy"}
          />
          <span className="sr-only">{slide.description}</span>
        </div>
      ))}

      <div className="absolute bottom-20 left-4 z-20 max-w-[calc(100%-2rem)] rounded-2xl border border-white/20 border-l-4 border-l-[#ed2d86] bg-[#10264f]/90 px-4 py-3 text-white shadow-xl backdrop-blur-md md:bottom-8 md:left-8 md:max-w-[min(45%,28rem)] md:px-6 md:py-4">
        <p className="text-sm font-bold leading-snug md:text-lg">{slides[currentSlide].title}</p>
        <p className="mt-1 text-xs leading-relaxed text-white/85 md:text-sm">{slides[currentSlide].description}</p>
      </div>

      <div className="absolute bottom-5 right-5 z-20 flex items-center gap-3 rounded-full border border-white/25 bg-[#102a60]/75 px-3 py-2 text-white shadow-lg backdrop-blur-sm md:bottom-8 md:right-8">
        <button onClick={goToPrevious} aria-label="Previous slide" className="rounded-full p-1 hover:text-pink-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex gap-2" aria-label={`Slide ${currentSlide + 1} of ${slides.length}`}>
          {slides.map((slide, index) => (
            <button
              key={slide.image}
              aria-label={`Show slide ${index + 1}: ${slide.title}`}
              aria-current={index === currentSlide}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all ${index === currentSlide ? "w-7 bg-pink-400" : "w-2 bg-white/60 hover:bg-white"}`}
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
