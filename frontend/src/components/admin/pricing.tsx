"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { api, type Plan } from "@/lib/api";
import { useLang, useT } from "@/lib/i18n/client";
import { useData } from "@/lib/use-data";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";

const LOCALES = { ru: "ru-RU", kk: "kk-KZ", en: "en-US" };

function Checkout({ plan, onClose, onPaid }: { plan: Plan; onClose: () => void; onPaid: () => void }) {
  const t = useT();
  const [state, setState] = useState<"idle" | "paying" | "done" | "error">("idle");
  const price = usePrice(plan);

  async function pay() {
    setState("paying");
    const { ok } = await api.checkout(plan.id).catch(() => ({ ok: false }));
    setState(ok ? "done" : "error");
    if (ok) onPaid();
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <h2 className="text-2xl">{t("checkout.title", { plan: plan.name })}</h2>
      <dl className="flex items-baseline justify-between gap-4 border-y border-line py-3">
        <dt className="text-muted">{t("checkout.total")}</dt>
        <dd className="text-lg font-semibold">{price}</dd>
      </dl>
      <p className="rounded-field bg-wait-soft px-4 py-3 text-sm text-wait">{t("checkout.note")}</p>
      <p role="status" className={state === "done" ? "font-semibold text-ok" : state === "error" ? "text-danger" : "sr-only"}>
        {state === "done" ? t("checkout.done", { plan: plan.name }) : state === "error" ? t("checkout.error") : ""}
      </p>
      <div className="flex flex-wrap gap-2">
        {state === "done" ? (
          <Button type="button" onClick={onClose} autoFocus>
            {t("checkout.close")}
          </Button>
        ) : (
          <>
            <Button type="button" onClick={pay} disabled={state === "paying"}>
              {state === "paying" ? t("checkout.paying") : t("checkout.pay")}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose} disabled={state === "paying"}>
              {t("checkout.cancel")}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function usePrice(plan: Plan) {
  const t = useT();
  const lang = useLang();
  return plan.price
    ? t("pricing.perMonth", { price: new Intl.NumberFormat(LOCALES[lang]).format(plan.price) })
    : t("pricing.free");
}

function PlanCard({ plan, current, onChoose }: { plan: Plan; current: boolean; onChoose: () => void }) {
  const t = useT();
  const lang = useLang();
  const price = usePrice(plan);
  return (
    <section
      aria-labelledby={`plan-${plan.id}`}
      className={`flex flex-col gap-4 rounded-card border bg-surface p-[22px] ${current ? "border-accent ring-1 ring-accent" : "border-line"}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={`plan-${plan.id}`} className="text-xl">
          {plan.name}
        </h2>
        {current && (
          <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent">
            {t("pricing.current")}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold tracking-[-0.02em]">{price}</p>
        {plan.price > 0 && <p className="text-[13px] text-muted">{t("pricing.example")}</p>}
      </div>
      <ul className="flex flex-1 flex-col gap-2 text-[15px]">
        {[
          t("pricing.docs", { n: new Intl.NumberFormat(LOCALES[lang]).format(plan.docLimit) }),
          t("pricing.questions", { n: plan.questionLimit }),
        ].map((f) => (
          <li key={f} className="flex gap-2">
            <Check aria-hidden size={18} className="mt-0.5 shrink-0 text-accent" />
            {f}
          </li>
        ))}
      </ul>
      <Button type="button" variant={current ? "secondary" : "primary"} disabled={current} onClick={onChoose}>
        {current ? t("pricing.current") : t("pricing.choose", { plan: plan.name })}
      </Button>
    </section>
  );
}

export function Pricing() {
  const t = useT();
  const [plans] = useData(api.listPlans);
  const [usage, reload] = useData(api.getUsage);
  const [chosen, setChosen] = useState<Plan | null>(null);
  if (!plans || !usage) return <p className="text-muted">{t("common.loading")}</p>;

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted">{t("pricing.usage", { n: usage.docCount })}</p>
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((p) => (
          <PlanCard key={p.id} plan={p} current={p.id === usage.plan.id} onChoose={() => setChosen(p)} />
        ))}
      </div>
      <Sheet open={!!chosen} onClose={() => setChosen(null)} side="center" label={t("checkout.title", { plan: chosen?.name ?? "" })}>
        {chosen && <Checkout plan={chosen} onClose={() => setChosen(null)} onPaid={reload} />}
      </Sheet>
    </div>
  );
}
