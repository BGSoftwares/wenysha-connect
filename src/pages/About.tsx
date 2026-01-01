import { Layout } from "@/components/layout/Layout";
import { BookOpen, GraduationCap, Award, Users, Target, Heart } from "lucide-react";
import logo from "@/assets/wenyasha-logo.jpg";

const values = [
  { icon: Target, title: "Excellence", description: "Striving for the highest standards in all endeavors." },
  { icon: Heart, title: "Integrity", description: "Upholding honesty and strong moral principles." },
  { icon: Users, title: "Community", description: "Fostering a sense of belonging and mutual support." },
  { icon: BookOpen, title: "Innovation", description: "Embracing creativity and forward-thinking approaches." },
];

const achievements = [
  "National Mathematics Olympiad Champions 2025",
  "Best Private School Award - Harare Province",
  "100% Pass Rate in O-Level Examinations",
  "Regional Debate Championship Winners",
  "Excellence in Sports - Inter-School Athletics",
];

const staff = [
  { name: "Dr. Sarah Moyo", role: "Principal", image: null },
  { name: "Mr. John Ndlovu", role: "Deputy Principal", image: null },
  { name: "Mrs. Grace Chikwanda", role: "Head of Academics", image: null },
  { name: "Mr. Peter Mukucha", role: "Head of Sports", image: null },
];

const About = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <img 
            src={logo} 
            alt="Wenyasha Logo" 
            className="h-32 w-32 object-contain mx-auto mb-6 bg-card rounded-2xl p-3"
          />
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
            About Wenyasha
          </h1>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            Smart • Innovative • Infinite
          </p>
        </div>
      </section>

      {/* History & Mission */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-heading text-3xl font-bold text-foreground mb-6">
                Our Story
              </h2>
              <p className="text-muted-foreground mb-4">
                Founded with a vision to provide world-class education in Zimbabwe, 
                Wenyasha International School has grown from humble beginnings to become 
                one of the most respected educational institutions in the region.
              </p>
              <p className="text-muted-foreground mb-4">
                Our name "Wenyasha" reflects our commitment to grace and excellence 
                in everything we do. We believe every child has infinite potential 
                waiting to be unlocked through quality education.
              </p>
              <p className="text-muted-foreground">
                Today, we serve hundreds of students from diverse backgrounds, 
                united by their pursuit of knowledge and personal growth.
              </p>
            </div>
            <div className="bg-secondary/50 rounded-2xl p-8">
              <h3 className="font-heading text-2xl font-bold text-foreground mb-4">
                Our Mission
              </h3>
              <p className="text-muted-foreground mb-6">
                To nurture innovative, responsible, and globally-minded individuals 
                through a holistic education that balances academic excellence with 
                character development.
              </p>
              <h3 className="font-heading text-2xl font-bold text-foreground mb-4">
                Our Vision
              </h3>
              <p className="text-muted-foreground">
                To be the leading international school in Africa, recognized for 
                producing graduates who make meaningful contributions to society.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Principal's Message */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-heading text-3xl font-bold text-foreground mb-8">
              Principal's Message
            </h2>
            <div className="bg-card rounded-2xl p-8 md:p-12 border border-border shadow-elegant">
              <div className="h-24 w-24 rounded-full bg-primary/10 mx-auto mb-6 flex items-center justify-center">
                <GraduationCap className="h-12 w-12 text-primary" />
              </div>
              <blockquote className="text-lg text-muted-foreground italic mb-6">
                "At Wenyasha International School, we believe that education is not just 
                about acquiring knowledge, but about developing the whole person. Our 
                commitment is to provide an environment where every student can discover 
                their unique talents and reach their full potential."
              </blockquote>
              <p className="font-heading font-semibold text-foreground">Dr. Sarah Moyo</p>
              <p className="text-sm text-muted-foreground">Principal</p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-3xl font-bold text-foreground text-center mb-12">
            Our Core Values
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div 
                key={index}
                className="text-center p-6 rounded-xl bg-card border border-border hover:border-accent/30 transition-all"
              >
                <div className="h-16 w-16 rounded-full bg-accent/10 mx-auto mb-4 flex items-center justify-center">
                  <value.icon className="h-8 w-8 text-accent" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
                  {value.title}
                </h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Staff Directory */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-3xl font-bold text-foreground text-center mb-12">
            Leadership Team
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {staff.map((member, index) => (
              <div key={index} className="text-center">
                <div className="h-32 w-32 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-12 w-12 text-primary/50" />
                </div>
                <h3 className="font-heading font-semibold text-foreground">{member.name}</h3>
                <p className="text-sm text-muted-foreground">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-3xl font-bold text-primary-foreground text-center mb-12">
            Our Achievements
          </h2>
          <div className="max-w-2xl mx-auto">
            {achievements.map((achievement, index) => (
              <div 
                key={index}
                className="flex items-center gap-4 p-4 rounded-lg bg-primary-foreground/5 mb-3"
              >
                <Award className="h-6 w-6 text-accent shrink-0" />
                <span className="text-primary-foreground">{achievement}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default About;
