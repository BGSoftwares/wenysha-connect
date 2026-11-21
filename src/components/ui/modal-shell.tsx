import { useEffect, useId, useRef } from "react";
import type { KeyboardEvent, ReactNode } from "react";

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

interface ModalShellProps {
  /** Called when the person clicks the dim backdrop or presses Escape. */
  onClose: () => void;
  /** Classes for the dim, full-screen backdrop (position, colour, blur, padding). */
  overlayClassName?: string;
  /** Classes for the panel that holds the content. */
  className?: string;
  /** Accessible name. Leave out to use the first heading inside the panel. */
  label?: string;
  children: ReactNode;
}

/**
 * The backdrop-and-panel pattern the portals use for their pop-up forms, made accessible:
 * announced as a dialog, closes on Escape, keeps Tab inside the panel, and returns focus to
 * whatever opened it. The look is whatever classes the caller passes in.
 */
const ModalShell = ({ onClose, overlayClassName, className = "", label, children }: ModalShellProps) => {
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const node = panel.current;
    if (node) {
      if (!label) {
        const heading = node.querySelector<HTMLElement>("h1,h2,h3");
        if (heading) {
          if (!heading.id) heading.id = titleId;
          node.setAttribute("aria-labelledby", heading.id);
        }
      }
      // Move focus into the dialog unless a field inside it already took focus (autoFocus).
      if (!node.contains(document.activeElement)) node.focus();
    }
    return () => { opener?.focus?.(); };
    // Runs once when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab" || !panel.current) return;
    const items = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (!items.length) { event.preventDefault(); return; }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === panel.current)) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && active === last) { event.preventDefault(); first.focus(); }
  };

  return (
    <div className={overlayClassName} onClick={() => onClose()} onKeyDown={onKeyDown}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={`${className} outline-none`.trim()}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

export default ModalShell;
