"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { api, type SearchResult } from "@/lib/api";
import { useT } from "@/lib/i18n/client";
import { buttonClass } from "@/components/ui/button";

// Opens a new chat that already holds the question and the answer from the search page.
export function ContinueInChat({ question, answer }: { question: string; answer: NonNullable<SearchResult["answer"]> }) {
  const t = useT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function open() {
    setBusy(true);
    const createdAt = new Date().toISOString();
    const markers = answer.citations.map((c) => ` [${c.index}]`).join("");
    const chat = await api.createChat({ type: "all" }, [
      { id: "seed-q", role: "user", text: question, citations: [], createdAt },
      {
        id: "seed-a",
        role: "assistant",
        text: answer.text + markers,
        citations: answer.citations,
        lang: answer.lang,
        createdAt,
      },
    ]);
    router.push(`/chat/${chat.id}`);
  }

  return (
    <button type="button" onClick={open} disabled={busy} className={buttonClass("secondary", "w-fit")}>
      <MessageSquare aria-hidden size={16} />
      {t("results.continue")}
    </button>
  );
}
