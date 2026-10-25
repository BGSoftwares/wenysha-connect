import { ArrowRight, Award, BookOpenCheck, MapPin, Phone, ShieldCheck, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import groupOfSchoolsFlyer from "@/assets/new-school-media/group-of-schools-flyer.jpeg";
import preparationFlyer from "@/assets/new-school-media/grade7-form1-preparation.jpeg";
import { schoolContact } from "@/lib/schoolContact";

const reasons = [
  { icon: ShieldCheck, title: "Safe & nurturing", text: "A safe and nurturing environment for learners." },
  { icon: UsersRound, title: "Caring teachers", text: "Qualified, caring and experienced teachers." },
  { icon: BookOpenCheck, title: "Strong foundations", text: "A strong academic foundation and holistic development." },
];

const SchoolStructureSection = () => (
  <section className="relative overflow-hidden bg-[#f5f3f7] py-16 md:py-24" aria-labelledby="school-structure-title">
    <div className="pointer-events-none absolute -right-28 -top-32 h-96 w-96 rounded-full border-[44px] border-[#c51f67]/[0.06]" aria-hidden="true" />
    <div className="container relative mx-auto max-w-7xl px-4">
      <div className="mb-10 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-[#c51f67]">One school community · Early years to secondary</p>
          <h2 id="school-structure-title" className="mt-2 font-serif text-3xl font-black uppercase tracking-wide text-[#18112f] sm:text-4xl">Able God Group of Schools</h2>
          <p className="mt-1 text-base font-extrabold uppercase tracking-[0.14em] text-[#c51f67]">School Structure &amp; Preparation</p>
          <p className="mt-3 max-w-2xl leading-relaxed text-[#575264]">
            We teach the truth, train the mind and transform lives. Explore our Junior and College levels, then contact the school for current enrolment details.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-3 rounded-xl bg-[#18112f] px-5 py-4 text-white shadow-lg shadow-[#18112f]/15">
          <Award className="h-8 w-8 shrink-0 text-[#ed2b78]" aria-hidden="true" />
          <span className="max-w-48 text-sm font-bold leading-snug">Winner · Best Independent College in Masvingo</span>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
        <figure className="relative mx-auto w-full max-w-[34rem] overflow-hidden rounded-3xl border border-[#18112f]/10 bg-white p-3 shadow-[0_24px_64px_-32px_rgba(24,17,47,0.45)]">
          <div className="absolute inset-x-3 top-3 z-10 rounded-t-2xl bg-gradient-to-r from-[#18112f] to-[#c51f67] px-4 py-3 text-center text-sm font-extrabold uppercase tracking-[0.14em] text-white">
            Discover the Group of Schools
          </div>
          <img
            src={groupOfSchoolsFlyer}
            alt="Able God Group of Schools flyer: Able God Junior, ECD to Grade 6, and Able God College, Form 1 to Form 4"
            className="w-full rounded-2xl object-contain pt-12"
            loading="lazy"
          />
          <figcaption className="sr-only">The flyer lists Junior from ECD to Grade 6 and College from Form 1 to Form 4.</figcaption>
        </figure>

        <div className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-2xl border border-[#18112f]/10 bg-white p-5 shadow-sm">
              <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#c51f67]">Junior School</span>
              <h3 className="mt-2 font-serif text-2xl font-black text-[#18112f]">ECD – Grade 6</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#575264]">A nurturing environment, caring teachers and a strong academic foundation.</p>
            </article>
            <article className="rounded-2xl border border-[#18112f]/10 bg-white p-5 shadow-sm">
              <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#c51f67]">College</span>
              <h3 className="mt-2 font-serif text-2xl font-black text-[#18112f]">Form 1 – Form 4</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#575264]">Quality secondary education, discipline, good values and future opportunities.</p>
            </article>
          </div>

          <div className="grid gap-5 rounded-2xl bg-[#18112f] p-6 text-white sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#ed2b78]">Enrolment enquiries</p>
              <h3 className="mt-1 font-serif text-2xl font-bold">Take the next step</h3>
              <ol className="mt-4 grid gap-2 text-sm text-white/80">
                <li><span className="mr-2 font-bold text-[#ed2b78]">01</span>Contact the school and tell us the learner’s current grade.</li>
                <li><span className="mr-2 font-bold text-[#ed2b78]">02</span>Let us know whether you are enquiring about Junior or College.</li>
                <li><span className="mr-2 font-bold text-[#ed2b78]">03</span>Ask the school for current application and fee information.</li>
              </ol>
            </div>
            <div className="flex flex-col gap-2 sm:min-w-52">
              {schoolContact.phones.map((phone) => (
                <a key={phone.href} href={phone.href} className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold transition hover:bg-[#c51f67]">
                  <Phone className="h-4 w-4 text-[#ed2b78]" aria-hidden="true" />{phone.label}
                </a>
              ))}
              <Link to="/contact" className="mt-1 inline-flex items-center justify-center gap-2 rounded-lg bg-[#c51f67] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#a71955]">
                Contact the school <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div>
            <h3 className="mb-3 font-serif text-xl font-bold text-[#18112f]">Why choose Able God?</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {reasons.map(({ icon: Icon, title, text }) => (
                <article key={title} className="flex gap-3 rounded-xl border border-[#18112f]/10 bg-white p-4">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#c51f67]" aria-hidden="true" />
                  <div><h4 className="text-sm font-extrabold text-[#18112f]">{title}</h4><p className="mt-1 text-xs leading-relaxed text-[#575264]">{text}</p></div>
                </article>
              ))}
            </div>
          </div>

          <Link to="/announcements" className="group flex items-center gap-4 rounded-2xl border border-[#c51f67]/20 bg-white p-3 transition hover:border-[#c51f67]/50 hover:shadow-md">
            <img src={preparationFlyer} alt="Grade 7 to Form 1 preparation programme flyer" className="h-20 w-16 shrink-0 rounded-lg object-cover" loading="lazy" />
            <span className="min-w-0 flex-1"><span className="block text-xs font-extrabold uppercase tracking-[0.16em] text-[#c51f67]">Preparation Programme</span><span className="mt-1 block font-bold text-[#18112f]">Grade 7 to Form 1 · Free of charge</span><span className="mt-1 block text-xs text-[#575264]">Maths, English, Science and study habits</span></span>
            <ArrowRight className="mr-2 h-5 w-5 shrink-0 text-[#c51f67] transition group-hover:translate-x-1" aria-hidden="true" />
          </Link>
          <p className="inline-flex items-center gap-2 text-xs font-semibold text-[#575264]"><MapPin className="h-4 w-4 text-[#c51f67]" aria-hidden="true" />{schoolContact.address}</p>
        </div>
      </div>
    </div>
  </section>
);

export default SchoolStructureSection;
