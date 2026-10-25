import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import s6252 from "@/assets/slides/slide-6252.jpeg";
import s6255 from "@/assets/slides/slide-6255.jpeg";
import s6256 from "@/assets/slides/slide-6256.jpeg";
import s6254 from "@/assets/slides/slide-6254.jpeg";
import s6258 from "@/assets/slides/slide-6258.jpeg";
import s6259 from "@/assets/slides/slide-6259.jpeg";
import s6260 from "@/assets/slides/slide-6260.jpeg";
import s6262 from "@/assets/slides/slide-6262.jpeg";
import s6263 from "@/assets/slides/slide-6263.jpeg";
import s6264 from "@/assets/slides/slide-6264.jpeg";
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

const slides = [
  { image: s6252, title: "Learners gathered at assembly", description: "Able God College learners in uniform at morning assembly.", fit: "cover" },
  { image: s6255, title: "Our learners", description: "Learners standing together on the school grounds.", fit: "cover" },
  { image: s6256, title: "Proud in pink and navy", description: "Able God College learners in full uniform.", fit: "cover" },
  { image: s6254, title: "School gathering", description: "Learners gathered around the Able God College banner.", fit: "cover" },
  { image: s6258, title: "Prize giving", description: "A staff member speaks with a learner on stage.", fit: "contain" },
  { image: s6259, title: "Celebrating achievement", description: "Staff and learners at an awards ceremony.", fit: "cover" },
  { image: s6260, title: "Staff and community", description: "Staff and guests celebrating together.", fit: "cover" },
  { image: s6262, title: "Celebration day", description: "The school community singing together.", fit: "cover" },
  { image: s6263, title: "Joyful moments", description: "Staff and guests clapping during celebrations.", fit: "cover" },
  { image: s6264, title: "Together as one", description: "Staff, learners and guests standing together.", fit: "cover" },
  { image: communityGroup1, title: "Able God College community", description: "Learners and staff gathered outdoors for a school group photograph.", fit: "cover" },
  { image: communityGroup2, title: "Learners and staff together", description: "Able God College learners and teachers standing together in school uniform.", fit: "cover" },
  { image: communityGroup3, title: "A school community gathering", description: "Staff and learners gathered together in navy and pink uniforms.", fit: "cover" },
  { image: communityGroup4, title: "School gathering", description: "Able God College students and staff gathered outdoors.", fit: "cover" },
  { image: preparationProgram, title: "Grade 7 to Form 1 Preparation Programme", description: "A free preparation programme running from 12 October to December 2026.", fit: "contain" },
  { image: communityGathering, title: "Able God College Community", description: "Staff and community members gathered together.", fit: "cover" },
  { image: groupOfSchools, title: "Able God Group of Schools", description: "A school information flyer for Able God Junior and Able God College.", fit: "contain" },
  { image: schoolAssembly, title: "School Assembly", description: "Learners gathered in their navy and pink school uniforms.", fit: "cover" },
  { image: examWishesShirt, title: "Best Wishes in Your Exams", description: "An Able God College exam wishes T-shirt design.", fit: "contain" },
  { image: communityCelebration, title: "School Community Gathering", description: "Staff and community members together at Able God College.", fit: "cover" },
  { image: novemberExams, title: "November 2026 Exams", description: "Best wishes to the Class of November 2026.", fit: "contain" },
];

const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [previousSlide, setPreviousSlide] = useState<number | null>(null);
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
  const currentSlideRef = useRef(0);

  const goToSlide = useCallback((nextSlide: number, direction?: 1 | -1) => {
    const current = currentSlideRef.current;
    if (nextSlide === current) return;

    const forwardDistance = (nextSlide - current + slides.length) % slides.length;
    const resolvedDirection = direction ?? (forwardDistance <= slides.length / 2 ? 1 : -1);
    setPreviousSlide(current);
    setSlideDirection(resolvedDirection);
    currentSlideRef.current = nextSlide;
    setCurrentSlide(nextSlide);
  }, []);

  const goToPrevious = useCallback(() => {
    goToSlide((currentSlideRef.current - 1 + slides.length) % slides.length, -1);
  }, [goToSlide]);

  const goToNext = useCallback(() => {
    goToSlide((currentSlideRef.current + 1) % slides.length, 1);
  }, [goToSlide]);

  useEffect(() => {
    const timer = window.setInterval(goToNext, 6500);
    return () => window.clearInterval(timer);
  }, [goToNext]);

  useEffect(() => {
    const timer = window.setTimeout(() => setPreviousSlide(null), 1100);
    return () => window.clearTimeout(timer);
  }, [currentSlide]);

  return (
    <div
      className="absolute inset-0 h-full w-full overflow-hidden bg-[#10264f]"
      aria-roledescription="carousel"
      aria-label="Able God College highlights"
    >
      {slides.map((slide, index) => {
        const isActive = index === currentSlide;
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
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#07132a]/45 via-[#07132a]/10 to-[#07132a]/55" />
          <span className="sr-only">{slide.description}</span>
        </div>
        );
      })}

      <div key={currentSlide} aria-live="polite" className="hero-caption absolute bottom-20 left-4 z-20 max-w-[calc(100%-2rem)] rounded-2xl border border-white/20 border-l-4 border-l-[#ed2d86] bg-[#10264f]/90 px-4 py-3 text-white shadow-xl backdrop-blur-md md:bottom-8 md:left-8 md:max-w-[min(45%,28rem)] md:px-6 md:py-4">
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
              onClick={() => goToSlide(index)}
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
