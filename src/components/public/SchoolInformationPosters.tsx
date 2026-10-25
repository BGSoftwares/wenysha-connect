import {
  BookOpen,
  Clock3,
  Heart,
  ShieldCheck,
  Shirt,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import logo from "/able-god-college-logo.png";
import {
  complaintsCommittee,
  schoolIdentity,
  schoolMission,
  schoolRules,
  schoolVision,
  zimsecPassRates,
} from "@/lib/schoolInformation";

type PosterSection = "mission-vision" | "results" | "rules" | "committee";

const sectionTitles: Record<PosterSection, string> = {
  "mission-vision": "Mission & Vision Statements",
  results: "ZIMSEC Pass Rate",
  rules: "School Rules",
  committee: "Complaints Handling Committee",
};

const ruleIcons: Record<string, LucideIcon> = {
  Attitude: Heart,
  "Discipline in Class": Clock3,
  Uniform: Shirt,
  "School Work": BookOpen,
  Safety: ShieldCheck,
};

interface PosterFrameProps {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

const PosterFrame = ({ title, children, footer }: PosterFrameProps) => (
  <article className="overflow-hidden rounded-2xl border border-primary/15 bg-card shadow-[0_18px_44px_-32px_hsl(224_72%_22%/0.6)]">
    <header className="relative isolate overflow-hidden bg-white px-5 py-5 sm:px-8 sm:py-6">
      <div className="pointer-events-none absolute -right-14 -top-24 h-48 w-48 rounded-full border-[18px] border-accent/15" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-10 right-16 h-20 w-64 rotate-[-9deg] rounded-full bg-accent/10" aria-hidden="true" />
      <div className="relative flex items-center gap-4">
        <span className="flex h-[4.25rem] w-[4.25rem] shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-white p-1.5 shadow-sm sm:h-[4.75rem] sm:w-[4.75rem]">
          <img src={logo} alt="Able God College crest" className="h-full w-full object-contain" />
        </span>
        <div className="min-w-0">
          <p className="font-serif text-lg font-black uppercase leading-tight tracking-wide text-primary sm:text-2xl">{schoolIdentity.name}</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-accent sm:text-sm">{schoolIdentity.motto}</p>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-[#10264f] via-[#283d72] to-[#b51e63]" aria-hidden="true" />
    </header>

    <div className="border-t border-primary/10">
      <div className="bg-gradient-to-r from-[#10264f] via-[#283d72] to-[#b51e63] px-5 py-3.5 text-center sm:px-8">
        <h3 className="font-heading text-lg font-extrabold uppercase tracking-[0.12em] text-white sm:text-xl">{title}</h3>
      </div>
      {children}
    </div>

    {footer && (
      <footer className="border-t-4 border-accent bg-primary px-5 py-3.5 text-center text-sm font-bold uppercase tracking-[0.12em] text-primary-foreground sm:text-base">
        {footer}
      </footer>
    )}
  </article>
);

const MissionVisionPoster = () => (
  <div className="grid gap-5 bg-background/70 p-5 sm:p-7 lg:grid-cols-2">
    {[
      { title: "Mission Statement", text: schoolMission },
      { title: "Vision Statement", text: schoolVision },
    ].map((item) => (
      <section key={item.title} className="relative overflow-hidden border border-primary/15 bg-white px-5 pb-6 pt-7 shadow-sm sm:px-7 sm:pb-8">
        <div className="absolute inset-x-0 top-0 h-2 bg-accent" aria-hidden="true" />
        <h4 className="mx-auto mb-5 w-fit rounded-md bg-accent px-5 py-2.5 text-center text-sm font-extrabold uppercase tracking-[0.12em] text-white sm:text-base">
          {item.title}
        </h4>
        <p className="text-center font-semibold leading-relaxed text-primary sm:text-lg">{item.text}</p>
      </section>
    ))}
  </div>
);

const formatRate = (value: number) => `${value.toFixed(1).replace(".", ",")}%`;

const ResultsPoster = () => (
  <div className="bg-background/70 p-5 sm:p-7">
    <div className="mx-auto mb-6 grid max-w-xl grid-cols-2 overflow-hidden rounded-lg border border-primary/15 text-center text-xs font-extrabold uppercase tracking-[0.12em] sm:text-sm">
      <span className="bg-primary px-3 py-3 text-primary-foreground">2024 ZIMSEC Pass Rate</span>
      <span className="bg-accent px-3 py-3 text-accent-foreground">2025 ZIMSEC Pass Rate</span>
    </div>
    <div className="grid gap-4 md:grid-cols-3">
      {zimsecPassRates.map((result) => (
        <article key={result.group} className="overflow-hidden border border-primary/15 bg-white shadow-sm">
          <h4 className="border-b border-primary/10 bg-white px-4 py-3 text-center font-heading text-lg font-extrabold uppercase tracking-[0.12em] text-primary">
            {result.group}
          </h4>
          <div className="grid grid-cols-2 gap-4 px-5 pb-5 pt-4">
            {[
              { year: "2024", value: result.rate2024, color: "bg-primary" },
              { year: "2025", value: result.rate2025, color: "bg-accent" },
            ].map((rate) => (
              <div key={rate.year} className="flex flex-col items-center">
                <span className="mb-2 text-sm font-extrabold text-primary">{formatRate(rate.value)}</span>
                <div className="flex h-36 w-full items-end justify-center border-b border-primary/20">
                  <div
                    className={`w-14 rounded-t-md ${rate.color} sm:w-16`}
                    style={{ height: `${Math.max(rate.value, 12)}%` }}
                    role="img"
                    aria-label={`${result.group} ${rate.year} pass rate: ${formatRate(rate.value)}`}
                  />
                </div>
                <span className="mt-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">{rate.year}</span>
              </div>
            ))}
          </div>
          <p className="border-t border-emerald-100 bg-emerald-50 px-3 py-3 text-center text-sm font-extrabold uppercase tracking-wide text-emerald-800">
            Improvement <span className="ml-1">↑ +{formatRate(result.improvement)}</span>
          </p>
        </article>
      ))}
    </div>
  </div>
);

const SchoolRulesPoster = () => (
  <div className="bg-background/70 p-5 sm:p-7">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {schoolRules.map((category) => {
        const Icon = ruleIcons[category.title];
        return (
          <article key={category.title} className="overflow-hidden border border-primary/15 bg-white shadow-sm">
            <h4 className="flex min-h-14 items-center gap-3 bg-primary px-4 py-3 text-sm font-extrabold uppercase tracking-wide text-primary-foreground">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              {category.title}
            </h4>
            <ul className="space-y-3 p-4">
              {category.rules.map((rule) => (
                <li key={rule} className="flex gap-2 text-sm font-semibold leading-snug text-primary">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </article>
        );
      })}
    </div>
  </div>
);

const ComplaintsCommitteePoster = () => (
  <div className="bg-background/70 p-5 sm:p-7">
    <div className="bg-primary p-5 text-primary-foreground sm:p-7">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Chairperson", complaintsCommittee.chairperson],
          ["Vice Chair", complaintsCommittee.viceChair],
          ["Secretary", complaintsCommittee.secretary],
        ].map(([role, name]) => (
          <div key={role} className="border border-white/15 bg-white/5 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">{role}</p>
            <p className="mt-1 text-lg font-semibold">{name}</p>
          </div>
        ))}
      </div>
      <h4 className="mt-6 border-b border-accent/60 pb-2 font-serif text-xl font-bold uppercase tracking-wide text-white">Committee Members</h4>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {complaintsCommittee.members.map((member, index) => (
          <li key={member} className="border border-white/10 bg-white/5 px-4 py-3 font-semibold">{index + 1}. {member}</li>
        ))}
      </ul>
    </div>
  </div>
);

const posterContent: Record<PosterSection, () => JSX.Element> = {
  "mission-vision": MissionVisionPoster,
  results: ResultsPoster,
  rules: SchoolRulesPoster,
  committee: ComplaintsCommitteePoster,
};

interface SchoolInformationPostersProps {
  sections?: PosterSection[];
  className?: string;
}

const SchoolInformationPosters = ({
  sections = ["mission-vision", "results", "rules", "committee"],
  className = "",
}: SchoolInformationPostersProps) => (
  <section className={`bg-background py-14 md:py-20 ${className}`} aria-label="Able God College official information">
    <div className="container mx-auto max-w-7xl space-y-7 px-4">
      {sections.map((section) => {
        const Content = posterContent[section];
        const footer = section === "results" ? (
          <span>Rising Together. Achieving Excellence. <span className="text-accent">The Best Is Ahead!</span></span>
        ) : section === "rules" ? (
          <span>Honour God <span className="mx-2 text-accent">•</span> Respect Others <span className="mx-2 text-accent">•</span> Excel in All You Do</span>
        ) : null;

        return (
          <PosterFrame key={section} title={sectionTitles[section]} footer={footer}>
            <Content />
          </PosterFrame>
        );
      })}
    </div>
  </section>
);

export default SchoolInformationPosters;
