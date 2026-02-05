import { Award, BookOpen, Building2, Trophy } from "lucide-react";

const highlights = [
  {
    icon: Award,
    title: "A Registered College",
    description: "Wenyasha International School is a private learning institution registered as a full time Cambridge international school.",
  },
  {
    icon: BookOpen,
    title: "Accredited Courses",
    description: "We offer a range of nationally and internationally accredited qualifications and courses.",
  },
  {
    icon: Building2,
    title: "State Of Art Facilities",
    description: "Our facilities have been designed specifically to match international standards, equipping students with the best resources.",
  },
  {
    icon: Trophy,
    title: "Competitive Sport",
    description: "We nurture and encourage all sports by giving students adequate training and exposure.",
  },
];

const HighlightsSection = () => {
  return (
    <section className="py-0">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4">
        {highlights.map((highlight, index) => (
          <div 
            key={index}
            className={`p-8 text-center ${
              index % 2 === 0 ? "bg-primary" : "bg-primary/90"
            }`}
          >
            <div className="h-16 w-16 rounded-full border-2 border-primary-foreground/30 flex items-center justify-center mx-auto mb-4">
              <highlight.icon className="h-8 w-8 text-primary-foreground" />
            </div>
            <h3 className="font-heading text-lg font-semibold text-primary-foreground mb-3">
              {highlight.title}
            </h3>
            <p className="text-sm text-primary-foreground/80 leading-relaxed">
              {highlight.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HighlightsSection;
