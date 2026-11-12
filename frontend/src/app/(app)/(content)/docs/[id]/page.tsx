import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, MessageSquare } from "lucide-react";
import { BackButton } from "@/components/back-button";
import { buttonClass } from "@/components/ui/button";
import { api } from "@/lib/api";
import { getT } from "@/lib/i18n/server";

const CARD = "flex flex-col gap-3.5 rounded-card border border-line bg-surface p-[22px]";

async function load(id: string) {
  return api.getDoc(id).catch(() => null);
}

export async function generateMetadata({ params }: PageProps<"/docs/[id]">): Promise<Metadata> {
  const data = await load((await params).id);
  return { title: data?.doc.title };
}

export default async function DocPage({ params, searchParams }: PageProps<"/docs/[id]">) {
  const data = await load((await params).id);
  if (!data) notFound();
  const { clause: active } = await searchParams;
  const { doc, clauses } = data;
  const t = await getT();

  return (
    <article className="col flex flex-col gap-[22px]">
      <BackButton label={t("doc.back")} />
      <header className="flex flex-col gap-2">
        <h1 className="text-[clamp(26px,4.5vw,38px)]">{doc.title}</h1>
        <p className="text-[13px] text-muted">
          {[doc.code, doc.org, t("doc.lang", { lang: t(`lang.${doc.lang}`) })].filter(Boolean).join(" · ")}
          {" · "}
          <a
            href={doc.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-accent hover:underline"
          >
            {t("doc.source")}
            <ExternalLink aria-hidden size={13} />
          </a>
        </p>
        {doc.status === "ready" && (
          <Link href={{ pathname: "/chat", query: { doc: doc.id } }} className={buttonClass("secondary", "mt-2 w-fit")}>
            <MessageSquare aria-hidden size={16} />
            {t("doc.ask")}
          </Link>
        )}
      </header>

      {clauses.length > 0 && (
        <section className={CARD}>
          <h2 className="text-lg">{t("doc.found")}</h2>
          {clauses.map((c) => {
            const on = c.id === active;
            return (
              <div
                key={c.id}
                id={c.id}
                className={`flex flex-col gap-1 border-l-[3px] py-1 pl-3.5 ${on ? "border-accent" : "border-line"}`}
              >
                <span className="text-[13px] text-muted">
                  {c.section} · {c.number}
                  {on && <span className="font-semibold text-accent"> · {t("doc.active")}</span>}
                </span>
                <span className={`text-[15px] ${on ? "w-fit rounded bg-mark px-1 py-0.5" : ""}`}>{c.text}</span>
              </div>
            );
          })}
        </section>
      )}

      {doc.sections.length > 0 && (
        <section className={CARD}>
          <h2 className="text-lg">{t("doc.toc")}</h2>
          <ul className="gap-x-7 text-sm text-muted [columns:2_260px]">
            {doc.sections.map((s) => (
              <li key={s} className="break-inside-avoid py-[3px]">
                {s}
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="max-w-[70ch] pt-7 text-[13px] text-muted">{t("doc.note")}</p>
    </article>
  );
}
