import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { getSession } from "@/lib/auth/session";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getSession();
  if (!user) redirect("/login");
  return (
    <>
      <Header user={user} />
      <main className="wrap pt-6 pb-14 sm:pt-10 sm:pb-[72px]">{children}</main>
    </>
  );
}
