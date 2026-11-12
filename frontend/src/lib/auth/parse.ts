import type { Role, User } from "@/lib/api";

// Phase 1 mock session: the user is stored in a cookie as JSON, nothing is signed or verified.
// The cookie is readable from JS on purpose: the mock keeps chat history per user in localStorage.
// Phase 2: the backend issues an httpOnly, signed session and checks the role on every request.
export const SESSION_COOKIE = "izde_session";
export const SESSION_MAX_AGE = 60 * 60 * 12; // 12 hours

const ROLES: Role[] = ["student", "staff", "admin"];

export function parseSession(value: string | undefined): User | null {
  if (!value) return null;
  try {
    const { email, role } = JSON.parse(value);
    return isEmail(email) && ROLES.includes(role) ? { email, role } : null;
  } catch {
    return null;
  }
}

export function isEmail(value: unknown): value is string {
  return typeof value === "string" && value.length <= 254 && /^[^\s@<>"]+@[^\s@<>"]+$/.test(value);
}

// Where to go after login: only a path on this site. The URL parser is the judge, so
// "//evil.com", "/\evil.com", "/\t/evil.com" and "https://evil.com" all resolve to another origin and fall back to "/".
export function safeNext(next: unknown): string {
  if (typeof next !== "string" || !next.startsWith("/")) return "/";
  try {
    const base = "http://izde.invalid";
    const url = new URL(next, base);
    return url.origin === base ? url.pathname + url.search + url.hash : "/";
  } catch {
    return "/";
  }
}
