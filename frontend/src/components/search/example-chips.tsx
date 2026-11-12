import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { SearchMode } from "@/lib/api";

export function ExampleChips({ examples, mode }: { examples: string[]; mode: SearchMode }) {
  return (
    <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {examples.map((e) => (
        <li key={e}>
          <Link
            href={{ pathname: "/search", query: { q: e, mode } }}
            className="group flex h-full min-h-[54px] items-center justify-between gap-3 rounded-tile bg-bg px-[18px] py-3.5 text-left text-[15px] hover:bg-accent-soft hover:text-accent motion-safe:transition-colors"
          >
            {e}
            <ArrowRight aria-hidden size={18} className="shrink-0 text-muted group-hover:text-accent" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
