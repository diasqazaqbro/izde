import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { I18nProvider } from "@/lib/i18n/client";
import { getLang, getT } from "@/lib/i18n/server";
import "@/styles/globals.css";

// Fallback after the system font stack (SF on Apple devices), see docs/02-design.md.
const inter = Inter({ variable: "--font-inter", subsets: ["latin", "cyrillic", "cyrillic-ext"] });

// Android shrinks the layout when the keyboard opens, so the chat input stays visible.
export const viewport: Viewport = { interactiveWidget: "resizes-content" };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: { default: "Izde", template: "%s · Izde" }, description: t("meta.description") };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const lang = await getLang();
  return (
    // suppressHydrationWarning: browser extensions add attributes to <html> and <body> before React loads
    <html lang={lang} className={inter.variable} suppressHydrationWarning>
      <body className="min-h-dvh" suppressHydrationWarning>
        <I18nProvider lang={lang}>{children}</I18nProvider>
      </body>
    </html>
  );
}
