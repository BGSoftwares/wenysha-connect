import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const AdmissionsSection = () => {
  return (
    <section className="py-16 bg-secondary/30">
      <div className="container mx-auto px-4 text-center">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-6">
          Admissions 2026
        </h2>
        <p className="text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
          At Wenyasha International School, "Smart • Innovative • Infinite" is more than just a motto; 
          it is the spirit that drives us. From the classroom to the sports field, from cultural excellence 
          to leadership, we believe every learner carries the power to achieve greatness and leave a 
          lasting mark on the world. Located in Sikato, Great Zimbabwe Road, Masvingo, Zimbabwe.
        </p>
        <Button variant="default" size="lg" asChild>
          <Link to="/contact">Apply Now</Link>
        </Button>
      </div>
    </section>
  );
};

export default AdmissionsSection;
