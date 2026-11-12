"use client";

import { useEffect } from "react";
import { useT } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

// Next 16 passes `retry` (re-fetches and re-renders the segment).
export default function AppError({ error, retry }: { error: unknown; retry: () => void }) {
  const t = useT();
  useEffect(() => console.error(error), [error]);
  return (
    <main className="wrap py-10">
      <div className="col">
        <EmptyState heading="h1" title={t("error.title")} text={t("error.text")}>
          <Button type="button" onClick={retry} className="w-fit">
            {t("error.retry")}
          </Button>
        </EmptyState>
      </div>
    </main>
  );
}
