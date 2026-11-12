"use client";

import Form from "next/form";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import type { SearchMode } from "@/lib/api";
import { useT } from "@/lib/i18n/client";
import { Segmented } from "@/components/ui/segmented";
import { ExampleChips } from "./example-chips";

export function SearchBox({
  query = "",
  mode: initialMode = "meaning",
  hero = false,
  examples,
}: {
  query?: string;
  mode?: SearchMode;
  hero?: boolean;
  examples?: string[];
}) {
  const t = useT();
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState(initialMode);

  // On the home page the empty field types out example questions letter by letter.
  useEffect(() => {
    const el = input.current;
    if (!hero || !examples?.length || !el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const initial = el.placeholder;
    let i = 0;
    let n = 0;
    let dir = 1;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const text = examples[i];
      n += dir;
      el.placeholder = text.slice(0, n) || " ";
      let wait = dir > 0 ? 55 : 22;
      if (n === text.length) {
        dir = -1;
        wait = 1600;
      } else if (n === 0) {
        dir = 1;
        i = (i + 1) % examples.length;
        wait = 350;
      }
      timer = setTimeout(tick, wait);
    };
    tick();
    return () => {
      clearTimeout(timer);
      el.placeholder = initial;
    };
  }, [hero, examples]);

  function changeMode(next: SearchMode) {
    setMode(next);
    const q = input.current?.value.trim();
    if (!hero && q) router.push(`/search?${new URLSearchParams({ q, mode: next })}`);
  }

  return (
    <div className={`flex w-full min-w-0 flex-col gap-3.5 ${hero ? "items-center" : "items-start"}`}>
      <Form
        action="/search"
        role="search"
        className="flex w-full min-w-0 items-center gap-1 rounded-full bg-surface py-1.5 pr-1.5 pl-[22px] shadow-search focus-within:shadow-search-focus"
      >
        <Search aria-hidden size={20} className="shrink-0 text-muted" />
        <input
          ref={input}
          name="q"
          type="search"
          defaultValue={query}
          autoComplete="off"
          placeholder={t("search.placeholder")}
          aria-label={t("search.label")}
          className={`min-w-0 flex-1 bg-transparent p-2.5 focus-visible:outline-none [&::-webkit-search-cancel-button]:appearance-none ${hero ? "min-h-14 text-[19px]" : "min-h-11 text-[17px]"}`}
        />
        <input type="hidden" name="mode" value={mode} />
        <button
          type="submit"
          aria-label={t("search.submit")}
          className={`grid shrink-0 place-items-center rounded-full bg-accent text-white hover:brightness-110 ${hero ? "size-14" : "size-11"}`}
        >
          <ArrowRight aria-hidden size={20} strokeWidth={2.2} />
        </button>
      </Form>
      <Segmented
        label={t("search.modes")}
        value={mode}
        onChange={changeMode}
        options={[
          { value: "meaning", label: t("search.mode.meaning") },
          { value: "keyword", label: t("search.mode.keyword") },
        ]}
      />
      {examples && (
        <div className="flex w-full flex-col gap-2.5 pt-2 text-left">
          <span className="pl-1 text-[13px] text-muted">{t("home.try")}</span>
          <ExampleChips examples={examples} mode={mode} />
        </div>
      )}
    </div>
  );
}
