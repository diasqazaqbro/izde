import Link from "next/link";
import type { User } from "@/lib/api";
import { getLang, getT } from "@/lib/i18n/server";
import { LangSelect } from "./lang-select";
import { Nav } from "./nav";
import { ProfileMenu } from "./profile-menu";

export async function Header({ user }: { user: User }) {
  const t = await getT();
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-page/85 pt-[env(safe-area-inset-top)] backdrop-blur-lg backdrop-saturate-180">
      <div className="wrap">
        <div className="mx-auto flex max-w-[1040px] items-center gap-2 py-2.5 sm:gap-5">
          <Link href="/" aria-label={t("header.home")} className="rounded-md px-0.5 py-1.5 text-xl font-bold tracking-[-0.03em]">
            Izde
          </Link>
          <span className="rounded-full border border-line px-2.5 py-0.5 text-[13px] text-muted">{t("header.org")}</span>
          <div className="ml-auto flex items-center gap-1">
            <Nav />
            <LangSelect lang={await getLang()} />
            <ProfileMenu email={user.email} roleLabel={t(`role.${user.role}`)} />
          </div>
        </div>
      </div>
    </header>
  );
}
