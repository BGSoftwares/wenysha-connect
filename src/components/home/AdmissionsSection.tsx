import { Link } from 'react-router-dom';
import { useState } from "react";
import { Button } from "@/components/ui/button";
import AdmissionFormModal from "./AdmissionFormModal";
import heroImage from "@/assets/sections/img-6270.jpg";

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
            Admissions Enquiries
          </h3>
          <div className="w-16 h-1 bg-primary mx-auto mb-8" />
          
          <p className="text-muted-foreground max-w-3xl mx-auto mb-6 leading-relaxed">
            Contact Able God College to ask about admissions and current enrolment information.
          </p>
          
          <p className="text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
            Send an enquiry using the form and the school can provide the current application details.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button 
              size="lg"
              onClick={() => setShowAdmissionForm(true)}
              className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold shadow-lg shadow-accent/30"
            >
              Send an Enquiry
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground font-bold"
            >
              <Link to="/admissions">View Admissions & Fees</Link>
            </Button>
          </div>
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
