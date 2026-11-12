import { describe, expect, it } from "vitest";
import { ru } from "../../i18n/ru";
import { mockApi } from ".";

describe("mock search", () => {
  it("answers every home page example in meaning mode", async () => {
    for (const key of ["example.1", "example.2", "example.3", "example.4"] as const) {
      const { hits, answer } = await mockApi.search(ru[key], "meaning");
      expect(hits.length, ru[key]).toBeGreaterThan(0);
      expect(answer?.citations[0].clauseId).toBe(hits[0].clause.id);
    }
  });

  it("puts the FX retake clause first for the retake question", async () => {
    const { hits, answer } = await mockApi.search("можно ли пересдать экзамен", "meaning");
    expect(hits[0].clause.id).toBe("ap-15-3");
    expect(answer?.text).toContain("FX");
  });

  it("keyword mode matches exact words only and gives no answer", async () => {
    expect((await mockApi.search("можно ли пересдать экзамен", "keyword")).hits).toEqual([]);
    const { hits, answer } = await mockApi.search("retake", "keyword");
    expect(hits.map((h) => h.clause.id).sort()).toEqual(["ap-15-3", "ap-28-4"]);
    expect(hits[0].highlights).toEqual(["retake"]);
    expect(answer).toBeNull();
  });

  it("does not leak mock-only fields into clauses", async () => {
    const { clauses } = await mockApi.getDoc("ap");
    expect(Object.keys(clauses[0]).sort()).toEqual(["docId", "id", "number", "section", "text"]);
  });
});
