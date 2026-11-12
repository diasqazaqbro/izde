"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import { isEmail, safeNext, SESSION_COOKIE, SESSION_MAX_AGE } from "./parse";

export async function login(_prev: unknown, form: FormData) {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const role = form.get("role") === "admin" ? "admin" : "student";
  if (!isEmail(email) || !password) return { error: true };

  const user = await api.login(email, password, role);
  (await cookies()).set(SESSION_COOKIE, JSON.stringify(user), {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production", // browsers accept Secure on http://localhost
    maxAge: SESSION_MAX_AGE,
  });
  redirect(safeNext(form.get("next")));
}

export async function logout() {
  await api.logout();
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
