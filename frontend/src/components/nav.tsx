"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Key } from "@/lib/i18n/ru";
import { useT } from "@/lib/i18n/client";

// Chat and admin sections join this list in steps 2 and 3.
const ITEMS: { href: string; label: Key; match: string[] }[] = [
  { href: "/", label: "nav.search", match: ["/", "/search", "/docs"] },
];

function isActive(path: string, match: string[]) {
  return match.some((m) => (m === "/" ? path === "/" : path === m || path.startsWith(`${m}/`)));
}

export function Nav() {
  const t = useT();
  const path = usePathname();
  return (
    <nav aria-label={t("nav.label")} className="flex gap-1">
      {ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive(path, item.match) ? "page" : undefined}
          className="inline-flex h-11 items-center rounded-full px-3 text-[15px] text-muted ring-line hover:text-fg aria-[current=page]:bg-surface aria-[current=page]:text-fg aria-[current=page]:ring-1 sm:h-9"
        >
          {t(item.label)}
        </Link>
      ))}
    </nav>
  );
}
