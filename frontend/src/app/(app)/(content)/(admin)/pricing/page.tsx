import type { Metadata } from "next";
import { Pricing } from "@/components/admin/pricing";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("pricing.title") };
}

export default async function Page() {
  const t = await getT();
  return (
    <>
      <h1 className="text-[clamp(28px,4.5vw,38px)]">{t("pricing.title")}</h1>
      <Pricing />
    </>
  );
}
