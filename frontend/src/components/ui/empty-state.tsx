import type { ReactNode } from "react";

export function EmptyState({
  title,
  text,
  children,
  heading: Heading = "h2",
}: {
  title: string;
  text: string;
  children?: ReactNode;
  heading?: "h1" | "h2";
}) {
  return (
    <div className="flex flex-col gap-3 rounded-card border border-line bg-surface px-[22px] py-7">
      <Heading className="text-xl">{title}</Heading>
      <p className="text-muted">{text}</p>
      {children}
    </div>
  );
}
