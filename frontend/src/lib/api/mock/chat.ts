import { MAX_QUESTION, type Api, type Chat, type ChatEvent, type ChatMessage, type Citation } from "../types";
import { makeT } from "../../i18n";
import { countQuestion, currentPlan, questionsToday } from "./billing";
import { currentEmail, currentLang, readJSON, sleep, uid, writeJSON } from "./browser";
import { match } from "./search";

// Chat history lives in this browser's localStorage, one list per user (docs/03-chat.md, phase 1).

const key = () => `izde.chats.${currentEmail()}`;
const load = () => readJSON<Chat[]>(key(), []);
const save = (chats: Chat[]) => writeJSON(key(), chats);
const now = () => new Date().toISOString();

function update(id: string, change: (chat: Chat) => void) {
  const chats = load();
  const chat = chats.find((c) => c.id === id);
  if (!chat) throw new Error(`Chat not found: ${id}`);
  change(chat);
  chat.updatedAt = now();
  save(chats);
}

function titleFrom(text: string) {
  const line = text.replace(/\s+/g, " ").trim();
  return line.length > 60 ? `${line.slice(0, 57)}…` : line;
}

// Drops the last question and everything after it.
export function dropLastExchange(messages: ChatMessage[]) {
  const i = messages.findLastIndex((m) => m.role === "user");
  return i < 0 ? messages : messages.slice(0, i);
}

async function* sendMessage(
  chatId: string,
  text: string,
  signal: AbortSignal,
  { scope: newScope, replaceLast = false }: Parameters<Api["sendMessage"]>[3] = {},
): AsyncGenerator<ChatEvent> {
  // What a failed fetch looks like to the caller.
  if (typeof navigator !== "undefined" && navigator.onLine === false) throw new TypeError("Failed to fetch");

  const t = makeT(currentLang());
  const question = text.trim().slice(0, MAX_QUESTION);
  if (!question) return;
  if (questionsToday() >= currentPlan().questionLimit) {
    yield { type: "error", message: t("chat.limit") };
    return;
  }

  let scope: Chat["scope"] = { type: "all" };
  update(chatId, (c) => {
    if (replaceLast) c.messages = dropLastExchange(c.messages);
    scope = c.scope = newScope ?? c.scope;
    c.messages.push({ id: uid(), role: "user", text: question, citations: [], createdAt: now() });
    if (!c.title) c.title = titleFrom(question);
  });
  countQuestion();

  let answer = "";
  let steps: ChatMessage["steps"];
  let suggestions: string[] | undefined;
  const citations: Citation[] = [];
  try {
    yield { type: "status", text: t("chat.status.searching") };
    await sleep(800, signal);
    if (signal.aborted) return;

    const inScope = (q: string) =>
      match(q, "meaning").filter((f) => scope.type === "all" || f.hit.doc.id === scope.docId);
    const found = inScope(question);
    const docs = [...new Set(found.map((f) => f.hit.doc.title))];
    steps = {
      text: found.length
        ? t("chat.status.found", { n: found.length, docs: docs.length })
        : t("chat.status.none"),
      docs,
    };
    yield { type: "status", ...steps };
    await sleep(400, signal);

    const top = found[0]?.source;
    if (top) {
      const citation = { index: 1, clauseId: top.id, docId: top.docId };
      citations.push(citation);
      yield { type: "citation", citation };
    }
    // ponytail: prepared Russian answers from docs/05-data.md, typed out word by word.
    for (const piece of (top ? `${top.answer} [1]` : t("chat.noAnswer")).match(/\S+\s*/g) ?? []) {
      if (signal.aborted) return;
      answer += piece;
      yield { type: "token", text: piece };
      await sleep(25 + Math.random() * 35, signal);
    }
    if (signal.aborted) return;

    suggestions = [1, 2, 3, 4]
      .map((n) => t(`example.${n as 1 | 2 | 3 | 4}`))
      .filter((q) => q !== question && inScope(q).length > 0)
      .slice(0, 3);
    yield { type: "suggestions", items: suggestions };
    yield { type: "done" };
  } finally {
    const reply: ChatMessage = {
      id: uid(),
      role: "assistant",
      text: answer,
      citations: answer ? citations : [],
      steps,
      suggestions,
      createdAt: now(),
    };
    if (signal.aborted) reply.stopped = true;
    try {
      update(chatId, (c) => c.messages.push(reply));
    } catch {
      // the chat was deleted while answering
    }
  }
}

export const chatApi: Pick<
  Api,
  "listChats" | "getChat" | "createChat" | "renameChat" | "deleteChat" | "sendMessage" | "setFeedback"
> = {
  async listChats() {
    return load().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async getChat(id) {
    const chat = load().find((c) => c.id === id);
    if (!chat) throw new Error(`Chat not found: ${id}`);
    return chat;
  },

  async createChat(scope, seed = []) {
    const first = seed.find((m) => m.role === "user");
    const chat: Chat = { id: uid(), title: first ? titleFrom(first.text) : "", scope, messages: seed, updatedAt: now() };
    save([chat, ...load()]);
    return chat;
  },

  async renameChat(id, title) {
    if (title.trim()) update(id, (c) => (c.title = titleFrom(title)));
  },

  async deleteChat(id) {
    save(load().filter((c) => c.id !== id));
  },

  sendMessage,

  async setFeedback(chatId, messageId, value, comment) {
    update(chatId, (c) => {
      const m = c.messages.find((x) => x.id === messageId);
      if (!m) return;
      m.feedback = value;
      m.feedbackComment = value === "down" ? comment?.trim() || undefined : undefined;
    });
  },
};
