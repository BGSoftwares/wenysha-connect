import type { ReactNode } from "react";
import { useInView } from "./useMotion";

/** Lifts its content into place, with a slight forward tilt, the first time it scrolls into view. */
const Reveal = ({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) => {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div ref={ref} className={`reveal ${inView ? "reveal-in" : ""} ${className}`} style={{ transitionDelay: inView ? `${delay}ms` : undefined }}>
      {children}
    </div>
  );
};

export default Reveal;
