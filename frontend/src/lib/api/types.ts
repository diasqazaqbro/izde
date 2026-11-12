// Data contract from docs/04-architecture.md. The mock and the future HTTP client both implement `Api`.

export type Lang = "ru" | "kk" | "en";
export type Role = "student" | "staff" | "admin";
export type SearchMode = "meaning" | "keyword";
export type DocStatus = "ready" | "queued" | "processing" | "failed";

export interface Doc {
  id: string;
  title: string;
  code: string | null;
  lang: Lang;
  org: string;
  sourceUrl: string;
  status: DocStatus;
  sections: string[];
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
  answer: { text: string; citations: Citation[] } | null; // only in "meaning" mode
}

export interface Filters {
  type?: string;
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

export interface Plan {
  id: "free" | "standard" | "campus";
  name: string;
  docLimit: number;
  priceLabel: string;
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
  sendMessage(chatId: string, text: string, signal: AbortSignal): AsyncIterable<ChatEvent>;
  setFeedback(chatId: string, messageId: string, value: "up" | "down"): Promise<void>;

  listDocs(): Promise<Doc[]>;
  uploadDoc(file: File): Promise<Doc>; // phase 1: rejects with "upload disabled in demo"
  getUsage(): Promise<{ plan: Plan; docCount: number }>;
  listPlans(): Promise<Plan[]>;
  checkout(planId: Plan["id"]): Promise<{ ok: boolean }>; // stub
}
