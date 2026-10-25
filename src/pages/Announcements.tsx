import { Link } from "react-router-dom";
import { ArrowRight, Bell, CalendarDays, MapPin, Phone } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import preparationProgram from "@/assets/new-school-media/grade7-form1-preparation.jpeg";
import communityGathering from "@/assets/new-school-media/school-community-gathering.jpeg";

const Announcements = () => (
  <Layout>
    <section className="bg-[#18112f] px-4 py-16 text-center text-white md:py-20">
      <div className="container mx-auto max-w-3xl">
        <Bell className="mx-auto h-10 w-10 text-[#f27aac]" aria-hidden="true" />
        <h1 className="mt-4 font-serif text-4xl font-black uppercase tracking-wide md:text-5xl">School Notices</h1>
        <p className="mt-4 text-lg text-white/80">Updates and announcements from Able God College</p>
      </div>
    </section>

    <section className="bg-[#f3f1f5] px-4 py-12 md:py-16">
      <div className="mx-auto grid max-w-6xl gap-7 lg:grid-cols-2">
        <article className="overflow-hidden rounded-2xl border border-[#dedbe3] bg-white shadow-lg">
          <img
            src={preparationProgram}
            alt="Grade 7 to Form 1 Preparation Programme flyer"
            className="max-h-[44rem] w-full bg-[#fff5fa] object-contain"
          />
          <div className="border-t-4 border-[#c51f67] p-6 sm:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#c51f67]">Programme Announcement</p>
            <h2 className="mt-2 font-serif text-2xl font-black text-[#18112f] sm:text-3xl">Grade 7 to Form 1 Preparation Programme</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">A free programme to help reduce idleness which may lead to drug abuse, and prepare learners for Form 1 with confidence.</p>
            <ul className="mt-5 space-y-2 text-sm font-medium text-[#18112f]">
              <li>• Skills in Maths, English, Science and study habits</li>
              <li>• Mentorship and guidance</li>
              <li>• Safe, supportive environment</li>
            </ul>
            <div className="mt-6 grid gap-3 border-t border-[#dedbe3] pt-5 text-sm text-[#32254c] sm:grid-cols-2">
              <p className="flex items-start gap-2"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[#c51f67]" aria-hidden="true" /><span><strong>Date:</strong> 12 October – December 2026</span></p>
              <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#c51f67]" aria-hidden="true" /><span><strong>Venue:</strong> Able God College</span></p>
              <p className="flex items-start gap-2 sm:col-span-2"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#c51f67]" aria-hidden="true" /><span><strong>Contact:</strong> 0779 381 415 / 078 583 0960</span></p>
            </div>
            <p className="mt-5 rounded-lg bg-[#18112f] px-4 py-3 text-center text-sm font-extrabold uppercase tracking-wide text-white"><span className="text-[#f27aac]">Enrol now</span> · Limited spaces · Sponsored free programme</p>
          </div>
        </article>

        <article className="overflow-hidden rounded-2xl border border-[#dedbe3] bg-white shadow-lg">
          <img
            src={communityGathering}
            alt="Able God College staff and community members gathered outdoors"
            className="aspect-[4/3] w-full object-cover"
          />
          <div className="border-t-4 border-[#18112f] p-6 sm:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#c51f67]">School Community</p>
            <h2 className="mt-2 font-serif text-2xl font-black text-[#18112f] sm:text-3xl">Able God College Community</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">A moment with the staff and community members who make up Able God College.</p>
            <Link to="/gallery" className="mt-6 inline-flex items-center gap-2 rounded-md bg-[#18112f] px-5 py-3 font-bold text-white transition hover:bg-[#c51f67]">
              View the Gallery <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </article>
      </div>
    </section>
  </Layout>
);

export default Announcements;
