import { GraduationCap, BookOpen, Users, CheckCircle, Award, Trophy } from "lucide-react";
import studentImage from "@/assets/carousel-library.jpg";

const features = [
  {
    icon: GraduationCap,
    title: "Academics",
    description: "We are moving forward to improve these results and we have put in place a number of strategies to ensure that all learners pass the examinations.",
  },
  {
    icon: BookOpen,
    title: "Exams",
    description: "Please be advised that our end of term examinations are on the way. We urge all parents to encourage learners to revise their work.",
  },
  {
    icon: Award,
    title: "Creative Lessons",
    description: "Our classrooms are well equipped with interactive boards and projectors for the upkeep of digital learning.",
  },
  {
    icon: CheckCircle,
    title: "Sufficient Classrooms",
    description: "We have enough classrooms to cater for every student with a student to teacher ratio of 1:25.",
  },
  {
    icon: Users,
    title: "Certified Teachers",
    description: "We have qualified teachers and facilitators to ensure quality delivery of educational service.",
  },
  {
    icon: Trophy,
    title: "Sports Facilities",
    description: "We have well pitched Tennis and Basketball courts for our students' physical development.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Features Grid */}
          <div className="lg:col-span-2 grid sm:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="flex gap-4">
                <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center shrink-0">
                  <feature.icon className="h-6 w-6 text-accent-foreground" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Image */}
          <div className="hidden lg:block">
            <div className="rounded-2xl overflow-hidden shadow-elegant h-full">
              <img 
                src={studentImage} 
                alt="Wenyasha International School student" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
