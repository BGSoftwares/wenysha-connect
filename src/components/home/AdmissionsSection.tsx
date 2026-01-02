import { useState } from "react";
import { Button } from "@/components/ui/button";
import AdmissionFormModal from "./AdmissionFormModal";
import heroImage from "@/assets/slide-students-seated.jpeg";

const AdmissionsSection = () => {
  const [showAdmissionForm, setShowAdmissionForm] = useState(false);

  return (
    <>
      {/* Hero Banner */}
      <section className="relative h-64 md:h-80 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/40" />
        <div className="relative z-10 h-full flex items-center justify-center">
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
            Admissions
          </h2>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h3 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-4">
            Wenyasha International School Admissions
          </h3>
          <div className="w-16 h-1 bg-primary mx-auto mb-8" />
          
          <p className="text-muted-foreground max-w-3xl mx-auto mb-6 leading-relaxed">
            Welcome to Wenyasha International School admissions, where academic excellence meets tradition
            and opportunity. Every year, we welcome new learners into our community through a fair and
            transparent admissions process. Whether you are applying for Form One, seeking a
            transfer, or joining us at A-Level (Lower 6), this page provides everything you need to begin
            your journey at Wenyasha International School.
          </p>
          
          <p className="text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
            Our admissions team is committed to maintaining the school's legacy of academic
            achievement, sporting excellence, cultural enrichment, and leadership development. Before
            completing your application, please review all admission requirements carefully.
          </p>
          
          <Button 
            size="lg"
            onClick={() => setShowAdmissionForm(true)}
            className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold shadow-lg shadow-accent/30"
          >
            Apply Now
          </Button>
        </div>
      </section>

      <AdmissionFormModal 
        open={showAdmissionForm} 
        onOpenChange={setShowAdmissionForm} 
      />
    </>
  );
};

export default AdmissionsSection;
