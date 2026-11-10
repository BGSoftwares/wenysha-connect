import { Link } from "react-router-dom";
import { ArrowRight, Camera, Heart } from "lucide-react";
import communityPhoto from "@/assets/new-school-media/school-community-gathering.jpeg";
import celebrationPhoto from "@/assets/new-school-media/school-community-celebration.jpeg";
import assemblyPhoto from "@/assets/new-school-media/school-assembly.jpeg";

const photos = [
  { src: communityPhoto, alt: "Able God College community members gathered together", label: "Our community" },
  { src: celebrationPhoto, alt: "Able God College community celebrating together", label: "Celebrating together" },
  { src: assemblyPhoto, alt: "Able God College learners gathered at a school assembly", label: "School assembly" },
];

const SchoolCommunitySection = () => (
  <section className="relative overflow-hidden bg-[#10264f] py-16 text-white md:py-24">
    <div className="pointer-events-none absolute -left-28 -top-32 h-96 w-96 rounded-full border-[48px] border-[#c51f67]/20" aria-hidden="true" />
    <div className="container relative mx-auto grid max-w-7xl items-center gap-10 px-4 lg:grid-cols-[0.85fr_1.15fr]">
      <div className="max-w-xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[#ff71a4]">
          <Heart className="h-4 w-4" aria-hidden="true" />More than the classroom
        </span>
        <h2 className="mt-5 font-serif text-4xl font-black uppercase tracking-wide sm:text-5xl">School Life</h2>
        <p className="mt-5 max-w-lg text-base leading-relaxed text-white/85">
          A community of learners, families and educators growing together. Explore moments from assemblies, celebrations and everyday life at Able God College.
        </p>
        <Link to="/gallery" className="mt-7 inline-flex items-center gap-2 rounded-lg bg-[#c51f67] px-5 py-3 font-bold text-white transition hover:bg-[#e52a79]">
          <Camera className="h-5 w-5" aria-hidden="true" /> Explore the Gallery <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid min-h-[24rem] grid-cols-5 grid-rows-2 gap-3 sm:min-h-[30rem]">
        {photos.map((photo, index) => (
          <figure key={photo.label} className={`${index === 0 ? "col-span-3 row-span-2" : "col-span-2"} group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl`}>
            <img src={photo.src} alt={photo.alt} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#10264f]/90 via-transparent to-transparent" />
            <figcaption className="absolute bottom-0 left-0 p-4 text-sm font-bold text-white sm:p-5">{photo.label}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  </section>
);

export default SchoolCommunitySection;
