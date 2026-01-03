import { Calculator, FlaskConical, BookOpen, Globe, Laptop, Languages, Microscope, PenTool } from "lucide-react";

const coreSubjects = [
  { icon: Calculator, name: "Mathematics", description: "Pure Mathematics, Additional Mathematics, Statistics" },
  { icon: BookOpen, name: "English Language", description: "Language skills, comprehension, essay writing" },
  { icon: Languages, name: "Shona/Ndebele", description: "Indigenous language and cultural studies" },
  { icon: FlaskConical, name: "Integrated Science", description: "Foundation for Physics, Chemistry, Biology" },
  { icon: Globe, name: "Geography", description: "Physical and human geography studies" },
  { icon: PenTool, name: "History", description: "African and world history perspectives" },
  { icon: Laptop, name: "Computer Science", description: "ICT, programming, digital literacy" },
  { icon: Microscope, name: "Combined Science", description: "Practical laboratory skills and theory" },
];

const CoreSubjectsSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl font-bold text-primary mb-4">
            Core Subjects
          </h2>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            At Wenyasha International School, our O-Level curriculum offers a broad and balanced foundation following the{" "}
            <span className="font-semibold text-primary">Cambridge International Examinations (CIE)</span> and{" "}
            <span className="font-semibold text-accent">ZIMSEC</span> syllabi.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {coreSubjects.map((subject, index) => (
            <div 
              key={index}
              className="p-5 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-elegant transition-all group"
            >
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
                <subject.icon className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-colors" />
              </div>
              <h3 className="font-heading font-semibold text-foreground mb-1">
                {subject.name}
              </h3>
              <p className="text-sm text-muted-foreground">{subject.description}</p>
            </div>
          ))}
        </div>

        {/* Dual Curriculum Badge */}
        <div className="mt-12 flex justify-center">
          <div className="inline-flex items-center gap-4 px-6 py-3 rounded-full bg-secondary border border-border">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-primary"></div>
              <span className="text-sm font-medium text-foreground">ZIMSEC Accredited</span>
            </div>
            <div className="h-4 w-px bg-border"></div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-accent"></div>
              <span className="text-sm font-medium text-foreground">Cambridge International</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CoreSubjectsSection;
