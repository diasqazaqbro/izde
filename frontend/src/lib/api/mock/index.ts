import type { Api, Clause, SearchHit, SearchMode } from "../types";
import { CLAUSES, DOCS, type MockClause } from "./data";

// Step 1 covers auth, search and documents. Chat and billing methods come with steps 2 and 3.
type MockApi = Pick<Api, "login" | "logout" | "search" | "getDoc" | "listDocs">;

function words(q: string) {
  return q
    .toLowerCase()
    .split(/[^a-zа-яёәғқңөұүһі0-9%]+/i)
    .filter((w) => w.length >= 3);
}

function toClause({ id, docId, number, section, text }: MockClause): Clause {
  return { id, docId, number, section, text };
}

function docById(id: string) {
  const doc = DOCS.find((d) => d.id === id);
  if (!doc) throw new Error(`Unknown document: ${id}`);
  return doc;
}

// ponytail: matching ported as is from prototype.html (substring words + hand-made tags).
// Phase 2 replaces it with the real keyword and embedding search on the backend.
function match(q: string, mode: SearchMode) {
  const ql = q.toLowerCase();
  const ws = words(q);
  return CLAUSES.flatMap((c) => {
    const doc = docById(c.docId);
    const hay = `${c.text} ${c.section} ${doc.title}`.toLowerCase();
    const highlights = ws.filter((w) => hay.includes(w));
    let score = highlights.length * 2;
    if (mode === "meaning") score += c.tags.filter((t) => ql.includes(t)).length * 3;
    return score > 0 ? [{ source: c, hit: { clause: toClause(c), doc, score, highlights } satisfies SearchHit }] : [];
  }).sort((a, b) => b.hit.score - a.hit.score);
}

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
};
