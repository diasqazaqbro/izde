import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChatEvent } from "../types";
import { timing } from "./browser";
import { chatApi } from "./chat";

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

async function collect(events: AsyncIterable<ChatEvent>) {
  const out: ChatEvent[] = [];
  for await (const e of events) out.push(e);
  return out;
}

const text = (events: ChatEvent[]) => events.map((e) => (e.type === "token" ? e.text : "")).join("");

beforeEach(() => {
  timing.factor = 0;
  vi.stubGlobal("localStorage", memoryStorage());
  vi.stubGlobal("document", { cookie: `izde_session=${encodeURIComponent('{"email":"s@iitu.edu.kz","role":"student"}')}; lang=ru` });
  vi.stubGlobal("navigator", { onLine: true });
});

describe("mock chat", () => {
  it("answers a known question with a cited clause and stores both messages", async () => {
    const chat = await chatApi.createChat({ type: "all" });
    const events = await collect(chatApi.sendMessage(chat.id, "можно ли пересдать экзамен", new AbortController().signal));
    expect(events[0]).toMatchObject({ type: "status", text: "Ищу в документах…" });
    expect(events.find((e) => e.type === "citation")).toMatchObject({ citation: { clauseId: "ap-15-3" } });
    expect(text(events)).toContain("FX");
    expect(text(events)).toMatch(/\[1\]$/);
    expect(events.at(-1)).toEqual({ type: "done" });

    const saved = await chatApi.getChat(chat.id);
    expect(saved.title).toBe("можно ли пересдать экзамен");
    expect(saved.messages.map((m) => m.role)).toEqual(["user", "assistant"]);
    expect(saved.messages[1].citations).toHaveLength(1);
    expect(saved.messages[1].suggestions).not.toContain("можно ли пересдать экзамен");
  });

  it("says the documents do not cover it and never cites anything", async () => {
    const chat = await chatApi.createChat({ type: "all" });
    const events = await collect(chatApi.sendMessage(chat.id, "где купить билеты в кино", new AbortController().signal));
    expect(text(events)).toBe("В документах этого нет.");
    expect(events.some((e) => e.type === "citation")).toBe(false);
    expect((await chatApi.getChat(chat.id)).messages[1].citations).toEqual([]);
  });

  it("limits the search to one document when the scope says so", async () => {
    const chat = await chatApi.createChat({ type: "doc", docId: "phd" });
    const events = await collect(chatApi.sendMessage(chat.id, "можно ли пересдать экзамен", new AbortController().signal));
    expect(text(events)).toBe("В документах этого нет.");
  });

  it("keeps the typed part and marks the answer as stopped", async () => {
    timing.factor = 1;
    const chat = await chatApi.createChat({ type: "all" });
    const controller = new AbortController();
    const typed: string[] = [];
    for await (const e of chatApi.sendMessage(chat.id, "выход из академического отпуска", controller.signal)) {
      if (e.type === "token") {
        typed.push(e.text);
        if (typed.length === 2) controller.abort();
      }
    }
    const answer = (await chatApi.getChat(chat.id)).messages[1];
    expect(answer.stopped).toBe(true);
    expect(answer.text).toBe(typed.join(""));
    expect(answer.suggestions).toBeUndefined();
  });

  it("replaces the last exchange on retry instead of appending", async () => {
    const chat = await chatApi.createChat({ type: "all" });
    const signal = new AbortController().signal;
    await collect(chatApi.sendMessage(chat.id, "сколько можно пропускать пары", signal));
    await collect(chatApi.sendMessage(chat.id, "сколько можно пропускать пары", signal, { replaceLast: true }));
    expect((await chatApi.getChat(chat.id)).messages).toHaveLength(2);
  });

  it("throws like a failed fetch when offline and stores nothing", async () => {
    vi.stubGlobal("navigator", { onLine: false });
    const chat = await chatApi.createChat({ type: "all" });
    await expect(collect(chatApi.sendMessage(chat.id, "вопрос", new AbortController().signal))).rejects.toThrow();
    expect((await chatApi.getChat(chat.id)).messages).toEqual([]);
  });

  it("stops at the daily limit of the plan (Free: 20)", async () => {
    const chat = await chatApi.createChat({ type: "all" });
    localStorage.setItem(`izde.usage.s@iitu.edu.kz.${new Date().toISOString().slice(0, 10)}`, "20");
    const events = await collect(chatApi.sendMessage(chat.id, "вопрос", new AbortController().signal));
    expect(events).toEqual([{ type: "error", message: expect.stringContaining("лимит") }]);
  });

  it("keeps a separate history per user", async () => {
    await chatApi.createChat({ type: "all" });
    vi.stubGlobal("document", { cookie: `izde_session=${encodeURIComponent('{"email":"other@iitu.edu.kz","role":"student"}')}` });
    expect(await chatApi.listChats()).toEqual([]);
  });
});
