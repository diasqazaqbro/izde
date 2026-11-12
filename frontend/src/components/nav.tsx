"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Search, type LucideIcon } from "lucide-react";
import type { Key } from "@/lib/i18n/ru";
import { useT } from "@/lib/i18n/client";

const ITEMS: { href: string; label: Key; icon: LucideIcon; match: string[] }[] = [
  { href: "/", label: "nav.search", icon: Search, match: ["/", "/search", "/docs"] },
  { href: "/chat", label: "nav.chat", icon: MessageSquare, match: ["/chat"] },
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
          // icons on the phone so the header fits 390 px; the label stays for screen readers
          className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[15px] text-muted ring-line hover:text-fg aria-[current=page]:bg-surface aria-[current=page]:text-fg aria-[current=page]:ring-1 sm:h-9 sm:w-auto sm:px-3"
        >
          <item.icon aria-hidden size={20} className="sm:hidden" />
          <span className="max-sm:sr-only">{t(item.label)}</span>
        </Link>
      ))}
    </nav>
  );
}
