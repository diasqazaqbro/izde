"use client";

export function Segmented<V extends string>({
  label,
  options,
  value,
  onChange,
  className = "",
}: {
  label: string;
  options: { value: V; label: string }[];
  value: V;
  onChange: (value: V) => void;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`grid auto-cols-fr grid-flow-col gap-[3px] rounded-field bg-bg p-[3px] ${className}`}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className="min-h-11 rounded-[9px] px-[18px] py-1.5 text-sm text-muted hover:text-fg aria-pressed:bg-surface aria-pressed:font-semibold aria-pressed:text-fg aria-pressed:shadow-[0_1px_3px_rgb(0_0_0/0.12)] sm:min-h-[34px]"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
