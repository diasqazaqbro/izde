import type { ReactNode } from "react";
import { ChatApp } from "@/components/chat/chat-app";
import { getSession } from "@/lib/auth/session";

// The chat lives in the layout so it stays mounted (and keeps streaming) when /chat becomes /chat/[id].
export default async function ChatLayout({ children }: { children: ReactNode }) {
  const user = await getSession();
  return (
    <>
      <ChatApp isAdmin={user?.role === "admin"} />
      {children}
    </>
  );
}
