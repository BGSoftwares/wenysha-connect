import { Layout } from "@/components/layout/Layout";
import { BookOpen, Calculator, FlaskConical, Globe, Music, Dumbbell, Laptop, Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const subjects = [
  { icon: Calculator, name: "Mathematics", description: "Advanced mathematical concepts and problem-solving skills." },
  { icon: FlaskConical, name: "Sciences", description: "Physics, Chemistry, and Biology with practical experiments." },
  { icon: BookOpen, name: "Languages", description: "English, Shona, and French language programs." },
  { icon: Globe, name: "Humanities", description: "History, Geography, and Social Studies." },
  { icon: Laptop, name: "Computer Science", description: "Programming, digital literacy, and IT skills." },
  { icon: Music, name: "Creative Arts", description: "Music, Art, Drama, and Design." },
];

const resources = [
  { title: "Mathematics Notes - Grade 7", subject: "Mathematics", type: "PDF", size: "2.3 MB" },
  { title: "Science Practical Guide", subject: "Sciences", type: "PDF", size: "4.1 MB" },
  { title: "English Grammar Workbook", subject: "Languages", type: "PDF", size: "1.8 MB" },
  { title: "History Timeline Charts", subject: "Humanities", type: "PDF", size: "3.2 MB" },
];

const gradingScale = [
  { grade: "A", range: "80-100%", description: "Excellent" },
  { grade: "B", range: "70-79%", description: "Very Good" },
  { grade: "C", range: "60-69%", description: "Good" },
  { grade: "D", range: "50-59%", description: "Satisfactory" },
  { grade: "E", range: "40-49%", description: "Pass" },
  { grade: "U", range: "0-39%", description: "Ungraded" },
];

const Academics = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
            Academic Programs
          </h1>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            Comprehensive curriculum designed to prepare students for success in a global world.
          </p>
        </div>
      </section>

      {/* Curriculum Overview */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl font-bold text-foreground mb-4">
              Our Curriculum
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We follow the Cambridge International Curriculum, enhanced with local 
              content to provide a well-rounded education.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((subject, index) => (
              <div 
                key={index}
                className="p-6 rounded-xl bg-background border border-border hover:border-primary/30 hover:shadow-elegant transition-all group"
              >
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
                  <subject.icon className="h-7 w-7 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
                  {subject.name}
                </h3>
                <p className="text-muted-foreground text-sm">{subject.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Grading System */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-heading text-3xl font-bold text-foreground text-center mb-12">
              Grading System
            </h2>
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="grid grid-cols-3 bg-primary text-primary-foreground p-4 font-semibold">
                <span>Grade</span>
                <span>Percentage</span>
                <span>Description</span>
              </div>
              {gradingScale.map((item, index) => (
                <div 
                  key={index}
                  className={`grid grid-cols-3 p-4 ${index % 2 === 0 ? 'bg-secondary/30' : 'bg-card'}`}
                >
                  <span className="font-bold text-accent text-lg">{item.grade}</span>
                  <span className="text-foreground">{item.range}</span>
                  <span className="text-muted-foreground">{item.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Resources & Downloads */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-3xl font-bold text-foreground text-center mb-4">
            Learning Resources
          </h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
            Access study materials, lecture notes, and resources shared by our teachers.
            Login to the portal to download or submit assignments.
          </p>

          <div className="max-w-3xl mx-auto space-y-4">
            {resources.map((resource, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-5 rounded-xl bg-card border border-border hover:border-primary/30 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{resource.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {resource.subject} • {resource.type} • {resource.size}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <p className="text-muted-foreground mb-4">
              Need to submit an assignment?
            </p>
            <Button variant="gold" asChild>
              <a href="/portal">
                <Upload className="h-4 w-4 mr-2" />
                Login to Portal
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Extra-curricular */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-3xl font-bold text-foreground text-center mb-12">
            Extra-Curricular Activities
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Dumbbell, name: "Sports", items: ["Soccer", "Basketball", "Athletics", "Swimming"] },
              { icon: Music, name: "Arts", items: ["Choir", "Drama Club", "Art Club", "Dance"] },
              { icon: Laptop, name: "Clubs", items: ["Coding Club", "Debate Club", "Chess Club", "Robotics"] },
              { icon: Globe, name: "Community", items: ["Environmental Club", "Outreach", "Leadership", "Scouts"] },
            ].map((category, index) => (
              <div key={index} className="p-6 rounded-xl bg-background border border-border">
                <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <category.icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-heading font-semibold text-foreground mb-3">{category.name}</h3>
                <ul className="space-y-1">
                  {category.items.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground">• {item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Academics;
