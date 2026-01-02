import debateImage from "@/assets/slide-outdoor-group.webp";
import netballImage from "@/assets/students-sports.webp";
import choirImage from "@/assets/slide-group-class.webp";
import scienceImage from "@/assets/carousel-lab.jpg";

const clubs = [
  {
    image: debateImage,
    title: "Debate Club",
    description: "Our Debate Club hones critical thinking and public speaking. Students engage in lively discussions, building confidence and leadership skills.",
    isLarge: true,
  },
  {
    image: netballImage,
    title: "Netball Team",
    description: "The Netball Team promotes teamwork and physical fitness. Students develop athletic skills and represent the school with pride in competitions.",
  },
  {
    image: choirImage,
    title: "School Choir",
    description: "The School Choir fosters musical talent and teamwork. Students perform at school events, enriching the community with their harmonious voices.",
  },
  {
    image: scienceImage,
    title: "Science Club",
    description: "The Science Club encourages exploration and innovation. Students conduct experiments and participate in science fairs, fostering a love for STEM.",
  },
];

const ClubsSection = () => {
  return (
    <section className="py-16 bg-forest-dark">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
            Clubs & Activities
          </h2>
          <p className="text-white/70 max-w-3xl mx-auto">
            Beyond academics, we nurture talents through diverse extracurricular activities.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {/* Debate Club - Large card on the left */}
          <div className="md:row-span-2 bg-forest-dark/50 rounded-lg overflow-hidden border border-white/10 hover:border-accent/50 transition-all duration-300">
            <div className="h-64 overflow-hidden">
              <img 
                src={clubs[0].image} 
                alt={clubs[0].title} 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-6 text-center">
              <h3 className="font-heading text-xl font-bold text-accent mb-3">
                {clubs[0].title}
              </h3>
              <p className="text-white/80 text-sm leading-relaxed">
                {clubs[0].description}
              </p>
            </div>
          </div>

          {/* Other clubs */}
          {clubs.slice(1).map((club, index) => (
            <div key={index} className="bg-forest-dark/50 rounded-lg overflow-hidden border border-white/10 hover:border-accent/50 transition-all duration-300">
              <div className="h-48 overflow-hidden">
                <img 
                  src={club.image} 
                  alt={club.title} 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-4 text-center">
                <h3 className="font-heading text-lg font-bold text-accent mb-2">
                  {club.title}
                </h3>
                <p className="text-white/80 text-xs leading-relaxed">
                  {club.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ClubsSection;
