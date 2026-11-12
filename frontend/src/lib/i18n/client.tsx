"use client";

import { createContext, use, useMemo, type ReactNode } from "react";
import type { Lang } from "@/lib/api";
import { makeT } from ".";

const LangContext = createContext<Lang>("ru");

export function I18nProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  return <LangContext value={lang}>{children}</LangContext>;
}

export function useLang() {
  return use(LangContext);
}

export function useT() {
  const lang = use(LangContext);
  return useMemo(() => makeT(lang), [lang]);
}
