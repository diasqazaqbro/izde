import type { Clause, Doc, SearchHit, SearchMode } from "../types";
import { CLAUSES, DOCS, type MockClause } from "./data";

function words(q: string) {
  return q
    .toLowerCase()
    .split(/[^a-zа-яёәғқңөұүһі0-9%]+/i)
    .filter((w) => w.length >= 3);
}

export function toClause({ id, docId, number, section, text }: MockClause): Clause {
  return { id, docId, number, section, text };
}

export function docById(id: string): Doc {
  const doc = DOCS.find((d) => d.id === id);
  if (!doc) throw new Error(`Unknown document: ${id}`);
  return doc;
}

// ponytail: matching ported as is from prototype.html (substring words + hand-made tags).
// Phase 2 replaces it with the real keyword and embedding search on the backend.
export function match(q: string, mode: SearchMode): { source: MockClause; hit: SearchHit }[] {
  const ql = q.toLowerCase();
  const ws = words(q);
  return CLAUSES.flatMap((c) => {
    const doc = docById(c.docId);
    const hay = `${c.text} ${c.section} ${doc.title}`.toLowerCase();
    const highlights = ws.filter((w) => hay.includes(w));
    let score = highlights.length * 2;
    if (mode === "meaning") score += c.tags.filter((t) => ql.includes(t)).length * 3;
    return score > 0 ? [{ source: c, hit: { clause: toClause(c), doc, score, highlights } }] : [];
  }).sort((a, b) => b.hit.score - a.hit.score);
}
