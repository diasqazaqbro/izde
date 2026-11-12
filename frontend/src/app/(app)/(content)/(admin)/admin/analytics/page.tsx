import type { Metadata } from "next";
import { AnalyticsView } from "@/components/admin/analytics";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("admin.analytics") };
}

export default async function Page() {
  const t = await getT();
  return (
    <>
      <h1 className="text-[clamp(28px,4.5vw,38px)]">{t("admin.analytics")}</h1>
      <AnalyticsView />
    </>
  );
}
