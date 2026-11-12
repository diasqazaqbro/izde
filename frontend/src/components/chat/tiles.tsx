import { ArrowRight } from "lucide-react";

// Same look as the example tiles on the home page, but they send the question instead of navigating.
export function Tiles({ items, onPick }: { items: string[]; onPick: (item: string) => void }) {
  return (
    <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item}>
          <button
            type="button"
            onClick={() => onPick(item)}
            className="group flex h-full min-h-[54px] w-full items-center justify-between gap-3 rounded-tile bg-bg px-[18px] py-3.5 text-left text-[15px] hover:bg-accent-soft hover:text-accent motion-safe:transition-colors"
          >
            {item}
            <ArrowRight aria-hidden size={18} className="shrink-0 text-muted group-hover:text-accent" />
          </button>
        </li>
      ))}
    </ul>
  );
}
