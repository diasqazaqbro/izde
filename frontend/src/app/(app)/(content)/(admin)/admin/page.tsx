import type { Metadata } from "next";
import { Summary } from "@/components/admin/summary";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("admin.summary") };
}

export default async function Page() {
  const t = await getT();
  return (
    <>
      <h1 className="text-[clamp(28px,4.5vw,38px)]">{t("admin.summary")}</h1>
      <Summary />
    </>
  );
}
