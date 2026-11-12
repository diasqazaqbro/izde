import { NextResponse, type NextRequest } from "next/server";
import { parseSession, SESSION_COOKIE } from "./lib/auth/parse";

// Runs before every page: a per-request CSP nonce, then an optimistic session check.
// The (app) and (admin) layouts read the session again before rendering.

function csp(nonce: string) {
  const dev = process.env.NODE_ENV === "development";
  return [
    "default-src 'self'",
    // React needs eval in dev only (error stacks); Next puts the nonce on its own scripts
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    // dev: the error overlay injects styles without a nonce
    dev ? "style-src 'self' 'unsafe-inline'" : `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' blob: data:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'", // no framing by other sites (clickjacking); 'self' keeps same-site frames possible
  ].join("; ");
}

export function isAdminPath(pathname: string) {
  let path = pathname;
  try {
    path = decodeURIComponent(pathname); // "/%61dmin" is "/admin" for the router
  } catch {}
  return /^\/(admin|pricing)(\/|$)/.test(path);
}

export function proxy(request: NextRequest) {
  const user = parseSession(request.cookies.get(SESSION_COOKIE)?.value);
  const { pathname, search } = request.nextUrl;

  let redirect: URL | null = null;
  if (pathname === "/login") {
    if (user) redirect = new URL("/", request.url);
  } else if (!user) {
    redirect = new URL("/login", request.url);
    if (pathname !== "/") redirect.searchParams.set("next", pathname + search);
  } else if (isAdminPath(pathname) && user.role !== "admin") {
    redirect = new URL("/", request.url);
  }
  if (redirect) return NextResponse.redirect(redirect);

  const nonce = btoa(crypto.randomUUID());
  const policy = csp(nonce);
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", policy); // Next reads the nonce from here
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", policy);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|ico)$).*)"],
};
