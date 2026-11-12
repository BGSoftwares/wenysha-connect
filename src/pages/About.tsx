import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import logo from "/able-god-college-logo.png";
import heroImg from "@/assets/new-school-media/school-community-gathering.jpeg";
import communityImg from "@/assets/slides/slide-6256.jpeg";
import {
  schoolIdentity,
  schoolMission,
  schoolVision,
  complaintsCommittee,
} from "@/lib/schoolInformation";
import { schoolContact } from "@/lib/schoolContact";
import {
  ShieldCheck,
  Award,
  Heart,
  Users,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  MapPin,
  GraduationCap,
} from "lucide-react";

const valuesDetails = [
  {
    num: "1",
    title: "Honour God",
    subtitle: "Spiritual Foundation",
    description:
      "We put God first in all our academic and community endeavours. Through daily assemblies, devotion, and moral instruction, learners recognize their Creator and cultivate lifelong Christian integrity.",
    color: "from-amber-500/20 to-amber-500/5",
    border: "border-amber-500/30",
    badge: "bg-accent text-accent-foreground",
  },
  {
    num: "2",
    title: "Respect Others",
    subtitle: "Character & Discipline",
    description:
      "A culture of mutual honour, courtesy, and empathy. We uphold strict anti-bullying policies, respectful engagement with educators, prefects, and peers, and walking in unity as one family.",
    color: "from-[#c51f67]/20 to-[#c51f67]/5",
    border: "border-[#c51f67]/30",
    badge: "bg-[#c51f67] text-white",
  },
  {
    num: "3",
    title: "Excel in All You Do",
    subtitle: "Pursuit of Distinction",
    description:
      "Excellence is not an act, but a disciplined daily habit. We inspire every student to give their best in ZIMSEC examinations, sports, arts, and personal leadership.",
    color: "from-blue-600/20 to-blue-600/5",
    border: "border-blue-600/30",
    badge: "bg-primary text-white",
  },
];

const About = () => (
  <Layout>
    {/* Collegiate Hero Banner */}
    <section className="relative min-h-[480px] w-full flex items-center justify-center overflow-hidden bg-[#10264f]">
      <div className="absolute inset-0">
        <img
          src={heroImg}
          alt="Able God College community gathering"
          className="w-full h-full object-cover object-center"
          style={{ objectPosition: "center 35%" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#10264f]/92 via-[#10264f]/85 to-[#10264f]/95" />
      </div>

      <div className="container relative z-10 mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <span className="inline-flex items-center gap-2 bg-accent/90 text-accent-foreground text-xs font-bold tracking-widest uppercase px-5 py-2 rounded-full shadow-lg">
            <Sparkles className="h-3.5 w-3.5" />
            Our Heritage &amp; Purpose
          </span>

          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight tracking-tight">
            About Able God <span className="italic font-serif text-accent">College</span>
          </h1>

          <div className="w-16 h-1 bg-accent mx-auto rounded-full" />

          <p className="text-white/85 text-lg md:text-xl font-light leading-relaxed max-w-2xl mx-auto">
            {schoolIdentity.motto} — Dedicated to providing a disciplined, faith-grounded, and academically rigorous
            environment where every student develops into a competitive, self-reliant leader.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Button
              asChild
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold px-8 h-12 text-base shadow-xl shadow-accent/20 gap-2"
            >
              <Link to="/admissions">
                Admissions &amp; Fees
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 text-white bg-white/10 hover:bg-white hover:text-[#10264f] font-semibold px-7 h-12 text-base backdrop-blur-sm gap-2"
            >
              <Link to="/contact">Book Campus Visit</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>

    {/* Our Story Section */}
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Narrative */}
          <div className="space-y-6">
            <div>
              <p className="text-accent font-bold uppercase tracking-widest text-xs mb-2">Our Story</p>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground leading-snug">
                Nurturing Tomorrow's Leaders in Faith &amp; Knowledge
              </h2>
              <div className="w-14 h-1 bg-accent mt-3 rounded-full" />
            </div>

            <p className="text-muted-foreground leading-relaxed text-base">
              Able God College was established with a singular, resolute conviction: that genuine education must nurture
              the whole person — mind, character, and soul. Situated in Masvingo, Zimbabwe, we provide high-calibre
              secondary education designed to produce graduates who are academically competent, morally upright, and
              deeply patriotic.
            </p>

            <p className="text-muted-foreground leading-relaxed text-base">
              Our learners wear the <span className="font-semibold text-primary">navy and pink uniform</span> with immense
              pride. Guided by our motto <span className="font-serif italic font-semibold text-[#c51f67]">B'EZRAT HESHAM</span>,
              we instill a sense of divine stewardship and personal accountability that prepares students to excel in
              ZIMSEC national examinations and university pathways worldwide.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <GraduationCap className="h-5 w-5" />
                  </span>
                  <h3 className="font-heading text-base font-bold text-foreground">Academic Focus</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Rigorous ZIMSEC curriculum across Sciences, Commercials, and Arts with 74.5% overall pass rate.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#c51f67]/10 text-[#c51f67]">
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                  <h3 className="font-heading text-base font-bold text-foreground">Safe &amp; Disciplined</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Strict anti-bullying, punctual 06:55 AM start, and supportive pastoral mentorship for all learners.
                </p>
              </div>
            </div>
          </div>

          {/* Right Image Showcase */}
          <div className="relative">
            <div className="relative mx-auto max-w-lg overflow-hidden rounded-3xl border-4 border-white shadow-2xl bg-[#10264f]">
              <img
                src={communityImg}
                alt="Able God College learners in pink and navy uniform"
                className="w-full h-[440px] object-cover object-center transition-transform duration-500 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
              
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-white/95 rounded-full px-3 py-1 shadow">
                <img src={logo} alt="Crest" className="h-5 w-5 object-contain" />
                <span className="text-xs font-bold text-primary">{schoolIdentity.name}</span>
              </div>

              <div className="absolute bottom-6 left-6 right-6 text-white">
                <p className="text-xs font-bold uppercase tracking-wider text-accent mb-1">Proud in Pink &amp; Navy</p>
                <p className="font-heading text-xl font-bold">{schoolIdentity.motto}</p>
                <p className="text-xs text-white/80 mt-1">{schoolContact.address}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Core Values Section */}
    <section className="py-20 bg-muted/60">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <p className="text-accent font-bold uppercase tracking-widest text-xs mb-2">The Pillars of Our School</p>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground">Our Core Values</h2>
          <div className="w-16 h-1 bg-accent mx-auto mt-3 rounded-full" />
          <p className="text-muted-foreground max-w-xl mx-auto text-sm mt-3">
            These three timeless principles guide every lesson, interaction, and standard of behaviour at Able God College.
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          {valuesDetails.map((v) => (
            <div
              key={v.num}
              className={`rounded-2xl border ${v.border} bg-card p-8 shadow-sm flex flex-col justify-between transition-all hover:shadow-md hover:-translate-y-1 relative overflow-hidden`}
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${v.badge} font-black text-lg shadow-sm`}>
                    {v.num}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Core Value</span>
                </div>

                <h3 className="font-heading text-2xl font-bold text-foreground mb-1">{v.title}</h3>
                <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-4">{v.subtitle}</p>

                <p className="text-sm text-muted-foreground leading-relaxed">{v.description}</p>
              </div>

              <div className="mt-8 pt-4 border-t border-border flex items-center gap-2 text-xs font-medium text-foreground/80">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Active standard across all grades</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Mission & Vision Banners */}
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Mission */}
          <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-card to-background p-8 sm:p-10 shadow-sm relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
              <Award className="w-6 h-6 text-primary" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Our Mission</p>
            <h3 className="font-heading text-2xl font-bold text-foreground mb-4">Empowering Every Student</h3>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{schoolMission}</p>
          </div>

          {/* Vision */}
          <div className="rounded-2xl border-2 border-accent/30 bg-gradient-to-br from-accent/10 via-card to-background p-8 sm:p-10 shadow-sm relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-6">
              <Sparkles className="w-6 h-6 text-accent" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-accent mb-2">Vision 2030</p>
            <h3 className="font-heading text-2xl font-bold text-foreground mb-4">Quality, Loved &amp; Efficient</h3>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{schoolVision}</p>
          </div>
        </div>
      </div>
    </section>

    {/* Complaints & Welfare Oversight Committee */}
    <section className="py-20 bg-muted/40 border-t border-border">
      <div className="container mx-auto px-4 max-w-4xl text-center">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Users className="w-6 h-6 text-primary" />
        </div>
        <p className="text-accent font-bold uppercase tracking-widest text-xs mb-2">Accountability &amp; Welfare</p>
        <h2 className="font-heading text-3xl font-bold text-foreground mb-3">Complaints &amp; Ethics Committee</h2>
        <div className="w-16 h-1 bg-accent mx-auto mb-6 rounded-full" />
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
          To ensure parents, students, and staff have a trusted, transparent, and fair channel for addressing concerns,
          the school maintains an independent welfare and complaints resolution committee.
        </p>

        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm text-left">
          <div className="grid sm:grid-cols-3 gap-6 pb-6 border-b border-border">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Chairperson</p>
              <p className="font-heading text-lg font-bold text-primary mt-1">{complaintsCommittee.chairperson}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Vice-Chairperson</p>
              <p className="font-heading text-lg font-bold text-foreground mt-1">{complaintsCommittee.viceChair}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Secretary</p>
              <p className="font-heading text-lg font-bold text-foreground mt-1">{complaintsCommittee.secretary}</p>
            </div>
          </div>

          <div className="pt-6">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Committee Members</p>
            <div className="flex flex-wrap gap-2">
              {complaintsCommittee.members.map((member) => (
                <span
                  key={member}
                  className="rounded-lg bg-secondary/80 border border-border px-3.5 py-1.5 text-xs font-semibold text-foreground"
                >
                  {member}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Experience Able God College CTA */}
    <section className="py-20 bg-[#10264f] text-white">
      <div className="container mx-auto px-4 text-center max-w-3xl">
        <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
          Experience Able God College in Person
        </h2>
        <p className="text-white/80 text-base sm:text-lg leading-relaxed mb-8">
          We welcome prospective parents and learners to tour our campus, meet our educators, and explore our learning
          community. Tuition is <span className="text-accent font-bold">US$ 200 per term</span>.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button
            asChild
            size="lg"
            className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold px-8 h-12 shadow-xl shadow-accent/20"
          >
            <Link to="/admissions">Admissions &amp; Enrolment</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white/30 text-white bg-white/10 hover:bg-white hover:text-[#10264f] font-semibold px-7 h-12 backdrop-blur-sm"
          >
            <Link to="/contact">Contact Campus Office</Link>
          </Button>
        </div>
      </div>
    </section>
  </Layout>
);

export default About;
