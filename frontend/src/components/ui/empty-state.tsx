import type { ReactNode } from "react";

export function EmptyState({ title, text, children }: { title: string; text: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-card border border-line bg-surface px-[22px] py-7">
      <h2 className="text-xl">{title}</h2>
      <p className="text-muted">{text}</p>
      {children}
    </div>
  );
}
