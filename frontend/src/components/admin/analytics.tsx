"use client";

import { api } from "@/lib/api";
import { useT } from "@/lib/i18n/client";
import { useData } from "@/lib/use-data";
import { DataTable } from "@/components/ui/data-table";
import { DemoBadge } from "@/components/ui/demo-badge";

export function AnalyticsView() {
  const t = useT();
  const [stats] = useData(api.getAnalytics);
  if (!stats) return <p className="text-muted">{t("common.loading")}</p>;
  const { up, down, comments } = stats.feedback;
  const table = (label: string, rows: { query: string; count: number }[]) => (
    <DataTable
      label={label}
      cols="sm:grid-cols-[minmax(0,1fr)_120px]"
      columns={[t("analytics.col.query"), t("analytics.col.count")]}
      rows={rows.map((r) => ({ key: r.query, cells: [r.query, r.count] }))}
    />
  );

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg">{t("analytics.top")}</h2>
          {stats.demo && <DemoBadge label={t("common.demo")} />}
        </div>
        <p className="text-sm text-muted">{t("analytics.week", { n: stats.queriesWeek })}</p>
        {table(t("analytics.top"), stats.topQueries)}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg">{t("analytics.noResults")}</h2>
          {stats.demo && <DemoBadge label={t("common.demo")} />}
        </div>
        <p className="text-sm text-muted">{t("analytics.noResults.note")}</p>
        {table(t("analytics.noResults"), stats.noResults)}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg">{t("analytics.feedback")}</h2>
        {up + down === 0 ? (
          <p className="text-muted">{t("analytics.feedback.empty")}</p>
        ) : (
          <>
            <dl className="flex flex-wrap gap-4">
              {[
                [t("analytics.feedback.up"), up],
                [t("analytics.feedback.down"), down],
              ].map(([label, n]) => (
                <div key={label} className="min-w-36 rounded-card border border-line bg-surface p-4">
                  <dt className="text-sm text-muted">{label}</dt>
                  <dd className="text-[28px] font-bold">{n}</dd>
                </div>
              ))}
            </dl>
            {comments.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="text-base font-semibold">{t("analytics.feedback.comments")}</h3>
                <ul className="flex flex-col gap-2">
                  {comments.map((c, i) => (
                    <li key={i} className="rounded-field bg-bg px-4 py-2.5 text-[15px]">
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
        <p className="text-[13px] text-muted">{t("summary.feedback.note")}</p>
      </section>
    </div>
  );
}
