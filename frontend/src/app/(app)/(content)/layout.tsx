import type { ReactNode } from "react";

export default function ContentLayout({ children }: { children: ReactNode }) {
  return <main className="wrap pt-6 pb-14 sm:pt-10 sm:pb-[72px]">{children}</main>;
}
