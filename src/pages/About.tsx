import { Layout } from "@/components/layout/Layout";
import SchoolInformationPosters from "@/components/public/SchoolInformationPosters";
import SchoolCommunitySection from "@/components/public/SchoolCommunitySection";
import logo from "/able-god-college-logo.png";
import { schoolIdentity } from "@/lib/schoolInformation";

const About = () => (
  <Layout>
    <section className="py-20 bg-gradient-hero">
      <div className="container mx-auto px-4 text-center">
        <img
          src={logo}
          alt="Able God College crest"
          className="mx-auto mb-6 h-32 w-32 rounded-2xl bg-card p-3 object-contain"
        />
        <h1 className="mb-4 font-heading text-4xl font-bold text-primary-foreground md:text-5xl">
          About Able God College
        </h1>
        <p className="text-xl text-primary-foreground/80">{schoolIdentity.motto}</p>
      </div>
    </section>

    <section className="bg-card py-16 md:py-20">
      <div className="container mx-auto grid items-center gap-12 px-4 lg:grid-cols-2">
        <div>
          <h2 className="mb-5 font-heading text-3xl font-bold text-foreground">Our Story</h2>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            Able God College's displayed mission, vision and school rules describe its commitment to a safe and inclusive learning environment, strong school work and respect for others.
          </p>
          <p className="leading-relaxed text-muted-foreground">
            The school's motto is <span className="font-semibold text-primary">Honour God · Respect Others · Excel in All You Do.</span>
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-background p-6 shadow-elegant sm:p-8">
          <h2 className="mb-5 font-heading text-2xl font-bold text-foreground">Our Core Values</h2>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {schoolIdentity.schoolValues.map((value, index) => (
              <div key={value} className="flex min-h-20 items-center gap-3 rounded-xl bg-secondary/60 p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent font-bold text-accent-foreground">{index + 1}</span>
                <span className="text-sm font-bold uppercase tracking-wide text-primary">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    <SchoolInformationPosters sections={["mission-vision", "committee"]} />
    <SchoolCommunitySection />
  </Layout>
);

export default About;
