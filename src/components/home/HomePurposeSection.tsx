import { Heart, Sparkles } from "lucide-react";

const values = [
  "To spread the Gospel and promote Biblical thinking",
  "To value and care for each member of our community",
  "To demonstrate the character of God by our conduct and relationships",
  "To reflect the diversity of God's creation in our community",
  "To develop staff so that all our activities are characterised by excellence",
  "To strengthen the family and involve parents in the education of their children",
  "To develop Godly self-worth, initiative, leadership and self discipline",
  "To encourage healthy competition, co-operation & communication",
];

const HomePurposeSection = () => (
  <>
    <section className="bg-white py-16 md:py-20" aria-labelledby="our-purpose-heading">
      <div className="container mx-auto grid max-w-7xl gap-10 px-4 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-[#c51f67]">Faith · Learning · Service</p>
          <h2 id="our-purpose-heading" className="mt-2 font-serif text-3xl font-black uppercase tracking-wide text-[#10264f] md:text-4xl">
            Our Purpose
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-[#575264]">
            Our purpose, as a Bible-based Christian Educational Community, is to glorify God through serving our nation and impacting the world.
          </p>
        </div>

        <figure className="relative overflow-hidden rounded-3xl bg-[#10264f] p-7 text-white shadow-xl md:p-10">
          <Sparkles className="absolute right-6 top-6 h-8 w-8 text-[#ed2b78]/70" aria-hidden="true" />
          <blockquote className="max-w-3xl font-serif text-xl font-semibold leading-relaxed md:text-2xl">
            “Able God College exists not merely to produce students who pass examinations, but to shape young men and women of faith, integrity and purpose — citizens who will serve the nation and impact the world.”
          </blockquote>
          <figcaption className="mt-6 border-t border-white/15 pt-5">
            <span className="block font-bold text-white">Mrs. Gororo</span>
            <span className="mt-1 block text-sm text-white/70">Principal, Able God College</span>
            <span className="mt-3 block text-xs font-semibold uppercase tracking-[0.14em] text-[#f082a9]">A Word From the Principal</span>
          </figcaption>
        </figure>
      </div>
    </section>

    <section className="bg-[#f3f1f5] py-16 md:py-20" aria-labelledby="our-values-heading">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#10264f] text-[#ed2b78]">
            <Heart className="h-6 w-6" aria-hidden="true" />
          </span>
          <h2 id="our-values-heading" className="mt-4 font-serif text-3xl font-black uppercase tracking-wide text-[#10264f] md:text-4xl">
            Our Values
          </h2>
          <p className="mt-3 text-[#575264]">The principles that shape how we learn, serve and grow together.</p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value, index) => (
            <li key={value} className="flex items-start gap-3 rounded-2xl border border-[#10264f]/10 bg-white p-5 shadow-sm">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#c51f67]/10 text-sm font-extrabold text-[#c51f67]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="pt-1 text-sm font-semibold leading-relaxed text-[#10264f]">{value}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  </>
);

export default HomePurposeSection;
