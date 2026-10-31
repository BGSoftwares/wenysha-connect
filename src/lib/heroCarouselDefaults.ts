import s6252 from "@/assets/slides/slide-6252.jpeg";
import s6255 from "@/assets/slides/slide-6255.jpeg";
import s6256 from "@/assets/slides/slide-6256.jpeg";
import s6254 from "@/assets/slides/slide-6254.jpeg";
import s6258 from "@/assets/slides/slide-6258.jpeg";
import s6259 from "@/assets/slides/slide-6259.jpeg";
import s6260 from "@/assets/slides/slide-6260.jpeg";
import s6262 from "@/assets/slides/slide-6262.jpeg";
import s6263 from "@/assets/slides/slide-6263.jpeg";
import s6264 from "@/assets/slides/slide-6264.jpeg";
import communityGroup1 from "@/assets/new-school-media/school-community-group-1.jpeg";
import communityGroup2 from "@/assets/new-school-media/school-community-group-2.jpeg";
import communityGroup3 from "@/assets/new-school-media/school-community-group-3.jpeg";
import communityGroup4 from "@/assets/new-school-media/school-community-group-4.jpeg";
import preparationProgram from "@/assets/new-school-media/grade7-form1-preparation.jpeg";
import communityGathering from "@/assets/new-school-media/school-community-gathering.jpeg";
import groupOfSchools from "@/assets/new-school-media/group-of-schools-flyer.jpeg";
import schoolAssembly from "@/assets/new-school-media/school-assembly.jpeg";
import examWishesShirt from "@/assets/new-school-media/exam-wishes-shirt.jpeg";
import communityCelebration from "@/assets/new-school-media/school-community-celebration.jpeg";
import novemberExams from "@/assets/new-school-media/november-2026-exams-poster.jpeg";

export type HeroCarouselSlide = {
  image: string;
  title: string;
  description: string;
  fit: "cover" | "contain";
};

export const defaultHeroSlides: HeroCarouselSlide[] = [
  { image: s6252, title: "Learners gathered at assembly", description: "Able God College learners in uniform at morning assembly.", fit: "cover" },
  { image: s6255, title: "Our learners", description: "Learners standing together on the school grounds.", fit: "cover" },
  { image: s6256, title: "Proud in pink and navy", description: "Able God College learners in full uniform.", fit: "cover" },
  { image: s6254, title: "School gathering", description: "Learners gathered around the Able God College banner.", fit: "cover" },
  { image: s6258, title: "Prize giving", description: "A staff member speaks with a learner on stage.", fit: "contain" },
  { image: s6259, title: "Celebrating achievement", description: "Staff and learners at an awards ceremony.", fit: "cover" },
  { image: s6260, title: "Staff and community", description: "Staff and guests celebrating together.", fit: "cover" },
  { image: s6262, title: "Celebration day", description: "The school community singing together.", fit: "cover" },
  { image: s6263, title: "Joyful moments", description: "Staff and guests clapping during celebrations.", fit: "cover" },
  { image: s6264, title: "Together as one", description: "Staff, learners and guests standing together.", fit: "cover" },
  { image: communityGroup1, title: "Able God College community", description: "Learners and staff gathered outdoors for a school group photograph.", fit: "cover" },
  { image: communityGroup2, title: "Learners and staff together", description: "Able God College learners and teachers standing together in school uniform.", fit: "cover" },
  { image: communityGroup3, title: "A school community gathering", description: "Staff and learners gathered together in navy and pink uniforms.", fit: "cover" },
  { image: communityGroup4, title: "School gathering", description: "Able God College students and staff gathered outdoors.", fit: "cover" },
  { image: preparationProgram, title: "Grade 7 to Form 1 Preparation Programme", description: "A free preparation programme running from 12 October to December 2026.", fit: "contain" },
  { image: communityGathering, title: "Able God College Community", description: "Staff and community members gathered together.", fit: "cover" },
  { image: groupOfSchools, title: "Able God Group of Schools", description: "A school information flyer for Able God Junior and Able God College.", fit: "contain" },
  { image: schoolAssembly, title: "School Assembly", description: "Learners gathered in their navy and pink school uniforms.", fit: "cover" },
  { image: examWishesShirt, title: "Best Wishes in Your Exams", description: "An Able God College exam wishes T-shirt design.", fit: "contain" },
  { image: communityCelebration, title: "School Community Gathering", description: "Staff and community members together at Able God College.", fit: "cover" },
  { image: novemberExams, title: "November 2026 Exams", description: "Best wishes to the Class of November 2026.", fit: "contain" },
];
