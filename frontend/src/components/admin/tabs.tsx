"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Key } from "@/lib/i18n/ru";
import { useT } from "@/lib/i18n/client";

const TABS: { href: string; label: Key }[] = [
  { href: "/admin", label: "admin.summary" },
  { href: "/admin/documents", label: "admin.documents" },
  { href: "/admin/analytics", label: "admin.analytics" },
  { href: "/admin/users", label: "admin.users" },
  { href: "/pricing", label: "admin.pricing" },
];

export function AdminTabs() {
  const t = useT();
  const path = usePathname();
  return (
    <nav aria-label={t("admin.tabs")}>
      <ul className="flex w-fit flex-wrap gap-1 rounded-field bg-bg p-[3px]">
        {TABS.map((tab) => (
          <li key={tab.href}>
            <Link
              href={tab.href}
              aria-current={path === tab.href ? "page" : undefined}
              className="inline-flex min-h-11 items-center rounded-[9px] px-4 text-sm text-muted hover:text-fg aria-[current=page]:bg-surface aria-[current=page]:font-semibold aria-[current=page]:text-fg aria-[current=page]:shadow-[0_1px_3px_rgb(0_0_0/0.12)] sm:min-h-9"
            >
              {t(tab.label)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
