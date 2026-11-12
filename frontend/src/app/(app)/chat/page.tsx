import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("nav.chat") };
}

// Rendered by ChatApp in the layout.
export default function NewChatPage() {
  return null;
}
