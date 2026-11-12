import { SearchBox } from "@/components/search/search-box";
import { api } from "@/lib/api";
import { getT } from "@/lib/i18n/server";

export default async function HomePage() {
  const t = await getT();
  const docs = await api.listDocs();
  const ready = docs.filter((d) => d.status === "ready").length;
  const examples = [t("example.1"), t("example.2"), t("example.3"), t("example.4")];

  return (
    <section className="col flex flex-col items-center gap-7 text-center sm:pt-[clamp(16px,9vh,96px)]">
      <h1 className="text-[clamp(60px,12vw,96px)] leading-none tracking-[-0.055em]">
        Izde<span className="text-accent">.</span>
      </h1>
      <p className="max-w-[34ch] text-[clamp(17px,2.4vw,21px)] leading-[1.35] text-balance text-muted">
        {t("home.lead")}
      </p>
      <SearchBox hero examples={examples} />
      <p className="text-[13px] text-muted">{t("home.stat", { total: docs.length, ready })}</p>
    </section>
  );
}
