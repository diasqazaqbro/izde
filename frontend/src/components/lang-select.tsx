"use client";

import { useTransition } from "react";
import { ChevronDown } from "lucide-react";
import type { Lang } from "@/lib/api";
import { LANGS } from "@/lib/i18n";
import { setLang } from "@/lib/i18n/actions";
import { useT } from "@/lib/i18n/client";

export function LangSelect({ lang }: { lang: Lang }) {
  const t = useT();
  const [pending, startTransition] = useTransition();
  return (
    <span className="relative inline-flex items-center">
      <select
        aria-label={t("lang.label")}
        value={lang}
        disabled={pending}
        onChange={(e) => startTransition(() => setLang(e.target.value))}
        className="h-11 appearance-none rounded-full bg-transparent pr-7 pl-3 text-[15px] text-muted hover:text-fg sm:h-9"
      >
        {LANGS.map((l) => (
          <option key={l} value={l}>
            {t(`lang.${l}`)}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden size={16} className="pointer-events-none absolute right-2 text-muted" />
    </span>
  );
}
