import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import s6252 from "@/assets/slides/slide-6252.jpeg";
import s6255 from "@/assets/slides/slide-6255.jpeg";
import s6256 from "@/assets/slides/slide-6256.jpeg";
import s6254 from "@/assets/slides/slide-6254.jpeg";
import s6259 from "@/assets/slides/slide-6259.jpeg";
import s6260 from "@/assets/slides/slide-6260.jpeg";
import s6262 from "@/assets/slides/slide-6262.jpeg";
import s6264 from "@/assets/slides/slide-6264.jpeg";
import communityGroup2 from "@/assets/new-school-media/school-community-group-2.jpeg";
import schoolAssembly from "@/assets/new-school-media/school-assembly.jpeg";

const showcaseSlides = [
  { src: s6252, label: "Assembly", caption: "Morning Assembly & Devotion" },
  { src: s6256, label: "Uniform", caption: "Proud in Able God Navy & Pink" },
  { src: communityGroup2, label: "Community", caption: "Educators & Learners Standing Together" },
  { src: schoolAssembly, label: "Gathering", caption: "Disciplined Learner Cohort" },
  { src: s6255, label: "Campus Life", caption: "Vibrant School Grounds" },
  { src: s6259, label: "Excellence", caption: "Academic Awards & Recognition" },
  { src: s6260, label: "Staff", caption: "Dedicated Teaching Faculty" },
  { src: s6264, label: "Celebration", caption: "United in Faith and Purpose" },
  { src: s6254, label: "Tradition", caption: "B'EZRAT HESHAM Motto" },
  { src: s6262, label: "Worship", caption: "School Praise & Celebration" },
];

const PhotoCarouselSection = () => {
  const [current, setCurrent] = useState(0);
  const total = showcaseSlides.length;

  const goToSlide = useCallback((nextIndex: number) => {
    setCurrent((nextIndex + total) % total);
  }, [total]);

  const prev = () => goToSlide(current - 1);
  const next = useCallback(() => goToSlide(current + 1), [current, goToSlide]);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  const slide = showcaseSlides[current];

  return (
    <section className="py-0 bg-background overflow-hidden" aria-label="Campus Photo Carousel">
      <div className="relative h-[340px] sm:h-[460px] md:h-[540px] w-full select-none bg-[#10264f]">
        {showcaseSlides.map((item, idx) => {
          const isActive = idx === current;
          return (
            <div
              key={item.label + idx}
              className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
                isActive ? "opacity-100 z-10" : "opacity-0 pointer-events-none z-0"
              }`}
            >
              <img
                src={item.src}
                alt={item.caption}
                className="w-full h-full object-cover object-center"
                loading={idx === 0 ? "eager" : "lazy"}
              />
            </div>
          );
        })}

        {/* Gradient Overlay matching Gateway High eG */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#10264f]/85 via-[#10264f]/15 to-transparent z-10 pointer-events-none" />

        {/* Caption bottom-left */}
        <div className="absolute bottom-0 left-0 p-6 sm:p-10 z-20">
          <span className="inline-block bg-[#c51f67] text-white text-[10px] sm:text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-2 shadow-sm">
            {slide.label}
          </span>
          <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-white drop-shadow-sm">
            {slide.caption}
          </h3>
        </div>

        {/* Previous button */}
        <button
          onClick={prev}
          aria-label="Previous image"
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/20 backdrop-blur hover:bg-white/40 transition-colors flex items-center justify-center text-white shadow-md focus:outline-none focus:ring-2 focus:ring-white"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Next button */}
        <button
          onClick={next}
          aria-label="Next image"
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/20 backdrop-blur hover:bg-white/40 transition-colors flex items-center justify-center text-white shadow-md focus:outline-none focus:ring-2 focus:ring-white"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Dots bottom-right */}
        <div className="absolute bottom-5 right-6 sm:right-10 z-20 flex gap-1.5 items-center">
          {showcaseSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`rounded-full transition-all duration-300 ${
                idx === current
                  ? "w-6 h-2.5 bg-[#c51f67]"
                  : "w-2.5 h-2.5 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>

        {/* Counter top-right */}
        <div className="absolute top-5 right-6 sm:right-10 z-20 bg-black/40 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full border border-white/10">
          {current + 1} / {total}
        </div>
      </div>
    </section>
  );
};

export default PhotoCarouselSection;
