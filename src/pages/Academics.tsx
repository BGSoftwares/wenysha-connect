import { Link } from "react-router-dom";
import { ArrowRight, BookOpen } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import SchoolInformationPosters from "@/components/public/SchoolInformationPosters";
import UniversityPathwaysSection from "@/components/academics/UniversityPathwaysSection";

const Academics = () => (
  <Layout>
    <section className="py-20 bg-gradient-hero">
      <div className="container mx-auto px-4 text-center">
        <h1 className="mb-4 font-heading text-4xl font-bold text-primary-foreground md:text-5xl">Academic Programs</h1>
        <p className="mx-auto max-w-2xl text-xl text-primary-foreground/80">
          ZIMSEC results and school work expectations at Able God College.
        </p>
      </div>
    </section>

    <SchoolInformationPosters sections={["results", "rules"]} />

    <UniversityPathwaysSection />

    <section className="bg-card py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="mb-10 text-center">
          <h2 className="mb-3 font-heading text-3xl font-bold text-foreground">Learning Resources</h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Sign in to the student portal to view learning materials made available to your account.
          </p>
        </div>
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 rounded-2xl border border-border bg-background p-8 text-center shadow-elegant sm:flex-row sm:text-left">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <BookOpen className="h-7 w-7" aria-hidden="true" />
          </span>
          <div className="flex-1">
            <h3 className="font-heading text-xl font-semibold text-foreground">Student Portal</h3>
            <p className="mt-1 text-sm text-muted-foreground">Access materials and assignments shared through the school portal.</p>
          </div>
          <Link to="/portal" className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-3 font-semibold text-accent-foreground transition hover:bg-accent/90">
            Open Portal <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>

    <section className="bg-background py-16">
      <div className="container mx-auto px-4 text-center">
        <h2 className="mb-3 font-heading text-2xl font-bold text-foreground">Academic Enquiries</h2>
        <p className="mx-auto mb-6 max-w-2xl text-muted-foreground">
          Contact the school for current subject and programme information.
        </p>
        <Link to="/contact" className="inline-flex items-center gap-2 font-semibold text-accent hover:text-primary">
          Contact Able God College <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  </Layout>
);

export default Academics;
