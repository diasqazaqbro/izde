import type { Lang } from "@/lib/api";
import { en } from "./en";
import { kk } from "./kk";
import { ru, type Key } from "./ru";

// kk and en are typed as the full Dict, so a missing key fails the type check.

export const LANGS = ["ru", "kk", "en"] as const satisfies Lang[];
export const LANG_COOKIE = "lang";

export function isLang(v: unknown): v is Lang {
  return LANGS.includes(v as Lang);
}

const dicts = { ru, kk, en };

export type T = (key: Key, vars?: Record<string, string | number>) => string;

export function makeT(lang: Lang): T {
  const dict = dicts[lang];
  return (key, vars) => dict[key].replace(/\{(\w+)\}/g, (_, name: string) => String(vars?.[name] ?? ""));
}
