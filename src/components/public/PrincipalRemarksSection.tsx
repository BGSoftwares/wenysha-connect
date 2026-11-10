import communityPhoto from "@/assets/new-school-media/school-community-celebration.jpeg";
import assemblyPhoto from "@/assets/new-school-media/school-assembly.jpeg";
import { schoolMission, schoolVision } from "@/lib/schoolInformation";

const PrincipalRemarksSection = () => (
  <section className="bg-[#f3f1f5] py-16 md:py-20" aria-labelledby="principal-remarks-heading">
    <div className="container mx-auto grid max-w-7xl items-center gap-10 px-4 lg:grid-cols-[1.05fr_0.95fr]">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#c51f67]">Able God College</p>
        <h2 id="principal-remarks-heading" className="mt-2 font-serif text-3xl font-black uppercase tracking-wide text-[#10264f] md:text-4xl">
          Principal’s Remarks
        </h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          The school’s mission and vision guide our work with every learner and family in the Able God College community.
        </p>
        <div className="mt-7 space-y-5">
          <article className="border-l-4 border-[#c51f67] bg-white p-5 shadow-sm sm:p-6">
            <h3 className="font-heading text-sm font-extrabold uppercase tracking-[0.16em] text-[#c51f67]">Our Mission</h3>
            <p className="mt-2 leading-relaxed text-[#10264f]">{schoolMission}</p>
          </article>
          <article className="border-l-4 border-[#10264f] bg-white p-5 shadow-sm sm:p-6">
            <h3 className="font-heading text-sm font-extrabold uppercase tracking-[0.16em] text-[#c51f67]">Our Vision</h3>
            <p className="mt-2 leading-relaxed text-[#10264f]">{schoolVision}</p>
          </article>
        </div>
      </div>

      <div className="grid h-[23rem] grid-cols-5 grid-rows-2 gap-3 sm:h-[28rem]">
        <figure className="col-span-3 row-span-2 overflow-hidden rounded-2xl shadow-lg">
          <img src={communityPhoto} alt="Able God College staff and community members gathered together" className="h-full w-full object-cover" loading="lazy" />
        </figure>
        <figure className="col-span-2 row-span-2 overflow-hidden rounded-2xl shadow-lg">
          <img src={assemblyPhoto} alt="Able God College learners gathered in navy and pink uniforms" className="h-full w-full object-cover" loading="lazy" />
        </figure>
      </div>
    </div>
  </section>
);

export default PrincipalRemarksSection;
