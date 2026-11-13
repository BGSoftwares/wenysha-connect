import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  FlaskConical,
  Languages,
  Lightbulb,
  Calculator,
  BriefcaseBusiness,
  Sparkles,
  Quote,
  CheckCircle2,
  GraduationCap,
  Award,
  Layers,
  Search,
  Users,
  ScrollText,
  BadgeCheck,
  ChevronRight,
  ShieldCheck,
  Compass,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";

import heroImg from "@/assets/slides/slide-6260.jpeg";
import scienceImg from "@/assets/slides/slide-6254.jpeg";
import practicalsImg from "@/assets/students-computer.webp";
import mathsImg from "@/assets/slides/slide-6256.jpeg";
import englishImg from "@/assets/carousel-library.jpg";
import languagesImg from "@/assets/slides/slide-6262.jpeg";
import businessImg from "@/assets/slides/slide-6263.jpeg";

interface Department {
  id: string;
  name: string;
  shortName: string;
  subtitle: string;
  motto: string;
  head: string;
  headRole: string;
  image: string;
  accentColor: string;
  badgeStyle: string;
  subjects: string[];
  overview: string;
  vision: string;
  scripture: {
    verse: string;
    reference: string;
  };
  values: string[];
  icon: typeof FlaskConical;
}

const departments: Department[] = [
  {
    id: "science",
    name: "Science Department",
    shortName: "Sciences",
    subtitle: "Physics, Chemistry, Biology & Laboratory Research",
    motto: "Knowledgeable, principled scientists who glorify God.",
    head: "Mr. Mutingwende",
    headRole: "Head of Science Faculty",
    image: scienceImg,
    accentColor: "from-emerald-500/20 via-teal-900/30 to-[#10264f]",
    badgeStyle: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    subjects: ["Physics", "Chemistry", "Biology", "Integrated Science", "Environmental Science", "Laboratory Safety & Research"],
    overview:
      "The Science Department at Able God College provides practical laboratory-driven education across Physics, Chemistry, and Biology. Equipped with standard laboratory apparatus, the department emphasizes hands-on experimentation, scientific enquiry, and environmental stewardship.",
    vision:
      "As a Science Department we pray that our students will be knowledgeable and able to apply their knowledge with integrity. We also pray that they will glorify God in all their scientific pursuits, recognising that all creation points back to its Creator. We aim to raise students who are curious, ethical, and equipped to serve humanity through science.",
    scripture: {
      verse:
        "“It is my prayer that your love may abound more and more, with knowledge and discernment, so that you may approve what is excellent, and so be pure and blameless for the day of Christ, filled with the fruit of righteousness that comes through Jesus Christ, to the glory and praise of God.”",
      reference: "Philippians 1:9",
    },
    values: [
      "To have Godly character, be principled as well as informed on scientific matters, and to be good stewards.",
      "To recognise their moral duty as Christian scientists — to uphold life and to be honest and respectful of others.",
      "To recognise scientific applications to everyday life, to be inventive and curious in order to produce beneficial products.",
      "To be lifelong learners who make wise decisions regarding future vocations.",
      "To recognise that they are part of a developing scientific community in this technological age.",
    ],
    icon: FlaskConical,
  },
  {
    id: "practicals",
    name: "Practicals & Technical Department",
    shortName: "Practicals & ICT",
    subtitle: "Design, Agriculture, Technical Graphics & Applied Computing",
    motto: "Discovering God-given talents through design, art, technology and practical skills.",
    head: "Mr. Gurumani",
    headRole: "Head of Technical & Practical Studies",
    image: practicalsImg,
    accentColor: "from-amber-500/20 via-orange-900/30 to-[#10264f]",
    badgeStyle: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    subjects: ["Design & Technology", "Agriculture", "Technical Graphics", "Computer Science / ICT", "Applied Practical Arts", "Digital Literacy"],
    overview:
      "Practical subjects bridge classroom theory and practical vocational ability. Learners engage in hands-on design, agriculture, technical graphics, and modern ICT skills, learning to solve real-world community challenges through creative design and engineering.",
    vision:
      "Our vision as the Practical Subjects Department is to help students develop and explore their God-given talents through design work as they solve practical and technical problems in real life. Practical subjects are hands-on in nature and our vision is to impart various practical skills to pupils which they can use for life. We feel that it is our God-given responsibility and mandate to develop the whole child — spiritually, mentally and physically.",
    scripture: {
      verse:
        "“Teach them His decrees and instructions, and show them the way they are to live and how they are to behave.”",
      reference: "Exodus 18:20",
    },
    values: [
      "To encourage pupils to acknowledge how God's creation and sense of beauty fit in with design aspects in practical subjects.",
      "To develop in each pupil the ability to solve problems creatively.",
      "To equip pupils with relevant skills to model and make functional design products.",
      "To develop in pupils the ability to critically analyse situations and make sound judgements and wise choices.",
      "To foster a sense of responsibility and safety in each pupil through technical projects.",
      "To promote the use and development of ICT at Able God College.",
      "To ensure adequate information security and digital literacy for all stakeholders.",
    ],
    icon: Lightbulb,
  },
  {
    id: "mathematics",
    name: "Mathematics Department",
    shortName: "Mathematics",
    subtitle: "Pure Maths, Statistics, Mechanics & Academic Clinics",
    motto: "Developing mathematical potential and presenting Christ as the source of all we teach.",
    head: "Dr. T. Badza",
    headRole: "Head of Mathematics Faculty",
    image: mathsImg,
    accentColor: "from-blue-500/20 via-indigo-900/30 to-[#10264f]",
    badgeStyle: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    subjects: ["Pure Mathematics", "Statistics", "Mechanics", "Junior Secondary Math", "ZIMSEC O-Level & A-Level Math", "Afternoon Peer Clinics"],
    overview:
      "The Mathematics department offers a broad range of courses to the whole school from Form 1 through to A Level. Backed by a team of committed staff, the department focuses on helping students understand, enjoy, and apply Mathematics beyond their school years. Individual peer-tutoring is offered in the afternoons on Tuesdays and Wednesdays as a supportive service for those who need extra assistance.",
    vision:
      "We aspire to motivate our students to develop their mathematical potential to the full and to present Christ as the source of all that we teach.",
    scripture: {
      verse:
        "“For in Him all things were created: things in heaven and on earth, visible and invisible… all things have been created through Him and for Him. He is before all things, and in Him all things hold together.”",
      reference: "Colossians 1:16–17",
    },
    values: [
      "To promote Ephesians 2:10: “For we are God's workmanship, created in Christ Jesus to do good works.”",
      "To teach every student entrusted to us with care and love, acknowledging that all have been fearfully and wonderfully made.",
      "To have prayer as a central tool of all our departmental operations.",
      "To train and equip members of the department with current educational trends in order to be relevant at all times.",
    ],
    icon: Calculator,
  },
  {
    id: "english",
    name: "English & Literature Department",
    shortName: "English & Literature",
    subtitle: "Language Diligence, Literary Analysis & Oratory Mastery",
    motto: "Using the power of language to build foundations for life.",
    head: "Mrs. Mariga",
    headRole: "Head of English & Literature",
    image: englishImg,
    accentColor: "from-rose-500/20 via-pink-900/30 to-[#10264f]",
    badgeStyle: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    subjects: ["English Language", "Literature in English", "Debate & Public Speaking", "Critical Writing", "Essay Composition", "Oratory Presentation"],
    overview:
      "As an English department, our goal is to teach English Language and Literature with diligence, care, and responsible lesson execution. It is our purpose that this should be embedded within a context of genuine concern for the pupils, arising from our faith in Christ who gives purpose to all our endeavours.",
    vision:
      "English is a powerful medium for drawing attention to values, beliefs and attitudes that are either life-giving or false. Because we are aware of this, our vision is to use our lessons to build foundations that will give each pupil a sound basis for living. By the time a pupil completes school, they are empowered to think critically, communicate with grace, and engage the world from a grounded, ethical perspective.",
    scripture: {
      verse:
        "“Let your conversation always be full of grace, seasoned with salt, so that you may know how to answer everyone.”",
      reference: "Colossians 4:6",
    },
    values: [
      "To develop in each pupil the ability to think critically and write persuasively.",
      "To develop within each a desire to take responsibility for their own learning.",
      "To combat prejudice in thinking through balanced analysis of literature.",
      "To impart high standards of work and conduct through exemplary teacher role-modelling.",
      "To teach pupils to respect each other in debate and discourse.",
      "To demonstrate how disagreements can be resolved fruitfully without disrespect.",
    ],
    icon: BookOpen,
  },
  {
    id: "languages",
    name: "Languages & Humanities Department",
    shortName: "Languages & Heritage",
    subtitle: "Indigenous Languages, Shona, Culture & Heritage Studies",
    motto: "Sharing the Word of God through the gift of language and cultural understanding.",
    head: "Mrs. Gororo",
    headRole: "Head of Languages & Humanities",
    image: languagesImg,
    accentColor: "from-purple-500/20 via-violet-900/30 to-[#10264f]",
    badgeStyle: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    subjects: ["ChiShona (Indigenous Language)", "Heritage Studies", "Cultural History", "Linguistic Eloquence", "Community Ethics"],
    overview:
      "The Languages Department incorporates Indigenous Languages (Shona) and cultural heritage studies. Based on our educational philosophy, we seek to promote cultural appreciation, ethical thinking, and mutual respect across diverse communities while honoring Zimbabwean heritage.",
    vision:
      "To develop articulate, culturally grounded young Zimbabweans who honour their heritage while embracing national and global opportunities.",
    scripture: {
      verse:
        "“For by him all things were created, in heaven and on earth… visible and invisible… all things were created by him and for him.”",
      reference: "Colossians 1:16",
    },
    values: [
      "To help pupils read, write, and speak languages with eloquence and accuracy.",
      "To instil an attitude of appreciation for cultural diversity and historical heritage.",
      "To encourage positive attitudes towards speakers of other languages and empathy for other cultures.",
      "To form a sound base of language mastery required for progression towards higher education.",
    ],
    icon: Languages,
  },
  {
    id: "business",
    name: "Commercials & Business Department",
    shortName: "Commercials",
    subtitle: "Accounting, Economics, Business Studies & Enterprise",
    motto: "Godly business ethics for an ever-changing commercial world.",
    head: "Mr. Katesi",
    headRole: "Head of Commercial Studies",
    image: businessImg,
    accentColor: "from-cyan-500/20 via-sky-900/30 to-[#10264f]",
    badgeStyle: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    subjects: ["Principles of Accounting", "Business Studies", "Economics", "Commerce", "Financial Literacy", "Godly Entrepreneurship"],
    overview:
      "The Commercials Department teaches Accounting, Business Studies, Economics, and Commerce within the context of Biblical ethics. We equip students to become principled business leaders, accountants, and entrepreneurs who manage finances with integrity.",
    vision:
      "To inspire future economic and entrepreneurial champions whose commercial dealings are distinguished by fairness, diligence, and accountability.",
    scripture: {
      verse:
        "“The Lord abhors dishonest scales, but accurate weights find favor with Him.”",
      reference: "Proverbs 11:1",
    },
    values: [
      "To teach Accounting, Business Studies and Economics within an ethical value framework.",
      "To equip students with Godly business ethics applicable in local and global markets.",
      "To develop financial literacy and sound economic reasoning in every student.",
      "To prepare students thoroughly for ZIMSEC O-Level and A-Level commercial examinations.",
      "To cultivate business management and entrepreneurial skills grounded in integrity and community service.",
    ],
    icon: BriefcaseBusiness,
  },
];

const stats = [
  { label: "Academic Faculties", value: "6", detail: "Comprehensive Curriculum" },
  { label: "Faculty Leadership", value: "100%", detail: "Qualified Degreed Staff" },
  { label: "Examination Centre", value: "ZIMSEC", detail: "O-Level & A-Level Registered" },
  { label: "Termly Tuition", value: "US$ 200", detail: "All-Inclusive Quality Education" },
];

const Departments = () => {
  const [activeDept, setActiveDept] = useState<string>("science");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDepartments = useMemo(() => {
    if (!searchQuery.trim()) return departments;
    const q = searchQuery.toLowerCase();
    return departments.filter(
      (dept) =>
        dept.name.toLowerCase().includes(q) ||
        dept.head.toLowerCase().includes(q) ||
        dept.overview.toLowerCase().includes(q) ||
        dept.subjects.some((sub) => sub.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  const scrollToDepartment = (id: string) => {
    setActiveDept(id);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -130;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <Layout>
      {/* 1. Cinematic Collegiate Hero Section */}
      <section className="relative min-h-[520px] md:min-h-[580px] w-full flex items-center justify-center overflow-hidden bg-[#10264f]">
        {/* Background photo with deep navy vignette */}
        <div className="absolute inset-0">
          <img
            src={heroImg}
            alt="Able God College faculty and staff"
            className="w-full h-full object-cover object-center transform scale-105 animate-fade-in"
            style={{ objectPosition: "center 28%" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#10264f]/95 via-[#10264f]/85 to-[#10264f]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/20 via-transparent to-transparent opacity-60" />
        </div>

        <div className="container relative z-10 mx-auto px-4 py-20 text-center">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Pill Badge with Shimmer Effect */}
            <div className="inline-flex items-center gap-2.5 rounded-full bg-accent/90 px-5 py-2 text-xs sm:text-sm font-bold tracking-widest text-white uppercase shadow-xl shadow-accent/25 backdrop-blur-md border border-white/20">
              <Sparkles className="h-4 w-4 animate-pulse text-amber-200" />
              <span>Able God College • Academic Leadership</span>
            </div>

            {/* Headline */}
            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight drop-shadow-sm">
              Our Academic <span className="font-serif italic text-accent underline decoration-accent/40 underline-offset-8">Departments</span>
            </h1>

            {/* Decorative Divider */}
            <div className="flex items-center justify-center gap-3 pt-1">
              <div className="h-[2px] w-12 bg-gradient-to-r from-transparent to-accent" />
              <div className="h-2 w-2 rotate-45 bg-accent shadow-sm" />
              <div className="h-[2px] w-12 bg-gradient-to-l from-transparent to-accent" />
            </div>

            {/* Subheading */}
            <p className="text-white/90 text-base sm:text-lg md:text-xl font-light leading-relaxed max-w-2xl mx-auto drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              Meet our qualified department heads and experienced educators dedicated to cultivating intellectual rigor, Christian character, and academic distinction.
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Button
                asChild
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold px-8 h-13 shadow-xl shadow-accent/30 gap-2 rounded-xl transition-all hover:scale-105 active:scale-95"
              >
                <Link to="/admissions">
                  <GraduationCap className="h-5 w-5" />
                  <span>Enrol for Term 1 (US$ 200)</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 text-white bg-white/10 hover:bg-white hover:text-[#10264f] font-semibold px-7 h-13 backdrop-blur-md rounded-xl transition-all"
              >
                <Link to="/academics">
                  <BookOpen className="mr-2 h-4 w-4" />
                  View Academic Programs
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Floating Stats Strip */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#10264f] via-[#10264f]/90 to-transparent pt-6 pb-4">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-4 shadow-xl">
              {stats.map((s, idx) => (
                <div key={idx} className="text-center px-2 py-1 border-r border-white/10 last:border-0">
                  <p className="text-lg sm:text-2xl font-bold text-accent font-heading">{s.value}</p>
                  <p className="text-xs font-semibold text-white truncate">{s.label}</p>
                  <p className="text-[10px] text-white/70 hidden sm:block truncate">{s.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Sticky Navigation & Search Bar */}
      <nav
        aria-label="Department Directory"
        className="sticky top-16 md:top-20 z-30 border-b border-border bg-card/90 py-3.5 backdrop-blur-xl shadow-md transition-all"
      >
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Scrollable Department Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {departments.map((dept) => {
                const Icon = dept.icon;
                const isActive = activeDept === dept.id;
                return (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => scrollToDepartment(dept.id)}
                    className={`shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all duration-300 ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-105"
                        : "border border-border/80 text-foreground/80 hover:text-foreground hover:border-accent hover:bg-accent/5 bg-background/80"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? "text-accent" : "text-muted-foreground"}`} />
                    <span>{dept.shortName}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Keyword Search */}
            <div className="relative w-full md:w-56 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search subjects, faculty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-border bg-background/80 pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
              />
            </div>
          </div>
        </div>
      </nav>

      {/* 3. Main Department Content Cards */}
      <main className="bg-gradient-to-b from-muted/30 via-background to-muted/20 py-12 md:py-20">
        <div className="container mx-auto grid max-w-6xl gap-12 px-4">
          {filteredDepartments.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-12 text-center bg-card shadow-sm">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
              <h3 className="text-lg font-bold text-foreground">No matching departments found</h3>
              <p className="text-sm text-muted-foreground mt-1">Try clearing your search query to see all faculties.</p>
              <Button variant="outline" size="sm" onClick={() => setSearchQuery("")} className="mt-4">
                Clear Search
              </Button>
            </div>
          ) : (
            filteredDepartments.map((dept, index) => {
              const Icon = dept.icon;
              return (
                <article
                  key={dept.id}
                  id={dept.id}
                  className="group scroll-mt-36 overflow-hidden rounded-3xl border border-border/70 bg-card shadow-md transition-all duration-500 hover:shadow-2xl hover:border-accent/40"
                  aria-labelledby={`${dept.id}-heading`}
                >
                  {/* Top Department Hero Banner with Image & Scrim */}
                  <div className="relative h-64 sm:h-72 md:h-80 w-full overflow-hidden bg-slate-950">
                    <img
                      src={dept.image}
                      alt={`${dept.name} learning environment`}
                      className="h-full w-full object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-105"
                      loading={index === 0 ? "eager" : "lazy"}
                    />
                    {/* Multi-stage contrast gradient for crisp typography */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#10264f] via-[#10264f]/70 to-[#10264f]/30" />
                    <div className={`absolute inset-0 bg-gradient-to-r ${dept.accentColor} mix-blend-multiply opacity-60`} />

                    {/* Department Top Badges */}
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-md border ${dept.badgeStyle} shadow-lg`}>
                          <Icon className="h-3.5 w-3.5" />
                          <span>Faculty {index + 1} of {departments.length}</span>
                        </span>
                      </div>
                      <span className="rounded-full bg-black/60 px-3 py-1 text-[11px] font-semibold text-white/90 backdrop-blur-md border border-white/20 hidden sm:inline-block">
                        Masvingo Campus
                      </span>
                    </div>

                    {/* Bottom Header Content over Image */}
                    <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                      <div className="max-w-2xl text-left">
                        <span className="text-xs font-bold uppercase tracking-widest text-accent">Able God College Faculty</span>
                        <h2 id={`${dept.id}-heading`} className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight mt-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                          {dept.name}
                        </h2>
                        <p className="mt-1 text-sm sm:text-base text-white/90 italic font-serif leading-relaxed drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
                          &ldquo;{dept.motto}&rdquo;
                        </p>
                      </div>

                      {/* Head of Department Glassmorphic Badge */}
                      <div className="shrink-0 flex items-center gap-3.5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-3.5 sm:p-4 text-white shadow-xl hover:bg-white/15 transition-all">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-[#10264f] text-white shadow-md border border-white/20">
                          <BadgeCheck className="h-6 w-6 text-accent-foreground" />
                        </div>
                        <div className="text-left">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-pink-300">
                            {dept.headRole}
                          </p>
                          <p className="font-bold text-sm sm:text-base text-white leading-snug drop-shadow-sm">
                            {dept.head}
                          </p>
                          <span className="inline-block text-[10px] font-medium text-white/80 mt-0.5">
                            Able God College Masvingo
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Body Content Bento */}
                  <div className="p-6 sm:p-10 space-y-8 bg-card">
                    {/* 1. Subjects Covered Ribbon */}
                    <div className="rounded-2xl border border-border/80 bg-muted/40 p-5 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-accent" />
                          <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-foreground">
                            Subjects &amp; Learning Pathways
                          </h3>
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">Form 1 through Upper 6 (ZIMSEC)</span>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {dept.subjects.map((sub, sIdx) => (
                          <span
                            key={sIdx}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground/90 shadow-sm transition hover:border-accent hover:text-accent"
                          >
                            <CheckCircle2 className="h-3 w-3 text-accent" />
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* 2. Department Overview and Vision Grid */}
                    <div className="grid gap-6 md:grid-cols-2 items-start">
                      {/* Overview */}
                      <div className="rounded-2xl border border-border bg-background p-6 shadow-sm flex flex-col justify-between h-full">
                        <div>
                          <h3 className="font-heading text-base font-bold text-foreground mb-3 flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-accent" />
                            Department Overview
                          </h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {dept.overview}
                          </p>
                        </div>
                      </div>

                      {/* Vision */}
                      <div className="rounded-2xl border border-border bg-background p-6 shadow-sm flex flex-col justify-between h-full">
                        <div>
                          <h3 className="font-heading text-base font-bold text-foreground mb-3 flex items-center gap-2">
                            <Compass className="h-4 w-4 text-accent" />
                            Departmental Vision
                          </h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {dept.vision}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 3. Scripture Anchor Card */}
                    <blockquote className="relative overflow-hidden rounded-2xl border-l-4 border-accent bg-accent/5 p-6 font-serif shadow-sm">
                      <div className="absolute right-4 top-4 text-accent/10 pointer-events-none">
                        <Quote className="h-20 w-20" />
                      </div>
                      <div className="relative z-10 flex items-start gap-3.5">
                        <Quote className="h-6 w-6 text-accent shrink-0 mt-1" />
                        <div className="space-y-2">
                          <p className="text-sm sm:text-base text-foreground italic leading-relaxed">
                            {dept.scripture.verse}
                          </p>
                          <footer className="text-xs font-bold uppercase tracking-wider text-accent font-sans">
                            — {dept.scripture.reference}
                          </footer>
                        </div>
                      </div>
                    </blockquote>

                    {/* 4. Values and Objectives Grid */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <span className="text-xs font-bold uppercase tracking-widest text-accent">Educational Standards</span>
                          <h3 className="font-heading text-xl font-bold text-foreground">
                            Departmental Objectives &amp; Values
                          </h3>
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground hidden sm:block">
                          {dept.values.length} Core Standards
                        </span>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        {dept.values.map((val, valIdx) => (
                          <div
                            key={valIdx}
                            className="group/val flex items-start gap-3.5 rounded-2xl bg-background border border-border/80 p-4 shadow-sm transition hover:border-accent hover:shadow-md hover:bg-accent/[0.02]"
                          >
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent font-bold text-xs mt-0.5 group-hover/val:bg-accent group-hover/val:text-accent-foreground transition-colors">
                              {valIdx + 1}
                            </span>
                            <span className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-normal">
                              {val}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 5. Card Bottom Footer / Next Step */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        <span>Curriculum compliant with Ministry of Primary &amp; Secondary Education &amp; ZIMSEC standards.</span>
                      </div>
                      <Button asChild size="sm" variant="ghost" className="text-accent hover:text-accent hover:bg-accent/10 gap-1 font-bold text-xs">
                        <Link to="/admissions">
                          <span>Apply for {dept.name}</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </main>

      {/* 4. Collegiate Bottom CTA Banner */}
      <section className="relative overflow-hidden py-20 bg-[#10264f] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-accent/20 via-transparent to-transparent opacity-40 pointer-events-none" />
        <div className="container relative z-10 mx-auto px-4 text-center max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-accent border border-white/15 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" />
            Empowering Every Learner to Excel
          </div>

          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
            Give Your Child the Advantage of Qualified Faculty
          </h2>

          <p className="text-white/85 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            Enrolment is currently open across Form 1 to Form 4 and Advanced Level. Experience rigorous academics and Godly mentorship at our Masvingo campus for <span className="text-accent font-bold">US$ 200 per term</span>.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Button
              asChild
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold px-8 h-13 shadow-xl shadow-accent/25 rounded-xl gap-2 transition-transform hover:-translate-y-0.5"
            >
              <Link to="/admissions">
                <span>Start Admission Process</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 text-white bg-white/10 hover:bg-white hover:text-[#10264f] font-semibold px-8 h-13 backdrop-blur-sm rounded-xl transition-all"
            >
              <Link to="/contact">Speak With Academic Dean</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Departments;
