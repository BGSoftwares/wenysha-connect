import { Award, BookOpen, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { schoolIdentity, schoolMission, schoolRules } from "@/lib/schoolInformation";

const highlights = [
  {
    icon: Heart,
    title: "Safe & Inclusive",
    description: "Every student can thrive academically, socially and emotionally.",
  },
  {
    icon: BookOpen,
    title: "School Work",
    description: schoolRules.find((category) => category.title === "School Work")?.rules[2] ?? "Do your best in all subjects",
  },
  {
    icon: Award,
    title: "ZIMSEC Results",
    description: "Compare the 2024 and 2025 pass rates by boys, girls and overall.",
    href: "/academics",
  },
];

const SchoolHighlightsSection = () => (
  <section className="bg-primary py-14 text-primary-foreground">
    <div className="container mx-auto px-4">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-accent">{schoolIdentity.name}</p>
          <h2 className="mt-2 font-heading text-3xl font-bold">{schoolIdentity.motto}</h2>
        </div>
        <p className="max-w-xl text-sm leading-relaxed text-primary-foreground/80">{schoolMission}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {highlights.map((item) => {
          const Icon = item.icon;
          const content = (
            <>
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-accent">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <span>
                <span className="block font-heading text-lg font-semibold">{item.title}</span>
                <span className="mt-1 block text-sm leading-relaxed text-primary-foreground/80">{item.description}</span>
              </span>
            </>
          );

          return item.href ? (
            <Link key={item.title} to={item.href} className="flex gap-4 rounded-xl border border-white/10 bg-white/5 p-5 transition hover:border-accent/50 hover:bg-white/10">
              {content}
            </Link>
          ) : (
            <article key={item.title} className="flex gap-4 rounded-xl border border-white/10 bg-white/5 p-5">
              {content}
            </article>
          );
        })}
      </div>
    </div>
  </section>
);

export default SchoolHighlightsSection;
