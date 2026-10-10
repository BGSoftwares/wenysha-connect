import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import ableGodSchoolFlyer from "@/assets/able-god-school-flyer.png";
import ableGodClassOf2026 from "@/assets/able-god-class-2026.png";
import communityWhiteShirts from "@/assets/IMG_6138.jpg";
import groupCelebration from "@/assets/IMG_6137.jpg";
import classOf2026Portrait from "@/assets/IMG_6140.jpg";
import communityPortrait from "@/assets/IMG_6139.jpg";
import schoolCommunity from "@/assets/IMG_6135.jpg";
import studentInterview from "@/assets/IMG_6142.jpg";
import schoolCelebration from "@/assets/IMG_6145.jpg";
import teacherInterview from "@/assets/IMG_6141.jpg";
import learnersGroup from "@/assets/IMG_6143.jpg";
import learnersGroupTwo from "@/assets/IMG_6144.jpg";
import learnersGroupThree from "@/assets/IMG_6134.jpg";
import learnersActivities from "@/assets/IMG_6136.jpg";

const slides = [
  {
    image: ableGodSchoolFlyer,
    title: "Able God Group of Schools admissions flyer",
    description: "Admissions information for Able God Junior and Able God College.",
  },
  {
    image: ableGodClassOf2026,
    title: "Able God College Class of 2026 billboard",
    description: "Celebrating the Able God College Class of 2026.",
  },
  {
    image: communityWhiteShirts,
    title: "Able God College community in Class of 2026 shirts",
    description: "Learners and staff gather outside the school in Class of 2026 shirts.",
  },
  {
    image: groupCelebration,
    title: "Able God College community celebration",
    description: "Learners and staff celebrate together on the school grounds.",
  },
  {
    image: classOf2026Portrait,
    title: "Class of 2026 supporter",
    description: "A member of the Able God College community wearing a Class of 2026 shirt.",
  },
  {
    image: communityPortrait,
    title: "Able God College Class of 2026 group photo",
    description: "Learners and staff pose together in their Class of 2026 shirts.",
  },
  {
    image: schoolCommunity,
    title: "Able God College school community",
    description: "A group of learners and staff gathers outside the college.",
  },
  {
    image: studentInterview,
    title: "Able God College community interview",
    description: "A learner interviews a member of the school community.",
  },
  {
    image: schoolCelebration,
    title: "Able God College celebration",
    description: "Learners and staff share a celebration at the college.",
  },
  {
    image: teacherInterview,
    title: "Able God College staff interview",
    description: "A learner interviews a staff member at the college.",
  },
  {
    image: learnersGroup,
    title: "Able God College learners and staff",
    description: "Learners and staff stand together at the college.",
  },
  {
    image: learnersGroupTwo,
    title: "Able God College community group",
    description: "The school community gathers outside the college building.",
  },
  {
    image: learnersGroupThree,
    title: "Able God College community portrait",
    description: "Learners and staff pose together at the school.",
  },
  {
    image: learnersActivities,
    title: "Able God College community activities",
    description: "Learners and staff take part in activities outside the school.",
  },
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
