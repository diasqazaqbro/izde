import type { Lang } from "../types";

// Browser-side helpers for the parts of the mock that keep state in localStorage
// (chats, plan, roles). The HTTP client will not need any of this.

function readCookie(name: string) {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  try {
    return m ? decodeURIComponent(m[1]) : undefined;
  } catch {
    return undefined; // a hand-edited cookie with a broken %-escape
  }
}

export function currentEmail() {
  try {
    return (JSON.parse(readCookie("izde_session") ?? "{}").email as string | undefined) ?? "anonymous";
  } catch {
    return "anonymous";
  }
}

export function currentLang(): Lang {
  const v = readCookie("lang");
  return v === "kk" || v === "en" ? v : "ru";
}

// Returns unknown on purpose: callers check the shape (see valid.ts), the user can edit localStorage.
export function readJSON(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

export function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // private mode or full storage: the demo keeps working, it just forgets
  }
}

export function uid() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

// Tests set this to 0 to skip the simulated delays.
export const timing = { factor: 1 };

export function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve) => {
    if (signal?.aborted) return resolve();
    const done = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", done);
      resolve();
    };
    const timer = setTimeout(done, ms * timing.factor);
    signal?.addEventListener("abort", done, { once: true });
  });
}
