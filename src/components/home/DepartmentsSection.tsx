import scienceImage from "@/assets/carousel-lab.jpg";
import humanitiesImage from "@/assets/slide-outdoor-group.webp";
import mathImage from "@/assets/students-computer.webp";
import { Button } from "@/components/ui/button";

const departments = [
  {
    image: scienceImage,
    title: "Science and Technology: Exploring the World Around Us",
    description: "Our science department offers a wide range of subjects, including Biology, Chemistry, and Physics, providing students with hands-on experience and a deep understanding of scientific principles. We encourage innovation and critical thinking.",
  },
  {
    image: humanitiesImage,
    title: "Humanities: Understanding Culture and Society",
    description: "Our humanities department offers subjects such as History, Geography, and Literature, fostering critical thinking, analytical skills, and a deep understanding of diverse cultures and societies. We encourage students to engage with the world around them.",
    hasButton: true,
  },
  {
    image: mathImage,
    title: "Mathematics and Computing: Building Essential Skills",
    description: "Our mathematics and computing department offers subjects such as Mathematics, Further Mathematics, and Computer Science, equipping students with essential skills for the digital age. We encourage problem-solving and logical reasoning.",
  },
];

const DepartmentsSection = () => {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            Our Curriculum
          </h2>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            We follow the ZIMSEC and Cambridge International Curriculum, enhanced with local content to provide a well-rounded education.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {departments.map((dept, index) => (
            <div key={index} className="bg-card rounded-lg overflow-hidden shadow-elegant border border-border hover:shadow-lg transition-all duration-300">
              <div className="h-48 overflow-hidden">
                <img 
                  src={dept.image} 
                  alt={dept.title} 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <h3 className="font-heading text-xl font-bold text-foreground mb-3">
                  {dept.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  {dept.description}
                </p>
                {dept.hasButton && (
                  <Button 
                    variant="outline" 
                    className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                  >
                    Learn More
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DepartmentsSection;
