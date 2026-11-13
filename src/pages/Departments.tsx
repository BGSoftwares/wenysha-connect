import { useState } from "react";
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
  UserCheck,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/slides/slide-6260.jpeg";

const departments = [
  {
    id: "science",
    name: "Science Department",
    motto: "Knowledgeable, principled scientists who glorify God.",
    head: "Mr. Mutingwende",
    overview:
      "The Science Department at Able God College provides practical laboratory-driven education across Physics, Chemistry, and Biology. Equipped with standard laboratory apparatus, the department emphasizes hands-on experimentation, scientific enquiry, and environmental stewardship.",
    vision:
      "As a Science Department we pray that our students will be knowledgeable and able to apply their knowledge with integrity. We also pray that they will glorify God in all their scientific pursuits, recognising that all creation points back to its Creator. We aim to raise students who are curious, ethical, and equipped to serve humanity through science.",
    scripture:
      "“It is my prayer that your love may abound more and more, with knowledge and discernment, so that you may approve what is excellent, and so be pure and blameless for the day of Christ, filled with the fruit of righteousness that comes through Jesus Christ, to the glory and praise of God.” — Philippians 1:9",
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
    motto: "Discovering God-given talents through design, art, technology and practical skills.",
    head: "Mr. Gurumani",
    overview:
      "Practical subjects bridge classroom theory and practical vocational ability. Learners engage in hands-on design, agriculture, technical graphics, and modern ICT skills, learning to solve real-world community challenges.",
    vision:
      "Our vision as the Practical Subjects Department is to help students develop and explore their God-given talents through design work as they solve practical and technical problems in real life. Practical subjects are hands-on in nature and our vision is to impart various practical skills to pupils which they can use for life. We feel that it is our God-given responsibility and mandate to develop the whole child — spiritually, mentally and physically.",
    scripture:
      "“Teach them His decrees and instructions, and show them the way they are to live and how they are to behave.” — Exodus 18:20",
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
    motto: "Developing mathematical potential and presenting Christ as the source of all we teach.",
    head: "Dr. T. Badza",
    overview:
      "The Mathematics department offers a broad range of courses to the whole school from Form 1 through to A Level. Backed by a team of committed staff, the department focuses on helping students understand, enjoy, and apply Mathematics beyond their school years. Individual peer-tutoring is offered in the afternoons on Tuesdays and Wednesdays as a supportive service for those who need extra assistance.",
    vision:
      "We aspire to motivate our students to develop their mathematical potential to the full and to present Christ as the source of all that we teach.",
    scripture:
      "“For in Him all things were created: things in heaven and on earth, visible and invisible… all things have been created through Him and for Him. He is before all things, and in Him all things hold together.” — Colossians 1:16–17",
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
    motto: "Using the power of language to build foundations for life.",
    head: "Mrs. Mariga",
    overview:
      "As an English department, our goal is to teach English Language and Literature with diligence, care, and responsible lesson execution. It is our purpose that this should be embedded within a context of genuine concern for the pupils, arising from our faith in Christ who gives purpose to all our endeavours.",
    vision:
      "English is a powerful medium for drawing attention to values, beliefs and attitudes that are either life-giving or false. Because we are aware of this, our vision is to use our lessons to build foundations that will give each pupil a sound basis for living. By the time a pupil completes school, they are empowered to think critically, communicate with grace, and engage the world from a grounded, ethical perspective.",
    scripture:
      "“Let your conversation always be full of grace, seasoned with salt, so that you may know how to answer everyone.” — Colossians 4:6",
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
    motto: "Sharing the Word of God through the gift of language and cultural understanding.",
    head: "Mrs. Gororo",
    overview:
      "The Languages Department incorporates Indigenous Languages (Shona) and cultural heritage studies. Based on our educational philosophy, we seek to promote cultural appreciation, ethical thinking, and mutual respect across diverse communities.",
    vision:
      "To develop articulate, culturally grounded young Zimbabweans who honour their heritage while embracing national and global opportunities.",
    scripture:
      "“For by him all things were created, in heaven and on earth… visible and invisible… all things were created by him and for him.” — Colossians 1:16",
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
    motto: "Godly business ethics for an ever-changing commercial world.",
    head: "Mr. Katesi",
    overview:
      "The Commercials Department teaches Accounting, Business Studies, Economics, and Commerce within the context of Biblical ethics. We equip students to become principled business leaders, accountants, and entrepreneurs who manage finances with integrity.",
    vision:
      "To inspire future economic and entrepreneurial champions whose commercial dealings are distinguished by fairness, diligence, and accountability.",
    scripture:
      "“The Lord abhors dishonest scales, but accurate weights find favor with Him.” — Proverbs 11:1",
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

const Departments = () => {
  const [activeDept, setActiveDept] = useState<string>("science");

  return (
    <Layout>
      {/* Collegiate Hero Banner */}
      <section className="relative min-h-[460px] w-full flex items-center justify-center overflow-hidden bg-[#10264f]">
        <div className="absolute inset-0">
          <img
            src={heroImg}
            alt="Able God College faculty and staff"
            className="w-full h-full object-cover object-center"
            style={{ objectPosition: "center 30%" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#10264f]/92 via-[#10264f]/85 to-[#10264f]/95" />
        </div>

        <div className="container relative z-10 mx-auto px-4 py-16 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <span className="inline-flex items-center gap-2 bg-accent/90 text-accent-foreground text-xs font-bold tracking-widest uppercase px-5 py-2 rounded-full shadow-lg">
              <Sparkles className="h-3.5 w-3.5" />
              Academic Leadership
            </span>

            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight tracking-tight">
              Our Academic <span className="italic font-serif text-accent">Departments</span>
            </h1>

            <div className="w-16 h-1 bg-accent mx-auto rounded-full" />

            <p className="text-white/85 text-lg md:text-xl font-light leading-relaxed max-w-2xl mx-auto">
              Meet the qualified educators, department heads, and specialists dedicated to helping every learner excel
              academically and morally.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Button
                asChild
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold px-8 h-12 shadow-xl shadow-accent/20 gap-2"
              >
                <Link to="/admissions">
                  Join Able God ($200/term)
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 text-white bg-white/10 hover:bg-white hover:text-[#10264f] font-semibold px-7 h-12 backdrop-blur-sm"
              >
                <Link to="/academics">View Academic Programs</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky Department Filter Navigation */}
      <nav aria-label="Departments" className="sticky top-20 z-30 border-b border-border bg-card/95 py-3.5 backdrop-blur shadow-sm">
        <div className="container mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 justify-start sm:justify-center">
          {departments.map((dept) => {
            const Icon = dept.icon;
            const isActive = activeDept === dept.id;
            return (
              <a
                key={dept.id}
                href={`#${dept.id}`}
                onClick={() => setActiveDept(dept.id)}
                className={`shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow"
                    : "border border-border text-foreground hover:border-accent hover:text-accent bg-background"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{dept.name.replace(" Department", "").replace(" & Technical", "").replace(" & Literature", "").replace(" & Humanities", "").replace(" & Business", "")}</span>
              </a>
            );
          })}
        </div>
      </nav>

      {/* Department Detail Cards Grid */}
      <div className="bg-muted/40 py-12 md:py-16">
        <div className="container mx-auto grid max-w-6xl gap-10 px-4">
          {departments.map(({ icon: Icon, ...dept }, index) => (
            <section
              key={dept.id}
              id={dept.id}
              className="scroll-mt-36 overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition hover:shadow-md"
              aria-labelledby={`${dept.id}-heading`}
            >
              <div className={`p-7 sm:p-10 ${index % 2 === 1 ? "bg-muted/20" : ""}`}>
                {/* Header */}
                <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center pb-6 border-b border-border">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-accent">Able God College Faculty</span>
                    <h2 id={`${dept.id}-heading`} className="mt-1 font-heading text-3xl font-bold text-foreground">
                      {dept.name}
                    </h2>
                    <p className="mt-2 text-base font-medium text-primary italic font-serif leading-relaxed">
                      "{dept.motto}"
                    </p>
                  </div>

                  <div className="flex items-center gap-3.5 rounded-2xl bg-[#10264f] p-4 text-white shadow-md">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-accent">
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-accent">Head of Department</p>
                      <p className="font-bold text-sm text-white">{dept.head}</p>
                      {dept.staff && (
                        <p className="text-xs text-white/80 mt-0.5">Faculty: {dept.staff}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content Body */}
                <div className="grid gap-6 pt-6">
                  {dept.overview && (
                    <div className="rounded-2xl border border-border bg-background p-5 sm:p-6 shadow-sm">
                      <h3 className="font-heading text-base font-bold text-foreground mb-2 flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-accent" />
                        Department Overview
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{dept.overview}</p>
                    </div>
                  )}

                  {dept.vision && (
                    <div>
                      <h3 className="font-heading text-lg font-bold text-foreground mb-2">Our Vision</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{dept.vision}</p>
                    </div>
                  )}

                  {dept.scripture && (
                    <blockquote className="rounded-xl border-l-4 border-[#c51f67] bg-[#c51f67]/5 p-5 font-serif text-sm leading-relaxed text-foreground italic shadow-sm">
                      <div className="flex items-start gap-3">
                        <Quote className="h-5 w-5 text-[#c51f67] shrink-0 mt-0.5" />
                        <div>{dept.scripture}</div>
                      </div>
                    </blockquote>
                  )}

                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-accent mb-1">What We Stand For</p>
                    <h3 className="font-heading text-lg font-bold text-foreground mb-4">Departmental Values &amp; Objectives</h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {dept.values.map((val, valIdx) => (
                        <div
                          key={valIdx}
                          className="flex items-start gap-3 rounded-xl bg-background border border-border p-4 shadow-sm"
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent font-bold text-xs mt-0.5">
                            {valIdx + 1}
                          </span>
                          <span className="text-xs sm:text-sm text-foreground/90 leading-relaxed">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* Bottom CTA Banner */}
      <section className="py-20 bg-[#10264f] text-white">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
            Learn More About Able God College
          </h2>
          <p className="text-white/80 text-base sm:text-lg leading-relaxed mb-8">
            Our department educators are ready to welcome your learner. Tuition is <span className="text-accent font-bold">US$ 200 per term</span>.
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
              <Link to="/contact">Contact Admissions Desk</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Departments;
