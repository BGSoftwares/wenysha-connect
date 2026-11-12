import { Link } from "react-router-dom";
import { ArrowRight, Bell, BookOpen, GraduationCap, Image, Mail } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import HeroCarousel from "@/components/home/HeroCarousel";
import PhotoCarouselSection from "@/components/home/PhotoCarouselSection";
import AdmissionsSection from "@/components/home/AdmissionsSection";
import SchoolInformationPosters from "@/components/public/SchoolInformationPosters";
import SchoolCommunitySection from "@/components/public/SchoolCommunitySection";
import SchoolHighlightsSection from "@/components/public/SchoolHighlightsSection";
import PrincipalRemarksSection from "@/components/public/PrincipalRemarksSection";
import SchoolStructureSection from "@/components/home/SchoolStructureSection";
import HomePurposeSection from "@/components/home/HomePurposeSection";

const quickLinks = [
  { icon: GraduationCap, title: "Admissions", description: "Enrolment details & US$ 200/term fees", path: "/admissions" },
  { icon: BookOpen, title: "Academics", description: "ZIMSEC results & curriculum pathways", path: "/academics" },
  { icon: BookOpen, title: "Departments", description: "Academic faculty, disciplines & vision", path: "/departments" },
  { icon: Image, title: "Gallery", description: "View campus & learner photographs", path: "/gallery" },
  { icon: Bell, title: "Announcements", description: "Official school notices & updates", path: "/announcements" },
  { icon: Mail, title: "Contact", description: "Campus location & office hours", path: "/contact" },
];

const stats = [
  { value: "74.5%", label: "2025 ZIMSEC Pass Rate", color: "text-[#10264f]" },
  { value: "US$ 200", label: "Tuition Per Term", color: "text-[#c51f67]" },
  { value: "Form 1 - 4", label: "Secondary Curriculum", color: "text-[#10264f]" },
  { value: "100%", label: "Christian Values & Faith", color: "text-[#d4a017]" },
];

const Index = () => (
  <Layout>
    {/* Gateway High Hero Carousel Scaling & Size */}
    <section className="relative min-h-[600px] md:h-[92vh] w-full flex items-center justify-center overflow-hidden" aria-label="Able God College photographs">
      <HeroCarousel />
    </section>

    {/* Gateway High Floating Stats Card Banner */}
    <section className="relative z-20 mt-0 lg:-mt-12 mb-6 sm:mb-10">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-2xl border border-[#dedbe3] overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className={`text-center py-7 sm:py-8 px-4 ${
                  i < 3 ? "border-r border-[#dedbe3]" : ""
                } ${i >= 2 ? "border-t md:border-t-0 border-[#dedbe3]" : ""}`}
              >
                <div className={`font-serif text-3xl sm:text-4xl md:text-5xl font-bold ${stat.color} mb-1.5`}>
                  {stat.value}
                </div>
                <div className="text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-[#5e5873]">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    <SchoolHighlightsSection />

    <PrincipalRemarksSection />

    <HomePurposeSection />

    {/* Gateway High Full-Width Campus Photo Carousel */}
    <PhotoCarouselSection />

    <SchoolStructureSection />

    <SchoolInformationPosters sections={["mission-vision"]} />

    <SchoolCommunitySection />

    <AdmissionsSection />

    <section className="bg-[#f3f1f5] py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#c51f67]">Able God College</p>
            <h2 className="mt-2 font-serif text-3xl font-black uppercase tracking-wide text-[#10264f]">Explore the Website</h2>
          </div>
          <Link to="/about" className="inline-flex items-center gap-2 font-semibold text-[#10264f] hover:text-[#c51f67]">
            About the school <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {quickLinks.map((item) => (
            <Link key={item.path} to={item.path} className="group rounded-xl border border-[#dedbe3] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#c51f67]/40 hover:shadow-lg flex flex-col justify-between">
              <div>
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#10264f] text-white transition group-hover:bg-[#c51f67]">
                  <item.icon className="h-5 w-5" />
                </span>
                <h3 className="text-lg font-bold text-[#10264f]">{item.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
              <div className="mt-4 pt-2 flex items-center gap-1 text-xs font-semibold text-[#c51f67] opacity-0 group-hover:opacity-100 transition-opacity">
                <span>View</span>
                <ArrowRight className="h-3 w-3" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  </Layout>
);

export default Index;
