import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getT } from "@/lib/i18n/server";

export default async function NotFound() {
  const t = await getT();
  return (
    <main className="wrap grid min-h-dvh place-items-center py-8">
      <div className="w-full max-w-[400px]">
        <EmptyState title={t("notFound.title")} text={t("notFound.text")}>
          <Link href="/" className={buttonClass("primary", "w-fit")}>
            {t("notFound.action")}
          </Link>
        </EmptyState>
      </div>
    </main>
  );
}
