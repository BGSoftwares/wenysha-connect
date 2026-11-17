export interface ChildOption {
  id: number;
  name: string;
  detail: string;
}

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?";

/** Picks which child the dashboard is showing. Sits on the navy hero, so it is styled for a dark surface. */
const ChildSwitcher = ({ kids, selectedId, onSelect }: { kids: ChildOption[]; selectedId: number | null; onSelect: (id: number) => void }) => (
  <div role="tablist" aria-label="Choose a child" className="flex gap-3 overflow-x-auto pb-1">
    {kids.map((kid) => {
      const selected = kid.id === selectedId;
      return (
        <button
          key={kid.id}
          type="button"
          role="tab"
          aria-selected={selected}
          onClick={() => onSelect(kid.id)}
          className={`flex min-w-[13rem] shrink-0 items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
            selected
              ? "border-white bg-white text-primary shadow-lg"
              : "border-white/20 bg-white/10 text-white hover:bg-white/20"
          }`}
        >
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-heading text-sm font-semibold ${selected ? "bg-accent text-accent-foreground" : "bg-white/20 text-white"}`}>
            {initials(kid.name)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{kid.name}</span>
            <span className={`block truncate font-mono text-xs ${selected ? "text-primary/70" : "text-white/70"}`}>{kid.detail}</span>
          </span>
        </button>
      );
    })}
  </div>
);

export default ChildSwitcher;
