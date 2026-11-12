import { describe, expect, it } from "vitest";
import { en } from "../../i18n/en";
import { kk } from "../../i18n/kk";
import { ru } from "../../i18n/ru";
import { mockApi } from ".";

describe("mock search", () => {
  it("answers every home page example in meaning mode, in all three languages", async () => {
    const expected = ["ap-15-3", "ap-10-3", "ap-29-7", "phd-8-2"];
    for (const dict of [ru, kk, en])
      for (const [i, key] of (["example.1", "example.2", "example.3", "example.4"] as const).entries()) {
        const { hits, answer } = await mockApi.search(dict[key], "meaning");
        expect(hits[0]?.clause.id, dict[key]).toBe(expected[i]);
        expect(answer?.citations[0].clauseId).toBe(hits[0].clause.id);
      }
  });

  it("filters by document type and by empty year", async () => {
    expect((await mockApi.search("retake", "keyword", { type: "regulation" })).hits).toEqual([]);
    expect((await mockApi.search("retake", "keyword", { type: "policy", year: "none" })).hits).toHaveLength(2);
    expect((await mockApi.search("retake", "keyword", { year: "2024" })).hits).toEqual([]);
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
