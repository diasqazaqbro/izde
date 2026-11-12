// Data contract from docs/04-architecture.md. The mock and the future HTTP client both implement `Api`.

export type Lang = "ru" | "kk" | "en";
export type Role = "student" | "staff" | "admin";
export type SearchMode = "meaning" | "keyword";
export type DocStatus = "ready" | "queued" | "processing" | "failed";
export type DocType = "policy" | "regulation" | "rules" | "guide" | "code";

export interface Doc {
  id: string;
  title: string;
  code: string | null;
  lang: Lang;
  org: string;
  sourceUrl: string;
  status: DocStatus;
  sections: string[];
  type: DocType; // from the title: Policy, Regulations (Положение), Правила, Путеводитель, Кодекс
  year: number | null; // approval dates are empty in the PDFs (docs/05-data.md)
  dept: string | null; // same
}

export interface Clause {
  id: string;
  docId: string;
  number: string; // "п. 15.3"
  section: string;
  text: string; // verbatim quote
}

export interface SearchHit {
  clause: Clause;
  doc: Doc;
  score: number;
  highlights: string[];
}

export interface Citation {
  index: number;
  clauseId: string;
  docId: string;
}

export interface SearchResult {
  hits: SearchHit[];
  answer: { text: string; citations: Citation[]; lang: Lang } | null; // only in "meaning" mode
}

// "none" matches documents where the field is not filled in
export interface Filters {
  type?: DocType;
  year?: string;
  dept?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  citations: Citation[];
  stopped?: boolean;
  feedback?: "up" | "down";
  feedbackComment?: string;
  steps?: { text: string; docs: string[] }; // the last "status" event, kept for the expandable steps line
  suggestions?: string[];
  lang?: Lang; // language of an assistant answer; the UI notes when it differs from the interface
  createdAt: string;
}

export interface Chat {
  id: string;
  title: string;
  scope: { type: "all" } | { type: "doc"; docId: string };
  messages: ChatMessage[];
  updatedAt: string;
}

export type ChatEvent =
  | { type: "status"; text: string; docs?: string[] }
  | { type: "token"; text: string }
  | { type: "citation"; citation: Citation }
  | { type: "suggestions"; items: string[] }
  | { type: "done" }
  | { type: "error"; message: string };

export const MAX_QUESTION = 2000; // characters, docs/03-chat.md
export const UPLOAD_DISABLED = "upload_disabled"; // error message of uploadDoc in the demo

export interface SendOptions {
  scope?: Chat["scope"]; // the scope can change between questions in one chat
  replaceLast?: boolean; // retry or edit: replace the last question and answer instead of appending
}

export interface Plan {
  id: "free" | "standard" | "campus";
  name: string;
  docLimit: number;
  questionLimit: number; // chat questions per user per day
  price: number; // KZT per month, 0 for free; the UI formats it and marks it as an example
}

export interface Analytics {
  demo: boolean; // phase 1: query statistics do not exist yet, the UI marks them as demo data
  queriesWeek: number;
  topQueries: { query: string; count: number }[];
  noResults: { query: string; count: number }[];
  feedback: { up: number; down: number; comments: string[] }; // real: counted from the ratings log
}

export interface User {
  email: string;
  role: Role;
}

export interface Api {
  login(email: string, password: string, role: Role): Promise<User>;
  logout(): Promise<void>;

  search(q: string, mode: SearchMode, filters?: Filters): Promise<SearchResult>;
  getDoc(id: string): Promise<{ doc: Doc; clauses: Clause[] }>;

  listChats(): Promise<Chat[]>;
  getChat(id: string): Promise<Chat>;
  createChat(scope: Chat["scope"], seed?: ChatMessage[]): Promise<Chat>;
  renameChat(id: string, title: string): Promise<void>;
  deleteChat(id: string): Promise<void>;
  // Throws when the request fails (network); expected failures like the daily limit come as an "error" event.
  sendMessage(chatId: string, text: string, signal: AbortSignal, options?: SendOptions): AsyncIterable<ChatEvent>;
  setFeedback(chatId: string, messageId: string, value: "up" | "down", comment?: string): Promise<void>;

  listDocs(): Promise<Doc[]>;
  uploadDoc(file: File): Promise<Doc>; // phase 1: rejects with UPLOAD_DISABLED
  getUsage(): Promise<{ plan: Plan; docCount: number }>;
  listPlans(): Promise<Plan[]>;
  checkout(planId: Plan["id"]): Promise<{ ok: boolean }>; // stub

  getAnalytics(): Promise<Analytics>;
  listUsers(): Promise<{ users: User[]; demo: boolean }>;
  setUserRole(email: string, role: Role): Promise<void>;
}
