import { Mail, Phone } from "lucide-react";
import chrisWenyasha from "@/assets/chris_wenyasha.jpg";
import africaDay from "@/assets/africa_day_wenyasha.jpg";

interface StaffMember {
  name: string;
  role: string;
  department: string;
  bio: string;
  image: string | null;
  email?: string;
}

const leadership: StaffMember[] = [
  {
    name: "Mr. Christopher Moyo",
    role: "School Director",
    department: "Administration",
    bio: "A visionary leader with over 20 years in education, Mr. Moyo founded Wenyasha International School with a mission to provide world-class education in Zimbabwe.",
    image: chrisWenyasha,
    email: "director@wenyasha.edu.zw"
  },
  {
    name: "Mrs. Grace Chikwanda",
    role: "Head of Academics",
    department: "Academic Affairs",
    bio: "With a Masters in Education from the University of Zimbabwe, Mrs. Chikwanda oversees curriculum development for both ZIMSEC and Cambridge programmes.",
    image: africaDay,
    email: "academics@wenyasha.edu.zw"
  },
];

const departmentHeads: StaffMember[] = [
  {
    name: "Mr. Tinashe Mutasa",
    role: "Head of Sciences",
    department: "Science Department",
    bio: "A passionate educator specializing in Physics and Chemistry, preparing students for ZIMSEC and Cambridge examinations.",
    image: null,
  },
  {
    name: "Mrs. Rudo Manyika",
    role: "Head of Languages",
    department: "Languages Department",
    bio: "Expert in English Literature and Shona, fostering bilingual excellence in our students.",
    image: null,
  },
  {
    name: "Mr. Peter Mukucha",
    role: "Head of Sports & PE",
    department: "Sports Department",
    bio: "Former national athlete bringing professional training methods to develop well-rounded student athletes.",
    image: null,
  },
  {
    name: "Ms. Florence Ncube",
    role: "Head of Arts",
    department: "Creative Arts",
    bio: "Award-winning artist nurturing creativity through visual arts, music, and drama programmes.",
    image: null,
  },
  {
    name: "Mr. David Zimuto",
    role: "Head of Mathematics",
    department: "Mathematics Department",
    bio: "Mathematics olympiad coach with proven track record in ZIMSEC and Cambridge A-Level results.",
    image: null,
  },
  {
    name: "Mrs. Patricia Hwata",
    role: "Head of Humanities",
    department: "Humanities Department",
    bio: "Historian and geography expert bringing real-world context to social studies education.",
    image: null,
  },
];

const StaffDirectory = () => {
  return (
    <section className="py-20 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl font-bold text-foreground mb-4">
            Our Leadership & Staff
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Meet the dedicated professionals who make Wenyasha International School a centre of excellence.
          </p>
        </div>

        {/* Leadership Team */}
        <div className="mb-16">
          <h3 className="font-heading text-xl font-semibold text-primary text-center mb-8">
            School Leadership
          </h3>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {leadership.map((member, index) => (
              <div 
                key={index}
                className="bg-background rounded-2xl border border-border p-6 hover:shadow-elegant transition-all group"
              >
                <div className="flex gap-5">
                  <div className="shrink-0">
                    {member.image ? (
                      <img 
                        src={member.image} 
                        alt={member.name}
                        className="h-24 w-24 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="h-24 w-24 rounded-xl bg-primary/10 flex items-center justify-center">
                        <span className="text-3xl font-bold text-primary">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-heading font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                      {member.name}
                    </h4>
                    <p className="text-accent font-medium text-sm">{member.role}</p>
                    <p className="text-xs text-muted-foreground mb-2">{member.department}</p>
                    <p className="text-sm text-muted-foreground">{member.bio}</p>
                    {member.email && (
                      <a 
                        href={`mailto:${member.email}`}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                      >
                        <Mail className="h-3 w-3" />
                        {member.email}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Department Heads */}
        <div>
          <h3 className="font-heading text-xl font-semibold text-primary text-center mb-8">
            Department Heads
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {departmentHeads.map((member, index) => (
              <div 
                key={index}
                className="bg-background rounded-xl border border-border p-5 hover:border-primary/30 hover:shadow-elegant transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0">
                    {member.image ? (
                      <img 
                        src={member.image} 
                        alt={member.name}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-lg bg-secondary flex items-center justify-center">
                        <span className="text-lg font-bold text-primary">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-heading font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {member.name}
                    </h4>
                    <p className="text-accent text-sm font-medium">{member.role}</p>
                    <p className="text-xs text-muted-foreground">{member.department}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-3">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StaffDirectory;
