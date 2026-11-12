import type { Api, Doc, Filters } from "../types";
import { adminApi } from "./admin";
import { chatApi } from "./chat";
import { CLAUSES, DOCS } from "./data";
import { docById, match, toClause } from "./search";

function passes(doc: Doc, { type, year, dept }: Filters) {
  const same = (value: string | number | null, wanted?: string) =>
    !wanted || (wanted === "none" ? value === null : String(value) === wanted);
  return (!type || doc.type === type) && same(doc.year, year) && same(doc.dept, dept);
}

export const mockApi: Api = {
  async login(email, _password, role) {
    return { email, role };
  },

  async logout() {},

  async search(q, mode, filters = {}) {
    const found = match(q, mode).filter(({ hit: { doc } }) => passes(doc, filters));
    const top = found[0]?.source;
    return {
      hits: found.map((f) => f.hit),
      answer:
        mode === "meaning" && top
          ? { text: top.answer, citations: [{ index: 1, clauseId: top.id, docId: top.docId }], lang: "ru" }
          : null,
    };
  },

  async getDoc(id) {
    return { doc: docById(id), clauses: CLAUSES.filter((c) => c.docId === id).map(toClause) };
  },

  async listDocs() {
    return DOCS;
  },

  ...chatApi,
  ...adminApi,
};
