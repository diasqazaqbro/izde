"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { api, type Role } from "@/lib/api";
import { useT } from "@/lib/i18n/client";
import { useData } from "@/lib/use-data";
import { DataTable } from "@/components/ui/data-table";
import { DemoBadge } from "@/components/ui/demo-badge";

const ROLES: Role[] = ["student", "staff", "admin"];

export function Users() {
  const t = useT();
  const [data, reload] = useData(api.listUsers);
  const [saved, setSaved] = useState("");
  if (!data) return <p className="text-muted">{t("common.loading")}</p>;

  async function change(email: string, role: Role) {
    await api.setUserRole(email, role);
    await reload();
    setSaved(t("users.saved", { email }));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        {data.demo && <DemoBadge label={t("common.demo")} />}
        <p className="text-sm text-muted">{t("users.note")}</p>
      </div>
      <DataTable
        label={t("users.table")}
        cols="sm:grid-cols-[minmax(0,1fr)_200px]"
        columns={[t("users.col.email"), t("users.col.role")]}
        rows={data.users.map((u) => ({
          key: u.email,
          cells: [
            u.email,
            <span key="r" className="relative inline-flex items-center">
              <select
                value={u.role}
                onChange={(e) => change(u.email, e.target.value as Role)}
                aria-label={t("users.role.label", { email: u.email })}
                className="h-11 appearance-none rounded-full bg-bg pr-8 pl-3 text-sm text-fg sm:h-9"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {t(`role.${r}`)}
                  </option>
                ))}
              </select>
              <ChevronDown aria-hidden size={14} className="pointer-events-none absolute right-3 text-muted" />
            </span>,
          ],
        }))}
      />
      <p role="status" className="text-sm text-ok">
        {saved}
      </p>
    </div>
  );
}
