import communityImage from "@/assets/IMG_6135.jpg";
import learnerImage from "@/assets/IMG_6140.jpg";
import celebrationImage from "@/assets/IMG_6145.jpg";
import { schoolContact } from "@/lib/schoolContact";

const RemarksSection = () => {
  return (
    <section className="py-16 bg-card">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary mb-6">
              Remarks
            </h2>
            <p className="text-muted-foreground leading-relaxed text-justify">
              It is our pleasure to communicate with you once again. The Lord took us
              through the week without any major challenges. All learners came rejuvenated
              after the break and we are now busy pushing for syllabus coverage and thorough
              revision for all candidates. We are slowly removing candidates from sports and
              clubs to ensure that they have more time for revision and grasp all concepts.
              Parents are urged to support the school by bringing a ream of bond paper for
              those who have not submitted it for this term. Printing has to be done to ensure
              that all revision programs run smoothly to achieve more together in the year 2026.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4 text-justify">
              Located at {schoolContact.address}, Able God College continues to uphold its
              commitment to academic excellence while nurturing
              the holistic development of every learner.
            </p>
          </div>
          <div className="relative">
            <div className="grid h-80 grid-cols-5 grid-rows-2 gap-3 sm:h-96">
              <div className="col-span-3 row-span-2 overflow-hidden rounded-2xl shadow-elegant">
                <img
                  src={communityImage}
                  alt="Able God College community gathered outside the school"
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="col-span-2 overflow-hidden rounded-2xl shadow-elegant">
                <img
                  src={learnerImage}
                  alt="Able God College learner wearing a Class of 2026 shirt"
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="col-span-2 overflow-hidden rounded-2xl shadow-elegant">
                <img
                  src={celebrationImage}
                  alt="Learners celebrating together at Able God College"
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  loading="lazy"
                />
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 h-24 w-24 bg-accent rounded-xl -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default RemarksSection;
