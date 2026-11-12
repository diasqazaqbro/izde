// Small helpers for untrusted text: search highlights, links from data, uploaded files.

export const MAX_QUERY = 500; // characters of a search query that are used

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Splits text into [plain, match, plain, match, …]. Words are literal (escaped), deduplicated and capped,
// so a crafted query can neither inject a pattern nor build a huge one.
export function highlightParts(text: string, words: string[]): string[] {
  const unique = [...new Set(words.map((w) => w.toLowerCase()))].filter(Boolean).slice(0, 50);
  if (!unique.length) return [text];
  return text.split(new RegExp(`(${unique.map(escapeRegExp).join("|")})`, "gi"));
}

// Links that come from data (document sources) open only over http(s): no javascript:, data: or file:.
export function safeExternalUrl(url: string): string | undefined {
  try {
    const { protocol, href } = new URL(url);
    return protocol === "https:" || protocol === "http:" ? href : undefined;
  } catch {
    return undefined;
  }
}

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const UPLOAD_TYPES: Record<string, string[]> = {
  ".pdf": ["application/pdf"],
  ".docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
};
export const UPLOAD_ACCEPT = Object.keys(UPLOAD_TYPES).join(",");

// Client-side hint only: the browser reports the type from the extension. Phase 2 checks the content on the server.
export function checkUpload(file: { name: string; type: string; size: number }): "ok" | "type" | "size" {
  const ext = Object.keys(UPLOAD_TYPES).find((e) => file.name.toLowerCase().endsWith(e));
  if (!ext || (file.type && !UPLOAD_TYPES[ext].includes(file.type))) return "type";
  if (file.size === 0 || file.size > MAX_UPLOAD_BYTES) return "size";
  return "ok";
}
