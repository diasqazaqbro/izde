"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import { SESSION_COOKIE } from "./parse";

export async function login(_prev: unknown, form: FormData) {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const role = form.get("role") === "admin" ? "admin" : "student";
  const next = String(form.get("next") ?? "");
  if (!email || !password) return { error: true };

  const user = await api.login(email, password, role);
  (await cookies()).set(SESSION_COOKIE, JSON.stringify(user), { path: "/", sameSite: "lax" });
  // Only same-site paths: "//host" would leave the site.
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
}

export async function logout() {
  await api.logout();
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
