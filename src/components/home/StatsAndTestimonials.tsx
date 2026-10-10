import { useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";

const stats = [
  { value: 450, suffix: "+", label: "Students" },
  { value: 35, suffix: "", label: "Qualified Teachers" },
  { value: 92, suffix: "%", label: "Pass Rate" },
  { value: 15, suffix: "+", label: "Clubs & Sports" },
];

const Counter = ({ to, suffix }: { to: number; suffix: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (t: number) => {
        const p = Math.min((t - start) / 1600, 1);
        setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [to]);
  return <span ref={ref}>{n}{suffix}</span>;
};

export const StatsCounters = () => (
  <section className="py-16 bg-gradient-hero">
    <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-primary-foreground">
      {stats.map((s) => (
        <div key={s.label}>
          <div className="text-4xl md:text-5xl font-semibold"><Counter to={s.value} suffix={s.suffix} /></div>
          <p className="mt-2 text-sm uppercase tracking-widest text-primary-foreground/80">{s.label}</p>
        </div>
      ))}
    </div>
  </section>
);

const testimonials = [
  { quote: "My daughter has grown so much in confidence since joining Able God College. The teachers truly care.", name: "Mrs. Chiwenga", role: "Parent" },
  { quote: "The ZIMSEC preparation here is excellent. I passed all my O-Level subjects with strong grades.", name: "Tatenda M.", role: "Former Student" },
  { quote: "Discipline, sport and academics all come together. It feels like a family.", name: "Mr. Moyo", role: "Parent" },
  { quote: "Joining the chess club took me to the NICAZ district competitions. I never imagined that!", name: "Rutendo K.", role: "Form 3 Student" },
];

export const TestimonialsSlider = () => {
  const [emblaRef, embla] = useEmblaCarousel({ loop: true, align: "start" });
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!embla) return;
    const onSel = () => setIdx(embla.selectedScrollSnap());
    embla.on("select", onSel);
    const t = setInterval(() => embla.scrollNext(), 6000);
    return () => { clearInterval(t); embla.off("select", onSel); };
  }, [embla]);
  return (
    <section className="py-20 bg-secondary">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-semibold text-center text-foreground mb-12">What families say</h2>
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {testimonials.map((t) => (
              <div key={t.name} className="min-w-0 shrink-0 grow-0 basis-full md:basis-1/2 px-3">
                <div className="h-full bg-card rounded-2xl border border-border p-8 card-3d">
                  <Quote className="h-8 w-8 text-accent mb-4" />
                  <p className="text-lg text-foreground leading-relaxed">"{t.quote}"</p>
                  <p className="mt-6 font-semibold text-foreground">{t.name}</p>
                  <p className="text-sm text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-8 flex items-center justify-center gap-4">
          <button aria-label="Previous" onClick={() => embla?.scrollPrev()} className="h-10 w-10 rounded-full bg-card border border-border flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex gap-2">
            {testimonials.map((_, i) => (
              <button key={i} aria-label={`Go to ${i + 1}`} onClick={() => embla?.scrollTo(i)}
                className={`h-2 rounded-full transition-all ${i === idx ? "w-8 bg-accent" : "w-2 bg-border"}`} />
            ))}
          </div>
          <button aria-label="Next" onClick={() => embla?.scrollNext()} className="h-10 w-10 rounded-full bg-card border border-border flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
};
