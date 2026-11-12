export function DemoBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex w-fit items-center rounded-full border border-dashed border-line bg-surface px-2.5 py-0.5 text-xs font-semibold text-muted">
      {label}
    </span>
  );
}
