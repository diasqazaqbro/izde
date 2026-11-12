import type { Lang } from "../types";

// Browser-side helpers for the parts of the mock that keep state in localStorage
// (chats, plan, roles). The HTTP client will not need any of this.

function readCookie(name: string) {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : undefined;
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

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
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
