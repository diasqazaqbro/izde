import type { Metadata } from "next";
import { Documents } from "@/components/admin/documents";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("admin.documents") };
}

export default async function Page() {
  const t = await getT();
  return (
    <>
      <h1 className="text-[clamp(28px,4.5vw,38px)]">{t("admin.documents")}</h1>
      <Documents />
    </>
  );
}
