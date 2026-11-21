import { useEffect, useRef, useState } from "react";

/** True when the visitor asked their device for less motion. Every effect here switches off for them. */
export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

/** True for a mouse or trackpad. Pointer tilt is pointless (and janky) on touch screens. */
export const hasFinePointer = () =>
  typeof window !== "undefined" && window.matchMedia?.("(hover: hover) and (pointer: fine)").matches === true;

/** Becomes true once the element has scrolled into view, and stays true. */
export function useInView<T extends Element>(threshold = 0.15) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setInView(true);
        observer.disconnect();
      }
    }, { threshold, rootMargin: "0px 0px -8% 0px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, inView };
}
