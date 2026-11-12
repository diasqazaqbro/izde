import type { ComponentProps } from "react";

export function Field({ label, ...props }: ComponentProps<"input"> & { label: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm text-muted">
      {label}
      <input
        className="min-h-11 rounded-field border border-line bg-bg px-3.5 py-3 text-base text-fg"
        {...props}
      />
    </label>
  );
}
