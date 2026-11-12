import type { Role, User } from "@/lib/api";

// Phase 1 mock session: the user is stored in a cookie as JSON, nothing is signed or verified.
// The cookie is readable from JS on purpose: the mock keeps chat history per user in localStorage.
export const SESSION_COOKIE = "izde_session";

const ROLES: Role[] = ["student", "staff", "admin"];

export function parseSession(value: string | undefined): User | null {
  if (!value) return null;
  try {
    const { email, role } = JSON.parse(value);
    return typeof email === "string" && ROLES.includes(role) ? { email, role } : null;
  } catch {
    return null;
  }
}
