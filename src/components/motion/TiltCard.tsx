import { useRef } from "react";
import type { ElementType, ReactNode } from "react";
import { hasFinePointer, prefersReducedMotion } from "./useMotion";

interface TiltProps {
  children: ReactNode;
  className?: string;
  /** Maximum tilt in degrees. */
  max?: number;
  as?: ElementType;
  [key: string]: unknown;
}

/**
 * Tilts towards the pointer in 3D and lets a soft highlight follow it. Children marked `tilt-lift`
 * float above the card surface. Does nothing on touch screens or with reduced motion.
 */
const TiltCard = ({ children, className = "", max = 8, as: Tag = "div", ...rest }: TiltProps) => {
  const ref = useRef<HTMLElement | null>(null);
  const frame = useRef(0);

  const move = (event: React.PointerEvent<HTMLElement>) => {
    const element = ref.current;
    if (!element || event.pointerType !== "mouse" || !hasFinePointer() || prefersReducedMotion()) return;
    const box = element.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width;
    const y = (event.clientY - box.top) / box.height;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      element.style.setProperty("--tilt-x", `${((0.5 - y) * max * 2).toFixed(2)}deg`);
      element.style.setProperty("--tilt-y", `${((x - 0.5) * max * 2).toFixed(2)}deg`);
      element.style.setProperty("--glare-x", `${(x * 100).toFixed(1)}%`);
      element.style.setProperty("--glare-y", `${(y * 100).toFixed(1)}%`);
    });
  };

  const leave = () => {
    const element = ref.current;
    if (!element) return;
    cancelAnimationFrame(frame.current);
    element.style.setProperty("--tilt-x", "0deg");
    element.style.setProperty("--tilt-y", "0deg");
  };

  return (
    <Tag ref={ref} className={`tilt-card ${className}`} onPointerMove={move} onPointerLeave={leave} {...rest}>
      {children}
    </Tag>
  );
};

export default TiltCard;
