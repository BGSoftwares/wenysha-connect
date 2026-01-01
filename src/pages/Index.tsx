import { Link } from "react-router-dom";
import { ArrowRight, GraduationCap, Users, Award, Calendar, BookOpen, Image, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import heroImage from "@/assets/hero-school.jpg";
import logo from "@/assets/wenyasha-logo.jpg";

const features = [
  {
    icon: GraduationCap,
    title: "Academic Excellence",
    description: "Comprehensive curriculum designed to nurture critical thinking and creativity.",
  },
  {
    icon: Users,
    title: "Expert Faculty",
    description: "Dedicated teachers committed to bringing out the best in every student.",
  },
  {
    icon: Award,
    title: "Proven Results",
    description: "Consistently outstanding performance in national and international examinations.",
  },
];

const quickLinks = [
  { icon: BookOpen, title: "Academics", description: "Explore our curriculum", path: "/academics" },
  { icon: Image, title: "Gallery", description: "View school memories", path: "/gallery" },
  { icon: Bell, title: "Announcements", description: "Latest updates", path: "/announcements" },
  { icon: Calendar, title: "Events", description: "Upcoming activities", path: "/announcements" },
];

const upcomingEvents = [
  { date: "Jan 15", title: "New Term Begins", type: "Academic" },
  { date: "Jan 22", title: "Parent-Teacher Meeting", type: "Meeting" },
  { date: "Feb 5", title: "Inter-School Sports Day", type: "Sports" },
  { date: "Feb 14", title: "Science Fair", type: "Academic" },
];

const newsHighlights = [
  {
    title: "Students Excel in National Mathematics Olympiad",
    excerpt: "Our students secured top positions in the 2025 National Mathematics Olympiad.",
    date: "Dec 20, 2025",
  },
  {
    title: "New Computer Lab Inaugurated",
    excerpt: "State-of-the-art computer laboratory with 50 workstations now open.",
    date: "Dec 15, 2025",
  },
  {
    title: "Annual Sports Day Success",
    excerpt: "Record participation and outstanding performances at this year's sports day.",
    date: "Dec 10, 2025",
  },
];

const Index = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-forest-dark/95 via-forest-dark/80 to-forest-dark/40" />
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl animate-slide-up">
            <div className="flex items-center gap-4 mb-6">
              <img 
                src={logo} 
                alt="Wenyasha Logo" 
                className="h-20 w-20 object-contain bg-card rounded-xl p-2 shadow-lg"
              />
              <div>
                <p className="text-accent font-semibold tracking-wider uppercase text-sm">
                  Welcome to
                </p>
                <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground">
                  Wenyasha International School
                </h1>
              </div>
            </div>
            
            <p className="text-xl md:text-2xl text-primary-foreground/90 mb-4 font-heading italic">
              Smart • Innovative • Infinite
            </p>
            
            <p className="text-lg text-primary-foreground/80 mb-8 max-w-xl">
              Nurturing future leaders through excellence in education. Join our community 
              of learners and discover your infinite potential.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button variant="hero" size="xl" asChild>
                <Link to="/portal">
                  Access Portal
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline-light" size="xl" asChild>
                <Link to="/about">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose Wenyasha?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We provide a nurturing environment where students thrive academically, 
              socially, and personally.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group p-8 rounded-2xl bg-background border border-border hover:border-accent/50 hover:shadow-elegant transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="h-14 w-14 rounded-xl bg-accent/10 flex items-center justify-center mb-6 group-hover:bg-accent group-hover:scale-110 transition-all duration-300">
                  <feature.icon className="h-7 w-7 text-accent group-hover:text-accent-foreground transition-colors" />
                </div>
                <h3 className="font-heading text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="py-20 bg-secondary/50">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-3xl font-bold text-foreground text-center mb-12">
            Quick Access
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickLinks.map((link, index) => (
              <Link
                key={index}
                to={link.path}
                className="group p-6 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-elegant transition-all duration-300"
              >
                <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <link.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-foreground mb-1">
                  {link.title}
                </h3>
                <p className="text-sm text-muted-foreground">{link.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Events & News Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Upcoming Events */}
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-heading text-2xl font-bold text-foreground">
                  Upcoming Events
                </h2>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/announcements">
                    View All <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="space-y-4">
                {upcomingEvents.map((event, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-4 p-4 rounded-xl bg-background border border-border hover:border-accent/30 transition-all"
                  >
                    <div className="h-14 w-14 rounded-lg bg-accent flex flex-col items-center justify-center text-accent-foreground shrink-0">
                      <span className="text-xs font-medium">{event.date.split(" ")[0]}</span>
                      <span className="text-lg font-bold">{event.date.split(" ")[1]}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{event.title}</h4>
                      <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                        {event.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* News Highlights */}
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-heading text-2xl font-bold text-foreground">
                  News Highlights
                </h2>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/announcements">
                    View All <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="space-y-4">
                {newsHighlights.map((news, index) => (
                  <div 
                    key={index}
                    className="p-5 rounded-xl bg-background border border-border hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer"
                  >
                    <p className="text-xs text-accent font-medium mb-2">{news.date}</p>
                    <h4 className="font-semibold text-foreground mb-2">{news.title}</h4>
                    <p className="text-sm text-muted-foreground">{news.excerpt}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Join Our Community?
          </h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
            Take the first step towards an exceptional education. 
            Contact us today to learn more about admissions.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="hero" size="lg" asChild>
              <Link to="/contact">Contact Us</Link>
            </Button>
            <Button variant="outline-light" size="lg" asChild>
              <Link to="/about">About Our School</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
