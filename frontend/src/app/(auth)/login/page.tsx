import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import { LoginForm } from "./login-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("login.title") };
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  return (
    <main className="wrap grid min-h-dvh place-items-center py-8">
      <LoginForm next={typeof next === "string" ? next : ""} />
    </main>
  );
}
