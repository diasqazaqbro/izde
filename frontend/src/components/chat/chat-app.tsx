"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as Tooltip from "@radix-ui/react-tooltip";
import { PanelLeft, SquarePen } from "lucide-react";
import { api, type Chat, type ChatMessage, type Citation, type Doc } from "@/lib/api";
import { useT } from "@/lib/i18n/client";
import { useMediaQuery } from "@/lib/use-media-query";
import { buttonClass } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Composer } from "./composer";
import { History } from "./history";
import { AssistantMessage, SourcePanel, UserMessage, type Source } from "./message";
import { Tiles } from "./tiles";

type Pending = {
  question: string;
  replaceLast: boolean;
  streaming: boolean;
  message: ChatMessage;
  error?: { kind: "network" } | { kind: "limit"; text: string };
};

function withoutLastExchange(messages: ChatMessage[]) {
  const i = messages.findLastIndex((m) => m.role === "user");
  return i < 0 ? messages : messages.slice(0, i);
}

const HEADER_BUTTON = "grid size-11 shrink-0 place-items-center rounded-full text-muted hover:bg-bg hover:text-fg sm:size-9";

export function ChatApp({ isAdmin }: { isAdmin: boolean }) {
  const t = useT();
  const router = useRouter();
  // from the pathname, not useParams: Next updates usePathname after history.replaceState (see send)
  const pathname = usePathname();
  const routeId = pathname.startsWith("/chat/") ? decodeURIComponent(pathname.slice(6)) : undefined;
  const docParam = useSearchParams().get("doc");
  const desktop = useMediaQuery("(min-width: 1024px)");
  const touch = useMediaQuery("(pointer: coarse)");

  const [chats, setChats] = useState<Chat[] | null>(null);
  const [chat, setChat] = useState<Chat | null>(null);
  const [missing, setMissing] = useState(false);
  const [docs, setDocs] = useState<Doc[] | null>(null);
  const [sources, setSources] = useState<Record<string, Source>>({});
  const [scope, setScope] = useState<Chat["scope"]>({ type: "all" });
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const [openSource, setOpenSource] = useState<Citation | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyHidden, setHistoryHidden] = useState(false);

  const shownId = useRef<string | null | undefined>(undefined);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);
  const loadedDocs = useRef(new Set<string>());
  const sending = useRef(false); // state updates are async: a double click must not send twice

  const busy = pending?.streaming ?? false;
  const messages = chat?.messages ?? [];
  const empty = messages.length === 0 && !pending;
  const noDocs = docs !== null && docs.length === 0;
  // ?doc= may point to a document that is not searchable; fall back to all documents
  const activeScope: Chat["scope"] =
    scope.type === "doc" && docs && !docs.some((d) => d.id === scope.docId) ? { type: "all" } : scope;

  const refreshChats = useCallback(() => {
    api.listChats().then(setChats);
  }, []);

  useEffect(() => {
    refreshChats();
    api.listDocs().then((all) => setDocs(all.filter((d) => d.status === "ready")));
  }, [refreshChats]);

  // Follow the URL: /chat is a new chat (optionally ?doc=…), /chat/[id] an existing one.
  useEffect(() => {
    if (routeId === shownId.current && routeId) return; // already showing it, e.g. just created
    shownId.current = routeId ?? null;
    abortRef.current?.abort();
    const reset = (next: Chat | null, isMissing: boolean) => {
      setChat(next);
      setMissing(isMissing);
      setPending(null);
      setOpenSource(null);
      setEditing(false);
      setDraft("");
      setScope(next ? next.scope : docParam ? { type: "doc", docId: docParam } : { type: "all" });
    };
    if (!routeId) return reset(null, false);
    api.getChat(routeId).then(
      (c) => shownId.current === routeId && reset(c, false),
      () => shownId.current === routeId && reset(null, true),
    );
  }, [routeId, docParam]);

  // Load clause texts for every citation on screen (source cards, tooltips, the panel).
  const citedDocs = [...messages, ...(pending ? [pending.message] : [])].flatMap((m) =>
    m.citations.map((c) => c.docId),
  );
  const citedKey = [...new Set(citedDocs)].sort().join(",");
  useEffect(() => {
    for (const docId of citedKey ? citedKey.split(",") : []) {
      if (loadedDocs.current.has(docId)) continue;
      loadedDocs.current.add(docId);
      api
        .getDoc(docId)
        .then(({ doc, clauses }) =>
          setSources((prev) => ({ ...prev, ...Object.fromEntries(clauses.map((clause) => [clause.id, { doc, clause }])) })),
        )
        .catch(() => {}); // a citation to an unknown document (edited storage): the number stays without a source
    }
  }, [citedKey]);
  const lookup = (clauseId: string) => sources[clauseId];

  // Stick to the bottom while the answer is typed, unless the user scrolled up to read.
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (el && pinned.current) el.scrollTop = el.scrollHeight;
  });

  async function send(text: string, replaceLast = false) {
    const question = text.trim();
    if (!question || busy || noDocs || sending.current) return;
    sending.current = true;
    try {
      await stream(question, replaceLast);
    } finally {
      sending.current = false;
    }
  }

  async function stream(question: string, replaceLast: boolean) {
    let current = chat;
    if (!current) {
      current = await api.createChat(activeScope);
      shownId.current = current.id;
      // no server round trip: offline, router.replace would fall back to a full page load and lose the chat
      window.history.replaceState(null, "", `/chat/${current.id}`);
    }
    const chatId = current.id;
    const controller = new AbortController();
    abortRef.current = controller;
    pinned.current = true;
    setChat({ ...current, messages: replaceLast ? withoutLastExchange(current.messages) : current.messages });
    setDraft("");
    setEditing(false);
    setOpenSource(null);
    const message: ChatMessage = { id: "pending", role: "assistant", text: "", citations: [], createdAt: "" };
    setPending({ question, replaceLast, streaming: true, message });

    const patch = (change: (m: ChatMessage) => ChatMessage) =>
      setPending((p) => p && { ...p, message: change(p.message) });
    let failed = false;
    try {
      for await (const ev of api.sendMessage(chatId, question, controller.signal, { scope: activeScope, replaceLast })) {
        if (ev.type === "status") patch((m) => ({ ...m, steps: { text: ev.text, docs: ev.docs ?? [] } }));
        else if (ev.type === "token") patch((m) => ({ ...m, text: m.text + ev.text }));
        else if (ev.type === "citation") patch((m) => ({ ...m, citations: [...m.citations, ev.citation] }));
        else if (ev.type === "error") {
          failed = true;
          setPending((p) => p && { ...p, streaming: false, error: { kind: "limit", text: ev.message } });
        }
      }
    } catch {
      failed = true;
      setPending((p) => p && { ...p, streaming: false, error: { kind: "network" } });
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
    if (shownId.current !== chatId) return; // the user switched to another chat meanwhile
    if (!failed) {
      const fresh = await api.getChat(chatId);
      setChat(fresh);
      setPending(null);
    }
    refreshChats();
  }

  function stop() {
    abortRef.current?.abort();
  }

  function newChat() {
    setHistoryOpen(false);
    if (!routeId && !docParam) {
      inputRef.current?.focus();
      return;
    }
    router.push("/chat");
  }

  const lastUser = messages.findLast((m) => m.role === "user");
  // the page was closed or reloaded while answering: the question is saved, the answer is not
  const interrupted = !pending && messages.at(-1)?.role === "user";

  function editLast() {
    if (!lastUser || busy) return;
    setDraft(lastUser.text);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setDraft("");
  }

  // Shortcuts from docs/03-chat.md.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        newChat();
      } else if (mod && e.key === "/") {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === "Escape" && !e.defaultPrevented && !document.querySelector("dialog[open]")) {
        if (openSource) setOpenSource(null);
        else if (busy) stop();
        else if (editing) cancelEdit();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  async function rename(id: string, title: string) {
    await api.renameChat(id, title);
    if (chat?.id === id) setChat(await api.getChat(id));
    refreshChats();
  }

  async function remove(id: string) {
    await api.deleteChat(id);
    refreshChats();
    if (chat?.id === id) router.push("/chat");
  }

  async function feedback(messageId: string, value: "up" | "down", comment?: string) {
    if (!chat) return;
    await api.setFeedback(chat.id, messageId, value, comment);
    setChat(await api.getChat(chat.id));
  }

  const source = openSource ? lookup(openSource.clauseId) : undefined;
  const examples = [t("example.1"), t("example.2"), t("example.3"), t("example.4")];
  const title = missing ? t("chat.notFound") : chat?.title || t("chat.title.new");

  const history = (
    <History
      chats={chats}
      activeId={chat?.id}
      onNew={newChat}
      onNavigate={() => setHistoryOpen(false)}
      onRename={rename}
      onDelete={remove}
    />
  );

  return (
    <Tooltip.Provider>
      <main data-fullscreen className="flex min-h-0 flex-1">
        {desktop ? (
          !historyHidden && (
            <aside className="w-[260px] shrink-0 overflow-y-auto border-r border-line">{history}</aside>
          )
        ) : (
          <Sheet
            open={historyOpen}
            onClose={() => setHistoryOpen(false)}
            side="left"
            label={t("chat.history")}
            closeLabel={t("common.close")}
          >
            {history}
          </Sheet>
        )}

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center gap-1 border-b border-line px-2 py-1">
            <button
              type="button"
              onClick={() => (desktop ? setHistoryHidden(!historyHidden) : setHistoryOpen(true))}
              aria-label={
                desktop ? t(historyHidden ? "chat.history.show" : "chat.history.hide") : t("chat.history.open")
              }
              aria-expanded={desktop ? !historyHidden : historyOpen}
              title={desktop ? t(historyHidden ? "chat.history.show" : "chat.history.hide") : t("chat.history.open")}
              className={HEADER_BUTTON}
            >
              <PanelLeft aria-hidden size={18} />
            </button>
            <h1 className="min-w-0 flex-1 truncate text-[15px] font-semibold tracking-normal">{title}</h1>
            <button type="button" onClick={newChat} aria-label={t("chat.new")} title={t("chat.new")} className={HEADER_BUTTON}>
              <SquarePen aria-hidden size={18} />
            </button>
          </header>

          <div className={`flex min-h-0 flex-1 flex-col ${empty ? "justify-center overflow-y-auto" : ""}`}>
            <div
              ref={scrollerRef}
              onScroll={(e) => {
                const el = e.currentTarget;
                pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
              }}
              className={empty ? "" : "min-h-0 flex-1 overflow-y-auto"}
            >
              <div className="wrap">
                <div className="mx-auto flex max-w-[760px] flex-col gap-6 py-6">
                  {empty ? (
                    <div className="flex flex-col items-center gap-3 pt-6 text-center">
                      <h2 className="text-[clamp(28px,5vw,38px)]">{noDocs ? t("chat.noDocs") : t("chat.greeting")}</h2>
                      {noDocs && isAdmin && (
                        <Link href="/admin/documents" className={buttonClass("primary")}>
                          {t("chat.noDocs.admin")}
                        </Link>
                      )}
                    </div>
                  ) : (
                    <>
                      {messages.map((m, i) =>
                        m.role === "user" ? (
                          <UserMessage key={m.id} text={m.text} />
                        ) : (
                          <AssistantMessage
                            key={m.id}
                            message={m}
                            last={!pending && i === messages.length - 1}
                            lookup={lookup}
                            onOpenSource={setOpenSource}
                            onRetry={() => lastUser && send(lastUser.text, true)}
                            onFeedback={(value, comment) => feedback(m.id, value, comment)}
                            onAsk={(q) => send(q)}
                          />
                        ),
                      )}
                      {interrupted && lastUser && (
                        <div role="status" className="flex flex-col items-start gap-3 rounded-field bg-bg px-4 py-3 text-muted">
                          {t("chat.interrupted")}
                          <button
                            type="button"
                            onClick={() => send(lastUser.text, true)}
                            className={buttonClass("secondary")}
                          >
                            {t("chat.error.retry")}
                          </button>
                        </div>
                      )}
                      {pending && (
                        <>
                          <UserMessage text={pending.question} />
                          {pending.error ? (
                            <div
                              role="alert"
                              className={`flex flex-col items-start gap-3 rounded-field px-4 py-3 ${pending.error.kind === "network" ? "bg-danger-soft text-danger" : "bg-wait-soft text-wait"}`}
                            >
                              {pending.error.kind === "network" ? t("chat.error.network") : pending.error.text}
                              {pending.error.kind === "network" ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPending(null);
                                    send(pending.question, pending.replaceLast);
                                  }}
                                  className={buttonClass("secondary")}
                                >
                                  {t("chat.error.retry")}
                                </button>
                              ) : (
                                <Link href="/" className={buttonClass("secondary")}>
                                  {t("chat.limit.search")}
                                </Link>
                              )}
                            </div>
                          ) : (
                            <AssistantMessage
                              message={pending.message}
                              streaming={pending.streaming}
                              lookup={lookup}
                              onOpenSource={setOpenSource}
                              onAsk={(q) => send(q)}
                            />
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="wrap pt-2 pb-3">
              <div className="mx-auto flex max-w-[760px] flex-col gap-1.5">
                <Composer
                  inputRef={inputRef}
                  value={draft}
                  onChange={setDraft}
                  onSubmit={() => send(draft, editing)}
                  onStop={stop}
                  onEditLast={lastUser ? editLast : undefined}
                  onCancelEdit={cancelEdit}
                  busy={busy}
                  disabled={noDocs || missing}
                  editing={editing}
                  enterSends={!touch}
                  scope={activeScope}
                  onScope={setScope}
                  docs={docs ?? []}
                />
                {!touch && <p className="text-center text-xs text-muted">{t("chat.input.hint")}</p>}
              </div>
            </div>

            {empty && !noDocs && (
              <div className="wrap pb-6">
                <div className="mx-auto max-w-[760px]">
                  <Tiles items={examples} onPick={(q) => send(q)} />
                </div>
              </div>
            )}
          </div>
        </section>

        {source &&
          (desktop ? (
            <aside className="w-[420px] shrink-0 overflow-y-auto border-l border-line bg-surface">
              <SourcePanel source={source} onClose={() => setOpenSource(null)} />
            </aside>
          ) : (
            <Sheet open onClose={() => setOpenSource(null)} side="bottom" label={t("chat.source")}>
              <SourcePanel source={source} onClose={() => setOpenSource(null)} />
            </Sheet>
          ))}
      </main>
    </Tooltip.Provider>
  );
}
