import { useEffect, useState } from "react";
import { prefersReducedMotion, useInView } from "./useMotion";

/** Counts a figure such as "74.5%" or "US$ 200" up from zero when it scrolls into view. Text without a number stays as is. */
const CountUp = ({ value, duration = 1400 }: { value: string; duration?: number }) => {
  const match = value.match(/^(\D*)(\d+(?:\.\d+)?)(.*)$/);
  const { ref, inView } = useInView<HTMLSpanElement>(0.4);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!match || !inView) return;
    if (prefersReducedMotion()) { setProgress(1); return; }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setProgress(1 - Math.pow(1 - t, 3)); // ease out
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, duration, value]);

  if (!match) return <span ref={ref}>{value}</span>;
  const [, prefix, digits, suffix] = match;
  const decimals = digits.includes(".") ? digits.split(".")[1].length : 0;
  const shown = (Number(digits) * (inView ? progress : 0)).toFixed(decimals);
  // The real figure is always in the accessible text; the counting is decoration.
  return (
    <span ref={ref} aria-label={value}>
      <span aria-hidden="true">{prefix}{shown}{suffix}</span>
    </span>
  );
};

export default CountUp;
