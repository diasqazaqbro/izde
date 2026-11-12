import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { ContinueInChat } from "@/components/search/continue-in-chat";
import { ExampleChips } from "@/components/search/example-chips";
import { SearchFilters } from "@/components/search/filters";
import { SearchBox } from "@/components/search/search-box";
import { EmptyState } from "@/components/ui/empty-state";
import { api, type DocType, type Filters, type SearchHit, type SearchMode } from "@/lib/api";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata({ searchParams }: PageProps<"/search">): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: typeof q === "string" ? q : undefined };
}

function clauseHref({ doc, clause }: SearchHit) {
  return { pathname: `/docs/${doc.id}`, query: { clause: clause.id } };
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function Highlight({ text, words }: { text: string; words: string[] }) {
  if (!words.length) return text;
  // split() with a capture group puts matches at odd indexes
  const parts = text.split(new RegExp(`(${words.map(escapeRe).join("|")})`, "gi"));
  return parts.map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : part));
}

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  if (!q) redirect("/");
  const mode: SearchMode = params.mode === "keyword" ? "keyword" : "meaning";
  const pick = (v: unknown) => (typeof v === "string" && v ? v : undefined);
  const filters: Filters = { type: pick(params.type) as DocType | undefined, year: pick(params.year), dept: pick(params.dept) };

  const t = await getT();
  const [{ hits, answer }, docs] = await Promise.all([api.search(q, mode, filters), api.listDocs()]);
  // Options come from searchable documents; empty year and department show up as "not specified".
  const ready = docs.filter((d) => d.status === "ready");
  const options = {
    types: [...new Set(ready.map((d) => d.type))],
    years: [...new Set(ready.map((d) => (d.year === null ? "none" : String(d.year))))],
    depts: [...new Set(ready.map((d) => d.dept ?? "none"))],
  };
  const filtered = Object.values(filters).some(Boolean);
  const source = answer && hits.find((h) => h.clause.id === answer.citations[0]?.clauseId);
  const examples = [t("example.1"), t("example.2"), t("example.3"), t("example.4")];

  return (
    <div className="col flex flex-col gap-5">
      <h1 className="sr-only">{t("results.title")}</h1>
      <SearchBox key={`${q}|${mode}`} query={q} mode={mode} filters={filters} />
      <SearchFilters key={JSON.stringify(filters)} value={filters} options={options} />

      {hits.length === 0 ? (
        <EmptyState
          title={t("results.empty.title")}
          text={t(filtered ? "results.empty.filters" : mode === "keyword" ? "results.empty.keyword" : "results.empty.meaning")}
        >
          {!filtered && <ExampleChips examples={examples} mode={mode} />}
        </EmptyState>
      ) : (
        <>
          {answer && source && (
            <section
              aria-labelledby="answer-label"
              className="flex flex-col gap-2.5 rounded-card bg-accent-soft px-[22px] py-5"
            >
              <h2 id="answer-label" className="text-xs font-semibold tracking-[0.06em] text-accent uppercase">
                {t("results.answer")}
              </h2>
              <p className="text-lg leading-[1.45]">{answer.text}</p>
              <Link
                href={clauseHref(source)}
                className="inline-flex min-h-11 w-fit items-center gap-1 text-sm text-accent hover:underline sm:min-h-0"
              >
                {t("results.source", { doc: source.doc.title, clause: source.clause.number })}
                <ArrowRight aria-hidden size={14} />
              </Link>
              <ContinueInChat question={q} answer={answer} />
            </section>
          )}

          <h2 className="text-sm font-normal tracking-normal text-muted">{t("results.count", { n: hits.length })}</h2>
          <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
            {hits.map((hit) => (
              <li key={hit.clause.id}>
                <Link
                  href={clauseHref(hit)}
                  className="flex flex-col gap-1.5 px-[22px] py-[18px] hover:bg-page focus-visible:outline-offset-[-3px] motion-safe:transition-colors"
                >
                  <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-accent">{hit.doc.title}</h3>
                  <span className="text-[13px] text-muted">
                    {[hit.doc.code, hit.clause.section, hit.clause.number].filter(Boolean).join(" · ")}
                  </span>
                  <span className="text-[15px]">
                    <Highlight text={hit.clause.text} words={hit.highlights} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="max-w-[70ch] pt-7 text-[13px] text-muted">{t("demo.note")}</p>
    </div>
  );
}
