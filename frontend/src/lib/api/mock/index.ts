import type { Api } from "../types";
import { chatApi } from "./chat";
import { CLAUSES, DOCS } from "./data";
import { docById, match, toClause } from "./search";

// Billing and admin methods come with step 3.
type MockApi = Pick<Api, "login" | "logout" | "search" | "getDoc" | "listDocs"> & typeof chatApi;

export const mockApi: MockApi = {
  async login(email, _password, role) {
    return { email, role };
  },

  async logout() {},

  async search(q, mode) {
    const found = match(q, mode);
    const top = found[0]?.source;
    return {
      hits: found.map((f) => f.hit),
      answer:
        mode === "meaning" && top
          ? { text: top.answer, citations: [{ index: 1, clauseId: top.id, docId: top.docId }] }
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
};
