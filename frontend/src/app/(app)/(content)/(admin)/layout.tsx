import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminTabs } from "@/components/admin/tabs";
import { getSession } from "@/lib/auth/session";

// Admin pages and pricing: the proxy already redirects non-admins, this is the second check.
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getSession();
  if (user?.role !== "admin") redirect("/");
  return (
    <div className="mx-auto flex max-w-[1040px] flex-col gap-6">
      <AdminTabs />
      {children}
    </div>
  );
}
