import { Link } from "react-router-dom";
import { ArrowRight, Bell, BookOpen, Image, Mail } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import HeroCarousel from "@/components/home/HeroCarousel";
import AdmissionsSection from "@/components/home/AdmissionsSection";
import SchoolInformationPosters from "@/components/public/SchoolInformationPosters";
import SchoolCommunitySection from "@/components/public/SchoolCommunitySection";
import SchoolHighlightsSection from "@/components/public/SchoolHighlightsSection";
import PrincipalRemarksSection from "@/components/public/PrincipalRemarksSection";
import SchoolStructureSection from "@/components/home/SchoolStructureSection";

const quickLinks = [
  { icon: BookOpen, title: "Academics", description: "See ZIMSEC results and school work rules", path: "/academics" },
  { icon: Image, title: "Gallery", description: "View Able God College photographs", path: "/gallery" },
  { icon: Bell, title: "Announcements", description: "School notices", path: "/announcements" },
  { icon: Mail, title: "Contact", description: "Contact Able God College", path: "/contact" },
];

const Index = () => (
  <Layout>
    <section className="relative h-[100dvh] min-h-[700px] w-full overflow-hidden" aria-label="Able God College photographs">
      <HeroCarousel />
    </section>

    <SchoolHighlightsSection />

    <PrincipalRemarksSection />

    <SchoolStructureSection />

    <SchoolInformationPosters sections={["mission-vision"]} />

    <SchoolCommunitySection />

    <AdmissionsSection />

    <section className="bg-[#f3f1f5] py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#c51f67]">Able God College</p>
            <h2 className="mt-2 font-serif text-3xl font-black uppercase tracking-wide text-[#18112f]">Explore the Website</h2>
          </div>
          <Link to="/about" className="inline-flex items-center gap-2 font-semibold text-[#32254c] hover:text-[#c51f67]">
            About the school <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((item) => (
            <Link key={item.path} to={item.path} className="group rounded-xl border border-[#dedbe3] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#c51f67]/40 hover:shadow-lg">
              <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#18112f] text-white transition group-hover:bg-[#c51f67]">
                <item.icon className="h-5 w-5" />
              </span>
              <h3 className="text-lg font-bold text-[#18112f]">{item.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  </Layout>
);

export default Index;
