"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, SquarePen, Trash2 } from "lucide-react";
import type { Chat } from "@/lib/api";
import { useT } from "@/lib/i18n/client";
import type { Key } from "@/lib/i18n/ru";

const GROUPS: { key: Key; test: (age: number) => boolean }[] = [
  { key: "chat.group.today", test: (days) => days === 0 },
  { key: "chat.group.yesterday", test: (days) => days === 1 },
  { key: "chat.group.earlier", test: (days) => days > 1 },
];

function daysAgo(iso: string) {
  const start = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((start(new Date()) - start(new Date(iso))) / 86_400_000);
}

const SMALL_BUTTON =
  "grid size-11 shrink-0 place-items-center rounded-full text-muted hover:bg-surface hover:text-fg sm:size-8";

export function History({
  chats,
  activeId,
  onNew,
  onNavigate,
  onRename,
  onDelete,
}: {
  chats: Chat[] | null;
  activeId?: string;
  onNew: () => void;
  onNavigate: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}) {
  const t = useT();
  const [query, setQuery] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  const titleOf = (c: Chat) => c.title || t("chat.title.new");
  const found = (chats ?? []).filter((c) => titleOf(c).toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <nav aria-label={t("chat.history")} className="flex flex-col gap-3 p-3">
      <button
        type="button"
        onClick={onNew}
        className="flex min-h-11 items-center gap-2 rounded-field bg-surface px-3 text-[15px] font-semibold text-accent ring-1 ring-line hover:bg-accent-soft sm:min-h-9"
      >
        <SquarePen aria-hidden size={16} />
        {t("chat.new")}
      </button>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label={t("chat.search")}
        placeholder={t("chat.search")}
        className="min-h-11 rounded-field border border-line bg-surface px-3 text-[15px] sm:min-h-9"
      />

      {chats && chats.length === 0 && <p className="px-1 text-sm text-muted">{t("chat.history.empty")}</p>}
      {chats && chats.length > 0 && found.length === 0 && (
        <p className="px-1 text-sm text-muted">{t("chat.history.notFound")}</p>
      )}

      {GROUPS.map((group) => {
        const items = found.filter((c) => group.test(daysAgo(c.updatedAt)));
        if (!items.length) return null;
        return (
          <section key={group.key} className="flex flex-col gap-0.5">
            <h2 className="px-2 pb-1 text-xs font-semibold tracking-[0.06em] text-muted uppercase">{t(group.key)}</h2>
            <ul className="flex flex-col gap-0.5">
              {items.map((c) =>
                renaming === c.id ? (
                  <li key={c.id}>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        onRename(c.id, String(new FormData(e.currentTarget).get("title") ?? ""));
                        setRenaming(null);
                      }}
                      className="flex items-center gap-1"
                    >
                      <input
                        name="title"
                        defaultValue={c.title}
                        autoFocus
                        maxLength={60}
                        aria-label={t("chat.rename.label")}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") {
                            e.preventDefault();
                            e.stopPropagation();
                            setRenaming(null);
                          }
                        }}
                        className="min-h-11 min-w-0 flex-1 rounded-field border border-accent bg-surface px-2 text-sm sm:min-h-9"
                      />
                      <button
                        type="submit"
                        className="min-h-11 rounded-full px-3 text-sm font-semibold text-accent hover:bg-accent-soft sm:min-h-9"
                      >
                        {t("chat.rename.save")}
                      </button>
                    </form>
                  </li>
                ) : confirming === c.id ? (
                  <li key={c.id} role="group" className="flex flex-col gap-2 rounded-field bg-danger-soft p-3 text-sm">
                    <p>{t("chat.delete.confirm", { title: titleOf(c) })}</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setConfirming(null);
                          onDelete(c.id);
                        }}
                        className="min-h-11 rounded-full bg-danger px-4 font-semibold text-white hover:brightness-110 sm:min-h-9"
                      >
                        {t("chat.delete")}
                      </button>
                      <button
                        type="button"
                        autoFocus
                        onClick={() => setConfirming(null)}
                        className="min-h-11 rounded-full bg-surface px-4 ring-1 ring-line hover:bg-bg sm:min-h-9"
                      >
                        {t("chat.cancel")}
                      </button>
                    </div>
                  </li>
                ) : (
                  <li
                    key={c.id}
                    className="group flex items-center rounded-field hover:bg-bg has-[[aria-current=page]]:bg-accent-soft"
                  >
                    <Link
                      href={`/chat/${c.id}`}
                      onClick={onNavigate}
                      aria-current={c.id === activeId ? "page" : undefined}
                      className="flex min-h-11 min-w-0 flex-1 items-center truncate rounded-field px-2 text-sm focus-visible:outline-offset-[-3px] aria-[current=page]:font-semibold sm:min-h-9"
                    >
                      <span className="truncate">{titleOf(c)}</span>
                    </Link>
                    <span className="flex lg:pointer-fine:hidden lg:pointer-fine:group-focus-within:flex lg:pointer-fine:group-hover:flex">
                      <button
                        type="button"
                        onClick={() => setRenaming(c.id)}
                        aria-label={`${t("chat.rename")}: ${titleOf(c)}`}
                        title={t("chat.rename")}
                        className={SMALL_BUTTON}
                      >
                        <Pencil aria-hidden size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirming(c.id)}
                        aria-label={`${t("chat.delete")}: ${titleOf(c)}`}
                        title={t("chat.delete")}
                        className={SMALL_BUTTON}
                      >
                        <Trash2 aria-hidden size={14} />
                      </button>
                    </span>
                  </li>
                ),
              )}
            </ul>
          </section>
        );
      })}
    </nav>
  );
}
