"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { useT } from "@/lib/i18n/client";
import { useData } from "@/lib/use-data";
import { DemoBadge } from "@/components/ui/demo-badge";

function Card({ title, value, children }: { title: string; value: ReactNode; children?: ReactNode }) {
  return (
    <section className="flex flex-col gap-2 rounded-card border border-line bg-surface p-[22px]">
      <h2 className="text-sm font-normal tracking-normal text-muted">{title}</h2>
      <p className="text-[32px] leading-none font-bold tracking-[-0.02em]">{value}</p>
      {children}
    </section>
  );
}

function More({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="inline-flex min-h-11 w-fit items-center gap-1 text-sm text-accent hover:underline sm:min-h-0">
      {label}
      <ArrowRight aria-hidden size={14} />
    </Link>
  );
}

export function Summary() {
  const t = useT();
  const [docs] = useData(api.listDocs);
  const [usage] = useData(api.getUsage);
  const [stats] = useData(api.getAnalytics);
  if (!docs || !usage || !stats) return <p className="text-muted">{t("common.loading")}</p>;

  const ready = docs.filter((d) => d.status === "ready").length;
  const queued = docs.filter((d) => d.status === "queued" || d.status === "processing").length;
  const failed = docs.filter((d) => d.status === "failed").length;
  const share = Math.min(100, (usage.docCount / usage.plan.docLimit) * 100);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card title={t("summary.docs")} value={docs.length}>
        <p className="text-sm text-muted">{t("summary.docs.detail", { ready, queued })}</p>
        <More href="/admin/documents" label={t("summary.docs.link")} />
      </Card>
      <Card title={t("summary.plan", { plan: usage.plan.name })} value={`${Math.round(share)}%`}>
        <div
          role="meter"
          aria-valuenow={usage.docCount}
          aria-valuemin={0}
          aria-valuemax={usage.plan.docLimit}
          aria-label={t("summary.plan.usage", { n: usage.docCount, limit: usage.plan.docLimit })}
          className="h-2 overflow-hidden rounded-full bg-bg"
        >
          <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(share, 1)}%` }} />
        </div>
        <p className="text-sm text-muted">{t("summary.plan.usage", { n: usage.docCount, limit: usage.plan.docLimit })}</p>
        <More href="/pricing" label={t("summary.plan.link")} />
      </Card>
      <Card title={t("summary.errors")} value={failed}>
        <p className="text-sm text-muted">{t(failed ? "summary.errors.some" : "summary.errors.none")}</p>
      </Card>
      <Card title={t("summary.queries")} value={stats.queriesWeek}>
        {stats.demo && <DemoBadge label={t("common.demo")} />}
        <More href="/admin/analytics" label={t("summary.queries.link")} />
      </Card>
      <Card title={t("summary.feedback")} value={stats.feedback.up + stats.feedback.down}>
        <p className="text-sm text-muted">{t("summary.feedback.detail", { up: stats.feedback.up, down: stats.feedback.down })}</p>
        <p className="text-[13px] text-muted">{t("summary.feedback.note")}</p>
      </Card>
    </div>
  );
}
