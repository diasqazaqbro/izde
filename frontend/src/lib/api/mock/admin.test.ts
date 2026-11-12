import { beforeEach, describe, expect, it, vi } from "vitest";
import { UPLOAD_DISABLED } from "../types";
import { adminApi, DEMO_NO_RESULTS } from "./admin";
import { timing } from "./browser";
import { chatApi } from "./chat";
import { match } from "./search";

beforeEach(() => {
  timing.factor = 0;
  const data = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    key: (i: number) => [...data.keys()][i] ?? null,
    get length() {
      return data.size;
    },
  });
  vi.stubGlobal("document", { cookie: `izde_session=${encodeURIComponent('{"email":"a@iitu.edu.kz","role":"admin"}')}` });
  vi.stubGlobal("navigator", { onLine: true });
});

describe("mock admin", () => {
  it("demo 'no result' queries really find nothing in either mode", () => {
    for (const { query } of DEMO_NO_RESULTS) {
      expect(match(query, "meaning"), query).toEqual([]);
      expect(match(query, "keyword"), query).toEqual([]);
    }
  });

  it("checkout switches the current plan", async () => {
    expect((await adminApi.getUsage()).plan.id).toBe("free");
    expect(await adminApi.checkout("campus")).toEqual({ ok: true });
    expect((await adminApi.getUsage()).plan).toMatchObject({ id: "campus", docLimit: 10000 });
  });

  it("upload is disabled in the demo", async () => {
    await expect(adminApi.uploadDoc(new File(["x"], "a.pdf"))).rejects.toThrow(UPLOAD_DISABLED);
  });

  it("role changes persist", async () => {
    await adminApi.setUserRole("student1@iitu.edu.kz", "staff");
    const { users } = await adminApi.listUsers();
    expect(users.find((u) => u.email === "student1@iitu.edu.kz")?.role).toBe("staff");
  });

  it("counts real answer feedback from chats", async () => {
    const chat = await chatApi.createChat({ type: "all" });
    for await (const e of chatApi.sendMessage(chat.id, "можно ли пересдать экзамен", new AbortController().signal)) void e;
    const answer = (await chatApi.getChat(chat.id)).messages[1];
    await chatApi.setFeedback(chat.id, answer.id, "down", "мало деталей");
    expect((await adminApi.getAnalytics()).feedback).toEqual({ up: 0, down: 1, comments: ["мало деталей"] });
  });
});
