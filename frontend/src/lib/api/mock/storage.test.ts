import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChatEvent } from "../types";
import { adminApi } from "./admin";
import { timing } from "./browser";
import { chatApi } from "./chat";

const data = new Map<string, string>();
const KEY = "izde.chats.s@iitu.edu.kz";

beforeEach(() => {
  timing.factor = 0;
  data.clear();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    key: (i: number) => [...data.keys()][i] ?? null,
    get length() {
      return data.size;
    },
  });
  vi.stubGlobal("document", { cookie: `izde_session=${encodeURIComponent('{"email":"s@iitu.edu.kz","role":"student"}')}; lang=en` });
  vi.stubGlobal("navigator", { onLine: true });
});

const drain = async (it: AsyncIterable<ChatEvent>) => {
  for await (const e of it) void e;
};

describe("broken or edited localStorage", () => {
  it.each([
    ["broken JSON", "{oops"],
    ["an object", '{"a":1}'],
    ["a string", '"hello"'],
    ["chats of the wrong shape", '[{"id":1},{"id":"x","title":"t","scope":{"type":"all"},"messages":[{"text":5}],"updatedAt":"x"}]'],
    ["a chat with a bad id", '[{"id":"../admin","title":"t","scope":{"type":"all"},"messages":[],"updatedAt":"x"}]'],
  ])("ignores %s instead of crashing", async (_, raw) => {
    data.set(KEY, raw);
    await expect(chatApi.listChats()).resolves.toEqual([]);
    await expect(adminApi.getAnalytics()).resolves.toMatchObject({ feedback: { up: 0, down: 0 } });
  });

  it("keeps the valid chats next to broken ones", async () => {
    const good = { id: "abc", title: "<img src=x onerror=alert(1)>", scope: { type: "all" }, messages: [], updatedAt: "2026-01-01" };
    data.set(KEY, JSON.stringify([good, { id: 5 }, null]));
    expect(await chatApi.listChats()).toEqual([good]);
  });

  it("treats garbage usage, plan and roles as defaults", async () => {
    data.set(`izde.usage.s@iitu.edu.kz.${new Date().toISOString().slice(0, 10)}`, '"lots"');
    data.set("izde.plan", '{"id":"campus"}');
    data.set("izde.roles", '{"student1@iitu.edu.kz":"root","student2@iitu.edu.kz":"admin"}');
    expect((await adminApi.getUsage()).plan.id).toBe("free");
    const { users } = await adminApi.listUsers();
    expect(users.find((u) => u.email === "student1@iitu.edu.kz")?.role).toBe("student");
    expect(users.find((u) => u.email === "student2@iitu.edu.kz")?.role).toBe("admin");
    await adminApi.setUserRole("hacker@evil.com", "admin");
    expect(data.get("izde.roles")).not.toContain("hacker");
  });
});

describe("hand-edited cookies", () => {
  it("survive a broken %-escape instead of throwing", async () => {
    vi.stubGlobal("document", { cookie: "izde_session=%E0%A4%A; lang=%E0" });
    const chat = await chatApi.createChat({ type: "all" });
    await drain(chatApi.sendMessage(chat.id, "можно ли пересдать экзамен", new AbortController().signal));
    expect((await chatApi.getChat(chat.id)).messages).toHaveLength(2);
  });
});

describe("feedback and answer language", () => {
  it("keeps a 'Не то' rating counted after the answer is retried", async () => {
    const chat = await chatApi.createChat({ type: "all" });
    const signal = new AbortController().signal;
    await drain(chatApi.sendMessage(chat.id, "можно ли пересдать экзамен", signal));
    const first = (await chatApi.getChat(chat.id)).messages[1];
    await chatApi.setFeedback(chat.id, first.id, "down", "  нужны сроки  ");
    await drain(chatApi.sendMessage(chat.id, "можно ли пересдать экзамен", signal, { replaceLast: true }));
    const after = await chatApi.getChat(chat.id);
    expect(after.messages).toHaveLength(2);
    expect(after.messages[1].id).not.toBe(first.id);
    expect((await adminApi.getAnalytics()).feedback).toEqual({ up: 0, down: 1, comments: ["нужны сроки"] });
  });

  it("changing a rating replaces it instead of counting twice", async () => {
    const chat = await chatApi.createChat({ type: "all" });
    await drain(chatApi.sendMessage(chat.id, "можно ли пересдать экзамен", new AbortController().signal));
    const answer = (await chatApi.getChat(chat.id)).messages[1];
    await chatApi.setFeedback(chat.id, answer.id, "down");
    await chatApi.setFeedback(chat.id, answer.id, "up");
    expect((await adminApi.getAnalytics()).feedback).toMatchObject({ up: 1, down: 0 });
  });

  it("marks prepared answers as Russian and 'not in the documents' in the interface language", async () => {
    const chat = await chatApi.createChat({ type: "all" });
    const signal = new AbortController().signal;
    await drain(chatApi.sendMessage(chat.id, "can I retake an exam", signal));
    await drain(chatApi.sendMessage(chat.id, "where to buy cinema tickets", signal));
    const [, found, , none] = (await chatApi.getChat(chat.id)).messages;
    expect(found.lang).toBe("ru");
    expect(none).toMatchObject({ lang: "en", text: "The documents do not cover this." });
  });
});
