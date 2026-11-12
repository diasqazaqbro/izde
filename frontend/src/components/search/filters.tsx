"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import type { DocType, Filters } from "@/lib/api";
import { useT } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";

export type FilterOptions = { types: DocType[]; years: string[]; depts: string[] };
const KEYS = ["type", "year", "dept"] as const;

function Select({
  label,
  value,
  onChange,
  options,
  stacked,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  stacked?: boolean;
}) {
  const t = useT();
  return (
    <label className={stacked ? "flex flex-col gap-1.5 text-sm text-muted" : "relative flex items-center"}>
      <span className={stacked ? "" : "sr-only"}>{label}</span>
      <span className="relative flex items-center">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full appearance-none rounded-full border bg-surface pr-8 pl-3.5 text-sm text-fg ${stacked ? "h-11" : "h-9"} ${value ? "border-accent" : "border-line"}`}
        >
          <option value="">{stacked ? t("filters.any") : `${label}: ${t("filters.any").toLowerCase()}`}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {stacked ? o.label : `${label}: ${o.label}`}
            </option>
          ))}
        </select>
        <ChevronDown aria-hidden size={14} className="pointer-events-none absolute right-3 text-muted" />
      </span>
    </label>
  );
}

export function SearchFilters({ value, options }: { value: Filters; options: FilterOptions }) {
  const t = useT();
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Filters>(value);
  const active = KEYS.filter((k) => value[k]).length;

  function apply(next: Filters) {
    const p = new URLSearchParams(params);
    for (const k of KEYS) {
      if (next[k]) p.set(k, next[k]);
      else p.delete(k);
    }
    router.push(`${path}?${p}`);
  }

  const none = (key: "filters.none.year" | "filters.none.dept") => (v: string) => ({
    value: v,
    label: v === "none" ? t(key) : v,
  });
  const fields = [
    {
      key: "type" as const,
      label: t("filters.type"),
      options: options.types.map((v) => ({ value: v, label: t(`type.${v}`) })),
    },
    { key: "year" as const, label: t("filters.year"), options: options.years.map(none("filters.none.year")) },
    { key: "dept" as const, label: t("filters.dept"), options: options.depts.map(none("filters.none.dept")) },
  ];

  return (
    <>
      <div className="hidden flex-wrap items-center gap-2 sm:flex" role="group" aria-label={t("filters.title")}>
        {fields.map((f) => (
          <Select
            key={f.key}
            label={f.label}
            value={value[f.key] ?? ""}
            options={f.options}
            onChange={(v) => apply({ ...value, [f.key]: v || undefined })}
          />
        ))}
        {active > 0 && (
          <button type="button" onClick={() => apply({})} className="min-h-9 px-2 text-sm text-accent hover:underline">
            {t("filters.reset")}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => {
          setDraft(value);
          setOpen(true);
        }}
        className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm sm:hidden"
      >
        <SlidersHorizontal aria-hidden size={16} />
        {active ? t("filters.count", { n: active }) : t("filters.title")}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} side="bottom" label={t("filters.title")} closeLabel={t("common.close")}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setOpen(false);
            apply(draft);
          }}
          className="flex flex-col gap-4 px-5 pb-5"
        >
          <h2 className="text-xl">{t("filters.title")}</h2>
          {fields.map((f) => (
            <Select
              key={f.key}
              stacked
              label={f.label}
              value={draft[f.key] ?? ""}
              options={f.options}
              onChange={(v) => setDraft({ ...draft, [f.key]: v || undefined })}
            />
          ))}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="submit">{t("filters.apply")}</Button>
            <Button type="button" variant="secondary" onClick={() => setDraft({})}>
              {t("filters.reset")}
            </Button>
          </div>
        </form>
      </Sheet>
    </>
  );
}
