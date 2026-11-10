import { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/slides/slide-6252.jpeg";
import { zimsecPassRates, schoolRules } from "@/lib/schoolInformation";
import {
  GraduationCap,
  Award,
  BookOpen,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  TrendingUp,
  FileText,
  Compass,
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

const Academics = () => {
  const [activeLevelId, setActiveLevelId] = useState<string>("junior");
  const activeLevel = academicLevels.find((lvl) => lvl.id === activeLevelId) ?? academicLevels[0];

  const workRules = schoolRules.find((c) => c.title === "School Work")?.rules ?? [
    "Cover all books neatly",
    "Write and submit books in time",
    "Do your best in all subjects",
    "No cheating in examinations",
    "Care for books, desks and building",
  ];

  return (
    <Layout>
      {/* Collegiate Hero Banner */}
      <section className="relative min-h-[480px] w-full flex items-center justify-center overflow-hidden bg-[#10264f]">
        <div className="absolute inset-0">
          <img
            src={heroImg}
            alt="Able God College academic learners"
            className="w-full h-full object-cover object-center"
            style={{ objectPosition: "center 30%" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#10264f]/92 via-[#10264f]/85 to-[#0b1c3b]/95" />
        </div>

        <div className="container relative z-10 mx-auto px-4 py-20 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <span className="inline-flex items-center gap-2 bg-accent/90 text-accent-foreground text-xs font-bold tracking-widest uppercase px-5 py-2 rounded-full shadow-lg">
              <Sparkles className="h-3.5 w-3.5" />
              Academic Excellence
            </span>

            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight tracking-tight">
              Academic <span className="italic font-serif text-accent">Programs</span>
            </h1>

            <div className="w-16 h-1 bg-accent mx-auto rounded-full" />

            <p className="text-white/85 text-lg md:text-xl font-light leading-relaxed max-w-2xl mx-auto">
              ZIMSEC examination curricula from Form 1 through A-Level, characterized by focused instruction,
              high pass rates, and supportive teacher mentorship.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Button
                asChild
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold px-8 h-12 shadow-xl shadow-accent/20 gap-2"
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
                className="border-white/30 text-white bg-white/10 hover:bg-white hover:text-[#10264f] font-semibold px-7 h-12 backdrop-blur-sm"
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
            <p className="text-accent font-bold uppercase tracking-widest text-xs mb-2">Proven Track Record</p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground">
              ZIMSEC Examination Results
            </h2>
            <div className="w-16 h-1 bg-accent mx-auto mt-3 rounded-full" />
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

                  <p className="font-heading text-4xl font-bold text-primary mb-1">{stat.rate2025}%</p>
                  <p className="text-xs text-accent font-semibold uppercase tracking-wider">2025 Pass Rate</p>

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
            <p className="text-accent font-bold uppercase tracking-widest text-xs mb-2">Curriculum Pathways</p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground">
              Structured Secondary Programs
            </h2>
            <div className="w-16 h-1 bg-accent mx-auto mt-3 rounded-full mb-8" />

            {/* Level Selector Pills */}
            <div className="inline-flex rounded-xl bg-card p-1.5 gap-1.5 shadow-sm border border-border">
              {academicLevels.map((lvl) => (
                <button
                  key={lvl.id}
                  onClick={() => setActiveLevelId(lvl.id)}
                  className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    activeLevelId === lvl.id
                      ? "bg-primary text-primary-foreground shadow"
                      : "text-muted-foreground hover:text-foreground"
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
              <span className="text-xs font-bold uppercase tracking-wider text-accent">{activeLevel.level}</span>
              <h3 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mt-1 mb-3">
                {activeLevel.title}
              </h3>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-3xl">
                {activeLevel.description}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-start pt-4 border-t border-border">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="h-5 w-5 text-accent" />
                  <h4 className="font-heading text-lg font-bold text-foreground">Core Subjects &amp; Tracks</h4>
                </div>
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {activeLevel.subjects.map((sub, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-lg bg-secondary/60 border border-border px-3.5 py-2.5 text-xs font-medium text-foreground"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-accent shrink-0" />
                      <span>{sub}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-background p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Compass className="h-5 w-5 text-primary" />
                  <h4 className="font-heading text-lg font-bold text-foreground">Target Outcomes</h4>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{activeLevel.outcomes}</p>

                <div className="pt-4 border-t border-border">
                  <p className="text-xs font-bold uppercase tracking-wide text-foreground mb-1">Standard Tuition</p>
                  <p className="font-heading text-2xl font-bold text-primary">US$ 200 <span className="text-sm font-normal text-muted-foreground">/ term</span></p>
                  <p className="text-xs text-muted-foreground mt-1">Covers all subject instruction and laboratory sessions.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* School Work Rules & Discipline Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-accent font-bold uppercase tracking-widest text-xs mb-2">Academic Standards</p>
              <h2 className="font-heading text-3xl font-bold text-foreground mb-4">School Work Expectations</h2>
              <div className="w-14 h-1 bg-accent mb-6 rounded-full" />
              <p className="text-muted-foreground leading-relaxed text-sm sm:text-base mb-6">
                Academic success requires discipline and good habits. Every learner at Able God College adheres to
                structured classroom standards designed to instill diligence, honesty, and care.
              </p>

              <div className="space-y-3">
                {workRules.map((rule, idx) => (
                  <div key={idx} className="flex items-start gap-3 rounded-xl bg-card border border-border p-3.5 shadow-sm">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent font-bold text-xs mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-medium text-foreground">{rule}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Punctuality and Study Card */}
            <div className="rounded-3xl border-2 border-primary/20 bg-gradient-to-br from-[#10264f] to-[#1a3a75] p-8 text-white shadow-xl space-y-6">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-accent">
                  <Clock className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="font-heading text-xl font-bold">Punctual Arrival</h3>
                  <p className="text-xs text-accent font-semibold uppercase tracking-wider">Discipline in Class</p>
                </div>
              </div>

              <p className="text-sm text-white/85 leading-relaxed">
                Learners must arrive by <span className="font-bold text-accent">6:55 AM</span> every morning for registration,
                devotion, and prompt start of lessons. Regular attendance is strictly monitored to ensure maximum instructional hours.
              </p>

              <div className="rounded-xl bg-white/10 p-4 border border-white/10 text-xs space-y-1">
                <p className="font-bold text-accent">Language Standard:</p>
                <p className="text-white/80">Always speak English on campus to build fluency, confidence, and international academic readiness.</p>
              </div>

              <Button
                asChild
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold h-11"
              >
                <Link to="/portal">Access Student Portal</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-20 bg-[#10264f] text-white">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
            Join Our Academic Community
          </h2>
          <p className="text-white/80 text-base sm:text-lg leading-relaxed mb-8">
            Admissions are open for Form 1 through A-Level. Transparent fees of <span className="text-accent font-bold">US$ 200 per term</span>.
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
              <Link to="/departments">Explore Departments</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Academics;
