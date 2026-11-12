import { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/slides/slide-6252.jpeg";
import { zimsecPassRates, schoolRules, complaintsCommittee } from "@/lib/schoolInformation";
import {
  GraduationCap,
  Award,
  BookOpen,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Clock3,
  TrendingUp,
  FileText,
  Compass,
  Heart,
  Shirt,
  ShieldCheck,
  Scale,
  Users,
} from "lucide-react";

const academicLevels = [
  {
    id: "junior",
    level: "Form 1 & 2",
    title: "Junior Secondary Foundation",
    description:
      "A broad, balanced curriculum that equips learners with solid fundamentals across mathematics, languages, integrated sciences, and technical subjects.",
    subjects: [
      "Mathematics",
      "English Language & Literature",
      "General Science",
      "Shona Language & Culture",
      "Heritage Studies",
      "Computer Science / ICT",
      "Agriculture",
      "Commerce / Practical Skills",
    ],
    outcomes: "Transition smoothly from Grade 7 into rigorous secondary thinking and discipline.",
  },
  {
    id: "middle",
    level: "Form 3 & 4",
    title: "ZIMSEC O-Level Examination Stage",
    description:
      "Targeted academic streaming into Sciences, Commercials, and Arts. Comprehensive syllabus coverage with mock exams and supervised afternoon tutorials.",
    subjects: [
      "Pure Mathematics & Statistics",
      "English Language & English Literature",
      "Physical Sciences (Physics & Chemistry)",
      "Biology",
      "Accounting & Business Studies",
      "Economics & Commerce",
      "Geography & History",
      "Computer Studies",
    ],
    outcomes: "Achieve top-tier ZIMSEC Ordinary Level passes for A-Level and professional careers.",
  },
  {
    id: "advanced",
    level: "Lower & Upper 6",
    title: "Advanced Level (A-Level) Specialisation",
    description:
      "Pre-university mastery with dedicated seminar-style instruction, laboratory research, and university application mentorship across regional and international universities.",
    subjects: [
      "Sciences: Mathematics, Physics, Chemistry, Biology",
      "Commercials: Accounting, Economics, Business Studies",
      "Arts & Humanities: Literature in English, History, Geography, Divinity",
    ],
    outcomes: "Qualify for competitive university degree programs in Zimbabwe, South Africa, and worldwide.",
  },
];

const ruleIcons: Record<string, typeof Heart> = {
  Attitude: Heart,
  "Discipline in Class": Clock3,
  Uniform: Shirt,
  "School Work": BookOpen,
  Safety: ShieldCheck,
};

const Academics = () => {
  const [activeLevelId, setActiveLevelId] = useState<string>("junior");
  const activeLevel = academicLevels.find((lvl) => lvl.id === activeLevelId) ?? academicLevels[0];

  return (
    <Layout>
      {/* Collegiate Hero Banner - Unified Navy Blue #10264f */}
      <section className="relative min-h-[480px] w-full flex items-center justify-center overflow-hidden bg-[#10264f]">
        <div className="absolute inset-0">
          <img
            src={heroImg}
            alt="Able God College academic learners"
            className="w-full h-full object-cover object-center"
            style={{ objectPosition: "center 30%" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#10264f]/95 via-[#10264f]/85 to-[#10264f]" />
        </div>

        <div className="container relative z-10 mx-auto px-4 py-20 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <span className="inline-flex items-center gap-2 bg-[#c51f67] text-white text-xs font-bold tracking-widest uppercase px-5 py-2 rounded-full shadow-lg">
              <Sparkles className="h-3.5 w-3.5" />
              Academic Excellence
            </span>

            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight tracking-tight">
              Academic <span className="italic font-serif text-[#d4a017]">Programs</span>
            </h1>

            <div className="w-16 h-1 bg-[#d4a017] mx-auto rounded-full" />

            <p className="text-white/90 text-lg md:text-xl font-light leading-relaxed max-w-2xl mx-auto">
              ZIMSEC examination curricula from Form 1 through A-Level, characterized by focused instruction,
              high pass rates, and supportive teacher mentorship in Masvingo.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Button
                asChild
                size="lg"
                className="bg-[#c51f67] text-white hover:bg-[#a61755] font-bold px-8 h-12 shadow-xl shadow-[#c51f67]/20 gap-2"
              >
                <Link to="/admissions">
                  Enrolment &amp; Fees ($200/term)
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/40 text-white bg-white/10 hover:bg-white hover:text-[#10264f] font-semibold px-7 h-12 backdrop-blur-sm"
              >
                <Link to="/departments">Meet Our Departments</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ZIMSEC Examination Results Performance Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <p className="text-[#c51f67] font-bold uppercase tracking-widest text-xs mb-2">Proven Track Record</p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#10264f]">
              ZIMSEC Examination Results
            </h2>
            <div className="w-16 h-1 bg-[#d4a017] mx-auto mt-3 rounded-full" />
            <p className="text-muted-foreground max-w-xl mx-auto text-sm mt-3">
              Consistent academic improvement reflecting the dedication of our educators and disciplined learners.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {zimsecPassRates.map((stat) => (
              <div
                key={stat.group}
                className="rounded-2xl border border-border bg-card p-7 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {stat.group} Performance
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                      <TrendingUp className="h-3 w-3" />
                      +{stat.improvement}%
                    </span>
                  </div>

                  <p className="font-heading text-4xl font-bold text-[#10264f] mb-1">{stat.rate2025}%</p>
                  <p className="text-xs text-[#c51f67] font-semibold uppercase tracking-wider">2025 Pass Rate</p>

                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                    <span>2024 Benchmark:</span>
                    <span className="font-semibold text-foreground">{stat.rate2024}%</span>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-border text-[11px] text-muted-foreground">
                  ZIMSEC verified academic records
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Academic Curriculum Pathways Section */}
      <section className="py-20 bg-muted/60" id="pathways">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <p className="text-[#c51f67] font-bold uppercase tracking-widest text-xs mb-2">Curriculum Pathways</p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#10264f]">
              Structured Secondary Programs
            </h2>
            <div className="w-16 h-1 bg-[#d4a017] mx-auto mt-3 rounded-full mb-8" />

            {/* Level Selector Pills */}
            <div className="inline-flex rounded-xl bg-card p-1.5 gap-1.5 shadow-sm border border-border">
              {academicLevels.map((lvl) => (
                <button
                  key={lvl.id}
                  onClick={() => setActiveLevelId(lvl.id)}
                  className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    activeLevelId === lvl.id
                      ? "bg-[#10264f] text-white shadow"
                      : "text-muted-foreground hover:text-[#10264f]"
                  }`}
                >
                  {lvl.level}
                </button>
              ))}
            </div>
          </div>

          {/* Active Level Detail Box */}
          <div className="rounded-3xl border border-border bg-card p-8 sm:p-10 shadow-lg">
            <div className="mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-[#c51f67]">{activeLevel.level}</span>
              <h3 className="font-heading text-2xl sm:text-3xl font-bold text-[#10264f] mt-1 mb-3">
                {activeLevel.title}
              </h3>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-3xl">
                {activeLevel.description}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-start pt-4 border-t border-border">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="h-5 w-5 text-[#c51f67]" />
                  <h4 className="font-heading text-lg font-bold text-[#10264f]">Core Subjects &amp; Tracks</h4>
                </div>
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {activeLevel.subjects.map((sub, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-lg bg-white border border-border px-3.5 py-2.5 text-xs font-medium text-[#10264f]"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#c51f67] shrink-0" />
                      <span>{sub}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-background p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Compass className="h-5 w-5 text-[#10264f]" />
                  <h4 className="font-heading text-lg font-bold text-[#10264f]">Target Outcomes</h4>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{activeLevel.outcomes}</p>

                <div className="pt-4 border-t border-border">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#10264f] mb-1">Standard Tuition</p>
                  <p className="font-heading text-2xl font-bold text-[#10264f]">US$ 200 <span className="text-sm font-normal text-muted-foreground">/ term</span></p>
                  <p className="text-xs text-muted-foreground mt-1">Covers all subject instruction and laboratory sessions.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RESTORED: Comprehensive School Rules & Regulations Section */}
      <section className="py-20 bg-background" id="school-rules">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-14">
            <span className="inline-block bg-[#c51f67] text-white text-[11px] font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-sm mb-3">
              Code of Conduct &amp; Discipline
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#10264f]">
              School Rules &amp; Regulations
            </h2>
            <div className="w-20 h-1 bg-[#d4a017] mx-auto mt-4 rounded-full" />
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base mt-4 leading-relaxed">
              At Able God College, academic excellence flourishes alongside disciplined character and Christian integrity.
              All learners are guided by our 5 core pillars of conduct.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#10264f] bg-[#10264f]/5 px-4 py-2 rounded-full border border-[#10264f]/15">
              <span>Honour God</span>
              <span className="text-[#c51f67]">•</span>
              <span>Respect Others</span>
              <span className="text-[#c51f67]">•</span>
              <span>Excel in All You Do</span>
            </div>
          </div>

          {/* 5 Rules Categories in Unified Navy Blue Cards */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {schoolRules.map((category) => {
              const Icon = ruleIcons[category.title] ?? ShieldCheck;
              return (
                <div
                  key={category.title}
                  className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
                >
                  {/* Category Header with Unified Navy Blue #10264f */}
                  <div className="bg-[#10264f] px-5 py-4 text-white flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#c51f67] text-white shadow-sm">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#d4a017]">Category</span>
                      <h3 className="font-heading text-lg font-bold text-white leading-tight">{category.title}</h3>
                    </div>
                  </div>

                  {/* Rules list */}
                  <ul className="p-5 space-y-3 flex-1 bg-white">
                    {category.rules.map((rule, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm font-medium text-[#10264f] leading-snug">
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#c51f67]" aria-hidden="true" />
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}

            {/* Complaints Handling Committee Card */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col sm:col-span-2 lg:col-span-1">
              <div className="bg-[#10264f] px-5 py-4 text-white flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#d4a017] text-[#10264f] shadow-sm">
                  <Scale className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-pink-300">Accountability</span>
                  <h3 className="font-heading text-lg font-bold text-white leading-tight">Complaints Committee</h3>
                </div>
              </div>

              <div className="p-5 space-y-3 bg-white flex-1 text-xs sm:text-sm">
                <div className="space-y-1.5 pb-3 border-b border-border">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Leadership</p>
                  <p className="text-foreground"><strong className="text-[#10264f]">Chairperson:</strong> {complaintsCommittee.chairperson}</p>
                  <p className="text-foreground"><strong className="text-[#10264f]">Vice Chair:</strong> {complaintsCommittee.viceChair}</p>
                  <p className="text-foreground"><strong className="text-[#10264f]">Secretary:</strong> {complaintsCommittee.secretary}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Committee Members</p>
                  <div className="flex flex-wrap gap-1.5">
                    {complaintsCommittee.members.map((member) => (
                      <span key={member} className="px-2.5 py-1 rounded-md bg-[#10264f]/5 text-[#10264f] font-semibold text-xs border border-[#10264f]/10">
                        {member}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Punctuality and English Language Standard Banner */}
      <section className="py-12 bg-muted/40">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="rounded-3xl bg-[#10264f] p-8 sm:p-10 text-white shadow-xl border border-white/10 grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#d4a017]">
                  <Clock className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="font-heading text-xl sm:text-2xl font-bold">Punctual Arrival: 6:55 AM</h3>
                  <p className="text-xs text-[#d4a017] font-semibold uppercase tracking-wider">Morning Devotion &amp; Assembly</p>
                </div>
              </div>
              <p className="text-sm text-white/85 leading-relaxed">
                Promptness is a foundational Christian virtue. Learners must arrive by <span className="font-bold text-[#d4a017]">6:55 AM</span> daily for registration, morning prayer, and continuous instructional time.
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-6 border border-white/10 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-pink-300">English Language Policy</p>
              <p className="text-sm text-white/90 leading-relaxed">
                English is strictly spoken across the Able God College campus at all times to foster intellectual confidence, international academic readiness, and clear communication.
              </p>
              <div className="pt-2">
                <Button
                  asChild
                  className="bg-[#c51f67] text-white hover:bg-[#a61755] font-bold h-10 text-xs w-full"
                >
                  <Link to="/portal">Access Student Portal</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner - Unified Navy Blue #10264f */}
      <section className="py-20 bg-[#10264f] text-white">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
            Join Our Academic Community
          </h2>
          <p className="text-white/85 text-base sm:text-lg leading-relaxed mb-8">
            Admissions are open for Form 1 through A-Level. Transparent fees of <span className="text-[#d4a017] font-bold">US$ 200 per term</span>.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-[#c51f67] text-white hover:bg-[#a61755] font-bold px-8 h-12 shadow-xl shadow-[#c51f67]/20"
            >
              <Link to="/admissions">Admissions &amp; Enrolment</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 text-white bg-white/10 hover:bg-white hover:text-[#10264f] font-semibold px-7 h-12 backdrop-blur-sm"
            >
              <Link to="/departments">Explore Departments</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Academics;
