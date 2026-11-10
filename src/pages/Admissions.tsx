import { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import AdmissionFormModal from "@/components/home/AdmissionFormModal";
import { schoolContact } from "@/lib/schoolContact";
import { schoolIdentity, zimsecPassRates } from "@/lib/schoolInformation";
import { downloadEnrolmentFormPdf } from "@/lib/enrolmentPdf";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  GraduationCap,
  Download,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  Building,
  HelpCircle,
  FileCheck,
  Award,
  Sparkles,
} from "lucide-react";
import heroImage from "@/assets/new-school-media/school-assembly.jpeg";
import communityGroup2 from "@/assets/new-school-media/school-community-group-2.jpeg";
import s6256 from "@/assets/slides/slide-6256.jpeg";
import s6255 from "@/assets/slides/slide-6255.jpeg";
import communityGroup1 from "@/assets/new-school-media/school-community-group-1.jpeg";

const ableGodPhotos = [
  {
    src: communityGroup2,
    title: "Learners & Teachers in School Uniform",
    description: "Able God College learners and teachers standing together in official school uniform.",
  },
  {
    src: s6256,
    title: "Proud in Pink and Navy",
    description: "Able God College learners in full school uniform on campus grounds.",
  },
  {
    src: s6255,
    title: "Our Learners on Campus",
    description: "Learners standing together on the Able God College grounds.",
  },
  {
    src: communityGroup1,
    title: "School Community Gathering",
    description: "Able God College learners and staff gathered outdoors.",
  },
];

interface ApplicationTab {
  id: "form1" | "midstream";
  label: string;
  eyebrow: string;
  heading: string;
  intro: string;
  documents: string[];
  timeline: Array<{
    icon: React.ReactNode;
    label: string;
    detail: string;
  }>;
}

const applicationData: ApplicationTab[] = [
  {
    id: "form1",
    label: "Form 1 Entry",
    eyebrow: "Standard Secondary Entry",
    heading: "Joining Able God College at Form 1",
    intro:
      "Form 1 admissions follow national Ministry of Primary & Secondary Education guidelines and Grade 7 examination clearance. Applications are accepted on a rolling basis with priority intake for the upcoming academic year.",
    documents: [
      "One recent passport-size colour photograph of the learner",
      "Certified copy of learner's birth certificate",
      "Certified copy of Grade 7 result slip (or Grade 6 & 7 school reports)",
      "Confidential conduct report or testimonial letter from previous primary school",
      "Certified copy of National ID / Passport of parent or legal guardian",
      "Non-refundable application & assessment processing fee (US$ 20)",
    ],
    timeline: [
      {
        icon: <FileText className="h-5 w-5" />,
        label: "Submit Application & Documents",
        detail:
          "Submit the completed enrolment form and required documents online, via WhatsApp, or in person at our Masvingo campus front office.",
      },
      {
        icon: <GraduationCap className="h-5 w-5" />,
        label: "Entrance Assessment & Interview",
        detail:
          "Learners undergo a friendly entrance assessment covering core numeracy, literacy, and an orientation interview aligned with school values.",
      },
      {
        icon: <Award className="h-5 w-5" />,
        label: "Admissions Committee Review",
        detail:
          "The Admissions Committee reviews the submission and communicates the admission decision within 3 to 5 business days.",
      },
      {
        icon: <CheckCircle2 className="h-5 w-5" />,
        label: "Registration & Placement Confirmation",
        detail:
          "Successful applicants secure their place by paying the enrolment fee and Term 1 tuition (US$ 200), collect uniform specifications, and receive class allocations.",
      },
    ],
  },
  {
    id: "midstream",
    label: "Form 2 – Upper 6",
    eyebrow: "Midstream & A-Level Entry",
    heading: "Joining Able God College — Form 2 to Upper 6",
    intro:
      "Enrolment into Form 2 through Form 4 and Lower/Upper 6 is available throughout the academic year, subject to class capacity. Academic records and subject combinations (Sciences, Commercials, Arts) are evaluated to ensure proper placement.",
    documents: [
      "One recent passport-size colour photograph of the learner",
      "Certified copy of learner's birth certificate",
      "Official school reports for the previous two academic terms",
      "Official ZIMSEC O-Level results slip (mandatory for A-Level / Lower 6 entry)",
      "Clearance and transfer letter from the current or previous secondary school head",
      "Certified copy of National ID / Passport of parent or legal guardian",
      "Non-refundable application & assessment processing fee (US$ 20)",
    ],
    timeline: [
      {
        icon: <FileText className="h-5 w-5" />,
        label: "Submit Academic Dossier",
        detail:
          "Submit all required documents along with complete academic transcripts and previous term reports for assessment by the academic dean.",
      },
      {
        icon: <GraduationCap className="h-5 w-5" />,
        label: "Subject Streaming & Placement Test",
        detail:
          "For Form 2–4 and A-Level, a subject placement evaluation is conducted to confirm subject readiness in chosen academic tracks.",
      },
      {
        icon: <Award className="h-5 w-5" />,
        label: "Decision Notification",
        detail:
          "Parents and guardians are notified of the admission offer and streaming allocation within one week of evaluation.",
      },
      {
        icon: <CheckCircle2 className="h-5 w-5" />,
        label: "Final Enrolment & Onboarding",
        detail:
          "Finalise term fee payment (US$ 200/term), sign the student code of conduct, receive timetable, and activate access to the student learning portal.",
      },
    ],
  },
];

const officeHours = [
  { day: "Monday – Thursday", hours: "07:30 – 16:30" },
  { day: "Friday", hours: "07:30 – 15:30" },
  { day: "Saturday", hours: "08:30 – 12:30 (Admissions Desk)" },
  { day: "Sunday & Public Holidays", hours: "Closed" },
];

const admissionsFaqs = [
  {
    q: "How much are the school fees at Able God College?",
    a: "Tuition fees are US$ 200 per term across Forms 1 through 4 and A-Level. There is also a one-time application fee of US$ 20 and a new student enrolment fee of US$ 50.",
  },
  {
    q: "What payment methods are accepted for school fees?",
    a: "We accept payments in USD and ZWG via EcoCash, OneMoney, Paynow, NBS Bank transfer, POS debit card swipe, and direct cash payments at the campus Accounts Office.",
  },
  {
    q: "Can a student transfer to Able God College in the middle of a term or academic year?",
    a: "Yes. Midstream transfers for Form 2, Form 3, and Lower 6 are accepted throughout the year, subject to availability of desk space and satisfactory academic and conduct reports from the previous school.",
  },
  {
    q: "What are the school hours and daily reporting times?",
    a: "In accordance with school discipline rules, learners must arrive punctually by 06:55 AM. Normal lessons and supervised study conclude in the afternoon.",
  },
  {
    q: "What subject pathways are offered at ZIMSEC O-Level and A-Level?",
    a: "Able God College offers comprehensive ZIMSEC streams covering Sciences (Mathematics, Physics, Chemistry, Biology, Computer Science), Commercials (Accounting, Business Studies, Economics), and Arts & Humanities (History, Geography, English Literature, Shona, Heritage Studies).",
  },
  {
    q: "Are payment plans available for parents who cannot pay in full upfront?",
    a: "Yes. While fees are officially due on or before the first day of each term, structured installment plans can be arranged with the Accounts Office upon approval.",
  },
];

const Admissions = () => {
  const [activeTabId, setActiveTabId] = useState<"form1" | "midstream">("form1");
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const currentTab = applicationData.find((tab) => tab.id === activeTabId) ?? applicationData[0];

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      await downloadEnrolmentFormPdf();
    } catch (error) {
      console.error("Failed to generate PDF:", error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[540px] w-full flex items-center justify-center overflow-hidden bg-[#10264f]">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Able God College campus"
            className="w-full h-full object-cover object-center"
            style={{ objectPosition: "center 30%" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#10264f]/90 via-[#10264f]/85 to-[#10264f]/95" />
        </div>

        <div className="container relative z-10 mx-auto px-4 py-20 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <span className="inline-flex items-center gap-2 bg-accent/90 text-accent-foreground text-xs font-bold tracking-widest uppercase px-5 py-2 rounded-full shadow-lg">
              <Sparkles className="h-3.5 w-3.5" />
              Join the Able God College Family
            </span>

            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight tracking-tight">
              Admissions &amp; <span className="italic font-serif text-accent">Enrolment</span>
            </h1>

            <div className="w-16 h-1 bg-accent mx-auto rounded-full" />

            <p className="text-white/85 text-lg md:text-xl font-light leading-relaxed max-w-2xl mx-auto">
              Joining Able God College is the beginning of a transformative educational journey. Discover our
              admissions process, transparent fees, and enrolment guidelines below.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Button
                size="lg"
                onClick={() => setShowEnquiryModal(true)}
                className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold px-8 h-12 text-base shadow-xl shadow-accent/20 gap-2"
              >
                Apply Online
                <ArrowRight className="h-4 w-4" />
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="border-white/30 text-white bg-white/10 hover:bg-white hover:text-[#10264f] font-semibold px-7 h-12 text-base backdrop-blur-sm gap-2"
              >
                <Download className="h-4 w-4" />
                {isGeneratingPdf ? "Generating..." : "Download Enrolment Form"}
              </Button>

              <Button
                asChild
                size="lg"
                variant="ghost"
                className="text-white/90 hover:text-white hover:bg-white/10 font-semibold px-6 h-12 text-base"
              >
                <Link to="/contact">Book Campus Visit</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Non-Discrimination Policy Banner */}
      <section className="bg-muted/70 border-y border-border py-6">
        <div className="container mx-auto px-4">
          <p className="text-center text-xs sm:text-sm text-muted-foreground max-w-4xl mx-auto leading-relaxed italic">
            Able God College admits students of any race, gender, religious background, tribe, national and ethnic
            origin to all the rights, privileges, programs, and activities generally accorded or made available to
            students at the school. It does not discriminate in administration of its educational policies, admissions
            policies, scholarship programs, and school-administered athletic, cultural, and spiritual activities.
          </p>
        </div>
      </section>

      {/* Why Able God College Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <div>
                <p className="text-accent font-bold uppercase tracking-widest text-xs mb-2">Why Able God College</p>
                <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground leading-snug">
                  A Place Where Every Student Thrives
                </h2>
                <div className="w-14 h-1 bg-accent mt-3 rounded-full" />
              </div>

              <p className="text-muted-foreground leading-relaxed text-base">
                Able God College offers far more than a standard secondary curriculum — it offers a supportive,
                faith-grounded community where disciplined character, academic excellence, and Christian moral
                integrity go hand in hand.
              </p>

              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Award className="h-5 w-5" />
                    </span>
                    <h3 className="font-heading text-base font-bold text-foreground">74.5% ZIMSEC Pass</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Proven academic track record with 84.5% girls and 62.3% boys pass rate in 2025 examinations.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/20 text-accent">
                      <ShieldCheck className="h-5 w-5" />
                    </span>
                    <h3 className="font-heading text-base font-bold text-foreground">Guided Values</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Grounded in our motto: <span className="font-medium text-foreground">Honour God • Respect Others • Excel in All You Do</span>.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Button
                  onClick={() => setShowEnquiryModal(true)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-6"
                >
                  Start Your Application
                </Button>
                <Link
                  to="/academics"
                  className="text-sm font-semibold text-accent hover:text-accent/80 inline-flex items-center gap-1.5 transition-colors"
                >
                  Explore Academic Programs <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Right Image - Authentic Able God College Photos */}
            <div className="relative">
              <div className="relative mx-auto max-w-lg overflow-hidden rounded-2xl border-4 border-white shadow-2xl bg-[#10264f]">
                <img
                  src={ableGodPhotos[selectedPhotoIndex].src}
                  alt={ableGodPhotos[selectedPhotoIndex].title}
                  className="w-full h-[420px] object-cover object-center transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
                
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white pointer-events-none">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-accent backdrop-blur-md border border-white/10">
                    <Sparkles className="h-3 w-3" />
                    {schoolIdentity.name}
                  </span>
                  <span className="rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-medium text-white/80 backdrop-blur-md border border-white/10">
                    {selectedPhotoIndex + 1} / {ableGodPhotos.length}
                  </span>
                </div>

                <div className="absolute bottom-4 left-5 right-5 text-white pointer-events-none">
                  <p className="text-sm font-bold text-white mb-0.5">
                    {ableGodPhotos[selectedPhotoIndex].title}
                  </p>
                  <p className="text-xs text-white/80 line-clamp-1">
                    {ableGodPhotos[selectedPhotoIndex].description}
                  </p>
                </div>

                {/* Prev / Next controls */}
                <button
                  type="button"
                  onClick={() => setSelectedPhotoIndex((prev) => (prev - 1 + ableGodPhotos.length) % ableGodPhotos.length)}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md transition hover:bg-black/75 hover:scale-110"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPhotoIndex((prev) => (prev + 1) % ableGodPhotos.length)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md transition hover:bg-black/75 hover:scale-110"
                  aria-label="Next photo"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Indicator dots */}
              <div className="mt-3 flex items-center justify-center gap-2">
                {ableGodPhotos.map((photo, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedPhotoIndex(idx)}
                    className={`h-2 rounded-full transition-all ${
                      selectedPhotoIndex === idx ? "w-6 bg-accent" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    }`}
                    aria-label={`View ${photo.title}`}
                  />
                ))}
              </div>

              {/* Floating Stat Badge */}
              <div className="absolute -bottom-6 -left-4 sm:left-4 rounded-xl border border-border bg-card p-4 shadow-xl hidden sm:flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground font-black text-lg">
                  $200
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-foreground">Term Tuition</p>
                  <p className="text-xs text-muted-foreground">Affordable excellence per term</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Application Process Tabbed Section */}
      <section className="py-24 bg-background" id="apply">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-accent font-bold uppercase tracking-widest text-xs mb-2">How to Apply</p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              The Application Process
            </h2>
            <div className="w-16 h-1 bg-accent mx-auto mb-8 rounded-full" />

            {/* Tab Buttons */}
            <div className="inline-flex rounded-xl bg-muted p-1.5 gap-1 shadow-inner border border-border">
              {applicationData.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    activeTabId === tab.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content Box */}
          <div className="max-w-5xl mx-auto rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-lg">
            <div className="mb-8">
              <span className="text-xs font-bold uppercase tracking-widest text-accent">{currentTab.eyebrow}</span>
              <h3 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mt-1 mb-3">
                {currentTab.heading}
              </h3>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-3xl">
                {currentTab.intro}
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 items-start">
              {/* Left Column: Required Documents */}
              <div className="rounded-2xl border border-border bg-background p-6 sm:p-7 shadow-sm">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 text-accent">
                    <FileCheck className="h-5 w-5" />
                  </span>
                  <div>
                    <h4 className="font-heading text-lg font-bold text-foreground">Required Documents</h4>
                    <p className="text-xs text-muted-foreground">Checklist for all applicants</p>
                  </div>
                </div>

                <ul className="space-y-4">
                  {currentTab.documents.map((doc, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-foreground/90 leading-relaxed">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{doc}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleDownloadPdf}
                    disabled={isGeneratingPdf}
                    variant="outline"
                    className="w-full text-xs sm:text-sm font-semibold gap-2 border-border hover:bg-muted"
                  >
                    <Download className="h-4 w-4" />
                    Download Checklist (PDF)
                  </Button>
                </div>
              </div>

              {/* Right Column: Timeline & Assessment */}
              <div className="rounded-2xl border border-border bg-background p-6 sm:p-7 shadow-sm">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Calendar className="h-5 w-5" />
                  </span>
                  <div>
                    <h4 className="font-heading text-lg font-bold text-foreground">Timeline &amp; Assessment</h4>
                    <p className="text-xs text-muted-foreground">Step-by-step admission journey</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {currentTab.timeline.map((step, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-sm text-sm font-bold">
                          {idx + 1}
                        </div>
                        {idx < currentTab.timeline.length - 1 && (
                          <div className="w-0.5 flex-1 bg-border mt-2 min-h-[28px]" />
                        )}
                      </div>
                      <div className="pb-2">
                        <p className="font-semibold text-foreground text-sm mb-1">{step.label}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{step.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fees & Enrolment Costs Structure */}
      <section className="py-20 bg-muted/60" id="fees">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-accent font-bold uppercase tracking-widest text-xs mb-2">What to Expect</p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Fees &amp; Enrolment Costs
            </h2>
            <div className="w-16 h-1 bg-accent mx-auto mb-4 rounded-full" />
            <p className="text-muted-foreground max-w-xl mx-auto text-sm">
              Transparent, competitive tuition structured to ensure high educational quality and student growth.
            </p>
          </div>

          <div className="max-w-5xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Application Fee */}
            <div className="bg-card rounded-2xl border border-border p-7 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-accent" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-accent mb-1">Application Fee</p>
                <p className="font-heading text-3xl font-bold text-primary">US$ 20</p>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Non-refundable • Payable upon submitting application form &amp; covers entrance assessment administration.
                </p>
              </div>
            </div>

            {/* Enrolment Fee */}
            <div className="bg-card rounded-2xl border border-border p-7 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Enrolment Fee</p>
                <p className="font-heading text-3xl font-bold text-primary">US$ 50</p>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  One-time non-refundable fee upon offer acceptance • Secures desk allocation and student file setup.
                </p>
              </div>
            </div>

            {/* Tuition Fees - FEATURED CARD */}
            <div className="bg-gradient-to-br from-[#10264f] to-[#1a3a75] text-white rounded-2xl border border-accent/40 p-7 shadow-xl flex flex-col justify-between relative overflow-hidden sm:col-span-2 lg:col-span-1">
              <div className="absolute top-3 right-3">
                <span className="bg-accent text-accent-foreground text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow">
                  Approved Rate
                </span>
              </div>
              <div>
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4 border border-white/20">
                  <GraduationCap className="w-6 h-6 text-accent" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-accent mb-1">Tuition Fees</p>
                <div className="flex items-baseline gap-1">
                  <p className="font-heading text-4xl font-bold text-white">US$ 200</p>
                  <span className="text-sm font-normal text-white/80">/ term</span>
                </div>
                <p className="text-xs text-white/85 mt-2 leading-relaxed">
                  All Forms (Form 1, 2, 3, 4 &amp; A-Level) • Standard term tuition covering academic classes, tests, and student support.
                </p>
              </div>
            </div>

            {/* Learning Resources & Practical Subjects */}
            <div className="bg-card rounded-2xl border border-border p-7 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Building className="w-6 h-6 text-primary" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-foreground/70 mb-1">Practical &amp; ICT Labs</p>
                <p className="font-heading text-2xl font-bold text-primary">Included</p>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Access to computer laboratories, library facilities, science equipment, and regular sporting activities.
                </p>
              </div>
            </div>

            {/* Flexible Payment Channels */}
            <div className="bg-card rounded-2xl border border-border p-7 shadow-sm flex flex-col justify-between sm:col-span-2 lg:col-span-2">
              <div>
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-4">
                  <CreditCard className="w-6 h-6 text-accent" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-accent mb-1">Accepted Payment Methods</p>
                <p className="font-heading text-xl font-bold text-foreground">Multi-Currency &amp; Digital Payments</p>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Pay securely via <span className="font-semibold text-foreground">EcoCash, OneMoney, Paynow, NBS Bank Transfer</span>, POS swipe, or cash at the campus accounts counter. Receipts are issued for all transactions.
                </p>
              </div>
            </div>

            {/* Advance Payment Notice Banner */}
            <div className="bg-primary/5 rounded-2xl border border-primary/20 p-6 shadow-sm flex items-start gap-4 sm:col-span-2 lg:col-span-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary mt-1">
                <Clock className="w-5 h-5" />
              </span>
              <div className="text-xs sm:text-sm text-foreground/80 leading-relaxed">
                <p className="font-bold text-foreground mb-1">Fee Payment Policy:</p>
                Fees are payable in advance, on or before the first day of each term. In cases where installments are
                required, parents and guardians are requested to arrange a structured payment schedule directly with the
                Accounts Office prior to term commencement.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ready to Join Action Section */}
      <section className="py-20 bg-[#10264f] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <span className="text-accent font-bold uppercase tracking-widest text-xs mb-2 block">
              Enrolment Call
            </span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">Ready to Join Able God College?</h2>
            <p className="text-white/80 text-base sm:text-lg leading-relaxed">
              Begin your child's journey today. Apply online using our digital admissions form or download the official
              application form to submit in person.
            </p>
          </div>

          <div className="max-w-3xl mx-auto grid sm:grid-cols-2 gap-6">
            {/* Card 1: Apply Online */}
            <div className="bg-card text-card-foreground rounded-2xl p-8 shadow-2xl flex flex-col items-center text-center justify-between border border-border">
              <div className="space-y-4 flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-accent" />
                </div>
                <div>
                  <h3 className="font-heading text-xl font-bold text-foreground mb-1">Apply Online</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Submit your application details directly through our digital form. Our admissions team will review your enquiry promptly.
                  </p>
                </div>
              </div>

              <Button
                onClick={() => setShowEnquiryModal(true)}
                className="mt-6 w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold h-11"
              >
                Open Application Form
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>

            {/* Card 2: Download Printable Form */}
            <div className="bg-card text-card-foreground rounded-2xl p-8 shadow-2xl flex flex-col items-center text-center justify-between border border-border">
              <div className="space-y-4 flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Download className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading text-xl font-bold text-foreground mb-1">Printable Application Form</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Download the official Able God College Student Enrolment Form (PDF), print, fill out by hand, and bring to campus.
                  </p>
                </div>
              </div>

              <Button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                variant="outline"
                className="mt-6 w-full border-primary text-primary hover:bg-primary hover:text-white font-bold h-11"
              >
                <Download className="h-4 w-4 mr-2" />
                {isGeneratingPdf ? "Generating..." : "Download Form (PDF)"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Admissions Office Hours & Contact */}
      <section className="py-20 bg-background" id="visit">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-accent font-bold uppercase tracking-widest text-xs mb-2">Visit Us</p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Admissions Office &amp; Campus Hours
            </h2>
            <div className="w-16 h-1 bg-accent mx-auto rounded-full" />
          </div>

          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
            {/* Opening Hours */}
            <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 text-accent">
                  <Clock className="w-5 h-5" />
                </span>
                <h3 className="font-heading text-xl font-bold text-foreground">Opening Hours</h3>
              </div>

              <div className="divide-y divide-border">
                {officeHours.map((row, idx) => (
                  <div key={idx} className="flex justify-between items-center py-3.5 text-sm">
                    <span className="font-medium text-foreground">{row.day}</span>
                    <span className={row.hours === "Closed" ? "text-accent font-semibold" : "text-muted-foreground"}>
                      {row.hours}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Get in Touch */}
            <div className="bg-card rounded-2xl border border-border p-8 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <MapPin className="w-5 h-5" />
                  </span>
                  <h3 className="font-heading text-xl font-bold text-foreground">Get in Touch</h3>
                </div>

                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-accent shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-foreground">Campus Address</p>
                      <p className="text-muted-foreground">{schoolContact.address}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-accent shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-foreground">Telephone &amp; WhatsApp</p>
                      <p className="text-muted-foreground">
                        {schoolContact.phones.map((p, i) => (
                          <span key={p.href}>
                            {i > 0 && " • "}
                            <a href={p.href} className="hover:text-primary transition-colors">
                              {p.label}
                            </a>
                          </span>
                        ))}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-accent shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-foreground">Admissions Email</p>
                      <a href="mailto:admissions@ablegodcollege.edu" className="text-muted-foreground hover:text-primary transition-colors">
                        admissions@ablegodcollege.edu
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-border">
                <Button asChild className="w-full bg-primary text-primary-foreground font-semibold">
                  <Link to="/contact">Contact Campus Office</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Admissions FAQ Accordion */}
      <section className="py-20 bg-muted/40 border-t border-border">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 text-accent mx-auto mb-3">
              <HelpCircle className="h-5 w-5" />
            </span>
            <p className="text-accent font-bold uppercase tracking-widest text-xs mb-2">Got Questions?</p>
            <h2 className="font-heading text-3xl font-bold text-foreground">Frequently Asked Questions</h2>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {admissionsFaqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`faq-${index}`}
                className="rounded-xl border border-border bg-card px-6 py-1 shadow-sm"
              >
                <AccordionTrigger className="text-left font-heading text-base font-semibold text-foreground hover:no-underline hover:text-accent">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pt-2 pb-4">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Enrolment Form Modal */}
      <AdmissionFormModal open={showEnquiryModal} onOpenChange={setShowEnquiryModal} />
    </Layout>
  );
};

export default Admissions;
