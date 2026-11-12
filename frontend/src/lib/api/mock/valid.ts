import type { Chat, ChatMessage, Citation, Role } from "../types";

// localStorage is user-editable: anything read back is checked, broken entries are dropped.

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === "string";
const isStrArray = (v: unknown): v is string[] => Array.isArray(v) && v.every(isStr);
const optional = (v: unknown, check: (x: unknown) => boolean) => v === undefined || check(v);
export const ID = /^[\w-]{1,64}$/;
export const ROLES: Role[] = ["student", "staff", "admin"];

const isCitation = (v: unknown): v is Citation =>
  isObj(v) && Number.isInteger(v.index) && isStr(v.clauseId) && isStr(v.docId);

export const isMessage = (v: unknown): v is ChatMessage =>
  isObj(v) &&
  isStr(v.id) &&
  (v.role === "user" || v.role === "assistant") &&
  isStr(v.text) &&
  Array.isArray(v.citations) &&
  v.citations.every(isCitation) &&
  isStr(v.createdAt) &&
  optional(v.stopped, (x) => typeof x === "boolean") &&
  optional(v.feedback, (x) => x === "up" || x === "down") &&
  optional(v.feedbackComment, isStr) &&
  optional(v.steps, (x) => isObj(x) && isStr(x.text) && isStrArray(x.docs)) &&
  optional(v.suggestions, isStrArray) &&
  optional(v.lang, (x) => x === "ru" || x === "kk" || x === "en");

const isScope = (v: unknown) => isObj(v) && (v.type === "all" || (v.type === "doc" && isStr(v.docId)));

export const isChat = (v: unknown): v is Chat =>
  isObj(v) &&
  isStr(v.id) &&
  ID.test(v.id) &&
  isStr(v.title) &&
  isScope(v.scope) &&
  Array.isArray(v.messages) &&
  v.messages.every(isMessage) &&
  isStr(v.updatedAt);

export function listOf<T>(v: unknown, check: (x: unknown) => x is T): T[] {
  return Array.isArray(v) ? v.filter(check) : [];
}

export function rolesMap(v: unknown): Record<string, Role> {
  if (!isObj(v)) return {};
  return Object.fromEntries(Object.entries(v).filter(([, r]) => ROLES.includes(r as Role))) as Record<string, Role>;
}

export type FeedbackEntry = { messageId: string; value: "up" | "down"; comment?: string };
export const isFeedback = (v: unknown): v is FeedbackEntry =>
  isObj(v) && isStr(v.messageId) && (v.value === "up" || v.value === "down") && optional(v.comment, isStr);

export const count = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : 0);
