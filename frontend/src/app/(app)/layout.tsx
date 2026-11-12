import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { getSession } from "@/lib/auth/session";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getSession();
  if (!user) redirect("/login");
  return (
    // The chat fills exactly one screen and scrolls inside; other pages grow with content.
    <div className="flex min-h-dvh flex-col has-[[data-fullscreen]]:h-dvh">
      <Header user={user} />
      {children}
    </div>
  );
}
