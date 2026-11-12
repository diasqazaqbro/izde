import { NextResponse, type NextRequest } from "next/server";
import { parseSession, SESSION_COOKIE } from "@/lib/auth/session";

// Optimistic check only: the (app) layout reads the session again before rendering.
export function proxy(request: NextRequest) {
  const user = parseSession(request.cookies.get(SESSION_COOKIE)?.value);
  const { pathname, search } = request.nextUrl;

  if (pathname === "/login") {
    return user ? NextResponse.redirect(new URL("/", request.url)) : NextResponse.next();
  }
  if (!user) {
    const url = new URL("/login", request.url);
    if (pathname !== "/") url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  const adminOnly = pathname === "/pricing" || pathname === "/admin" || pathname.startsWith("/admin/");
  if (adminOnly && user.role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|ico)$).*)"],
};
