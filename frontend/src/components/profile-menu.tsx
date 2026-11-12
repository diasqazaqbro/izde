"use client";

import { useTransition } from "react";
import * as Menu from "@radix-ui/react-dropdown-menu";
import { CircleUserRound, LogOut } from "lucide-react";
import { logout } from "@/lib/auth/actions";
import { useT } from "@/lib/i18n/client";

export function ProfileMenu({ email, roleLabel }: { email: string; roleLabel: string }) {
  const t = useT();
  const [, startTransition] = useTransition();
  return (
    <Menu.Root modal={false}>
      <Menu.Trigger
        aria-label={t("profile.open")}
        className="grid size-11 place-items-center rounded-full text-muted ring-line hover:text-fg data-[state=open]:bg-surface data-[state=open]:text-fg data-[state=open]:ring-1 sm:size-9"
      >
        <CircleUserRound aria-hidden size={22} />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content
          align="end"
          sideOffset={8}
          className="z-20 w-64 max-w-[calc(100vw-32px)] rounded-tile border border-line bg-surface p-1.5 shadow-panel"
        >
          <div className="px-3 py-2">
            <p className="text-sm break-all">{email}</p>
            <p className="text-[13px] text-muted">{roleLabel}</p>
          </div>
          <Menu.Separator className="my-1 h-px bg-line" />
          <Menu.Item
            onSelect={() => startTransition(() => logout())}
            className="flex min-h-11 cursor-pointer items-center gap-2 rounded-field px-3 text-[15px] focus-visible:outline-offset-[-3px] data-highlighted:bg-bg sm:min-h-9"
          >
            <LogOut aria-hidden size={16} className="text-muted" />
            {t("profile.logout")}
          </Menu.Item>
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}
