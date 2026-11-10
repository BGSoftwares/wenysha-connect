import { Link } from "react-router-dom";
import { ArrowRight, Bell, CalendarDays, MapPin, Phone, Sparkles } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import preparationProgram from "@/assets/new-school-media/grade7-form1-preparation.jpeg";
import communityGathering from "@/assets/new-school-media/school-community-gathering.jpeg";
import heroImg from "@/assets/slides/slide-6254.jpeg";

const Announcements = () => (
  <Layout>
    {/* Collegiate Hero Banner */}
    <section className="relative min-h-[460px] w-full flex items-center justify-center overflow-hidden bg-[#10264f]">
      <div className="absolute inset-0">
        <img
          src={heroImg}
          alt="Able God College school gathering"
          className="w-full h-full object-cover object-center"
          style={{ objectPosition: "center 30%" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#10264f]/92 via-[#10264f]/85 to-[#0b1c3b]/95" />
      </div>

      <div className="container relative z-10 mx-auto px-4 py-16 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <span className="inline-flex items-center gap-2 bg-accent/90 text-accent-foreground text-xs font-bold tracking-widest uppercase px-5 py-2 rounded-full shadow-lg">
            <Sparkles className="h-3.5 w-3.5" />
            Official School Bulletins
          </span>

          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight tracking-tight">
            School Notices &amp; <span className="italic font-serif text-accent">Updates</span>
          </h1>

          <div className="w-16 h-1 bg-accent mx-auto rounded-full" />

          <p className="text-white/85 text-lg md:text-xl font-light leading-relaxed max-w-2xl mx-auto">
            Stay informed with the latest term calendar updates, special educational preparation initiatives, and
            community news from Able God College.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Button
              asChild
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold px-8 h-12 shadow-xl shadow-accent/20 gap-2"
            >
              <Link to="/admissions">
                Admissions &amp; Fees ($200/term)
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>

    {/* Notices Content */}
    <section className="bg-muted/40 px-4 py-16">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
        {/* Notice 1: Preparation Program */}
        <article className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition hover:shadow-md">
          <div className="bg-[#fff5fa] p-4 flex items-center justify-center">
            <img
              src={preparationProgram}
              alt="Grade 7 to Form 1 Preparation Programme flyer"
              className="max-h-[36rem] w-auto object-contain rounded-xl shadow-sm"
            />
          </div>
          <div className="border-t-4 border-[#c51f67] p-7 sm:p-9 space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-[#c51f67]">Featured Programme</span>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
              Grade 7 to Form 1 Preparation Programme
            </h2>
            <p className="leading-relaxed text-sm text-muted-foreground">
              A free bridging programme designed to give Grade 7 learners confidence in secondary mathematics,
              English, science, and disciplined study habits before stepping into Form 1.
            </p>

            <div className="rounded-xl bg-background border border-border p-4 space-y-2 text-xs sm:text-sm font-medium text-foreground">
              <p className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-accent" />
                Foundational skills in Mathematics, English &amp; Integrated Science
              </p>
              <p className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#c51f67]" />
                Personalised teacher mentorship and moral guidance
              </p>
              <p className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Safe, disciplined, and supportive Christian learning environment
              </p>
            </div>

            <div className="grid gap-3 border-t border-border pt-4 text-xs sm:text-sm text-foreground/80 sm:grid-cols-2">
              <p className="flex items-start gap-2">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[#c51f67]" />
                <span><strong>Dates:</strong> 12 October – December 2026</span>
              </p>
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#c51f67]" />
                <span><strong>Campus:</strong> Able God College, Masvingo</span>
              </p>
              <p className="flex items-start gap-2 sm:col-span-2">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#c51f67]" />
                <span><strong>Enquiries:</strong> +263 779 381 415 / +263 785 830 960</span>
              </p>
            </div>

            <div className="pt-2">
              <p className="rounded-xl bg-[#10264f] p-3.5 text-center text-xs font-bold uppercase tracking-wider text-white">
                <span className="text-accent">Free Community Initiative</span> • Limited Spaces Available
              </p>
            </div>
          </div>
        </article>

        {/* Notice 2: Community Gathering */}
        <article className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition hover:shadow-md flex flex-col justify-between">
          <div>
            <img
              src={communityGathering}
              alt="Able God College community members gathered outdoors"
              className="h-[300px] w-full object-cover"
            />
            <div className="border-t-4 border-primary p-7 sm:p-9 space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Community Life</span>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
                School Community &amp; Fellowship
              </h2>
              <p className="leading-relaxed text-sm text-muted-foreground">
                A warm glimpse into the united community of educators, parents, and supporters who stand together to
                invest in the next generation at Able God College.
              </p>

              <div className="rounded-xl bg-background border border-border p-4 text-xs text-muted-foreground leading-relaxed">
                "Honour God · Respect Others · Excel in All You Do" — Every member of our staff and learner body strives
                to reflect God's love through kindness, diligence, and academic integrity.
              </div>
            </div>
          </div>

          <div className="p-7 sm:p-9 pt-0">
            <Button asChild className="w-full bg-primary text-primary-foreground font-semibold h-11">
              <Link to="/gallery">
                View Photo Gallery <ArrowRight className="h-4 w-4 ml-1.5" />
              </Link>
            </Button>
          </div>
        </article>
      </div>
    </section>

    {/* Bottom CTA Banner */}
    <section className="py-20 bg-[#10264f] text-white">
      <div className="container mx-auto px-4 text-center max-w-3xl">
        <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
          Enrol at Able God College
        </h2>
        <p className="text-white/80 text-base sm:text-lg leading-relaxed mb-8">
          Admissions are open for Form 1 through A-Level. Tuition is <span className="text-accent font-bold">US$ 200 per term</span>.
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

export default Announcements;
