import { Stethoscope, Building2, BookMarked, Check } from "lucide-react";

const pathways = [
  {
    icon: Stethoscope,
    title: "Science & Engineering",
    description: "Students with a Science background may consider further study and careers in areas such as:",
    programs: [
      "Medicine and Health Sciences",
      "Engineering (Civil, Mechanical, Electrical, Chemical)",
      "Computer Science and Information Technology",
      "Pure and Applied Sciences"
    ],
    color: "text-primary"
  },
  {
    icon: Building2,
    title: "Business & Commerce",
    description: "Students with a Commercials background may consider further study and careers in areas such as:",
    programs: [
      "Business Administration and Management",
      "Accounting and Finance",
      "Economics and Development Studies",
      "Marketing and Entrepreneurship",
      "Banking and Investment"
    ],
    color: "text-primary"
  },
  {
    icon: BookMarked,
    title: "Arts & Humanities",
    description: "Students with an Arts background may consider further study and careers in areas such as:",
    programs: [
      "Law and Legal Studies",
      "Education and Teaching",
      "Journalism and Media Studies",
      "International Relations and Politics",
      "Social Sciences and Psychology"
    ],
    color: "text-primary"
  },
];

const UniversityPathwaysSection = () => {
  return (
    <section className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
          <h2 className="font-heading text-3xl font-bold text-primary mb-4">
            Academic Preparation & Pathways
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Possible post-school programmes for Arts, Commercials and Sciences learners.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {pathways.map((pathway, index) => (
            <div 
              key={index}
              className="bg-card rounded-2xl border border-border p-6 hover:shadow-elegant transition-all"
            >
              <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                <pathway.icon className={`h-7 w-7 ${pathway.color}`} />
              </div>
              <h3 className="font-heading text-xl font-bold text-primary mb-3">
                {pathway.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {pathway.description}
              </p>
              <ul className="space-y-2">
                {pathway.programs.map((program, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    <span className="text-foreground">{program}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-primary/15 bg-card p-5 text-center">
          <p className="text-sm leading-relaxed text-muted-foreground">
            These are examples of possible post-school pathways, subject to each institution’s entry requirements. HEXCO courses are separate technical and vocational options; contact the school for current subject combinations and programme guidance.
          </p>
        </div>
      </div>
    </section>
  );
};

export default UniversityPathwaysSection;
