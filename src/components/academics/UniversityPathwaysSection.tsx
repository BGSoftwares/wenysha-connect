import { Stethoscope, Building2, BookMarked, Check } from "lucide-react";

const pathways = [
  {
    icon: Stethoscope,
    title: "Science & Engineering",
    description: "Our science program prepares students for careers in medicine, engineering, computer science, and research. Graduates gain admission to top programs in:",
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
    description: "Commercial students develop skills for careers in business, finance, and economics, with pathways to:",
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
    description: "Arts students pursue careers in law, education, media, and public service through:",
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
            University Pathways
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our dual ZIMSEC and Cambridge curriculum opens doors to universities locally and internationally.
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

        {/* University Partners Note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            Our graduates have been accepted to universities including <span className="font-medium text-foreground">University of Zimbabwe</span>,{" "}
            <span className="font-medium text-foreground">NUST</span>,{" "}
            <span className="font-medium text-foreground">University of Cape Town</span>,{" "}
            <span className="font-medium text-foreground">Oxford</span>, and many more.
          </p>
        </div>
      </div>
    </section>
  );
};

export default UniversityPathwaysSection;
