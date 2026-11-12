import type { DocStatus } from "@/lib/api";

const TONES: Record<DocStatus, string> = {
  ready: "text-ok bg-ok-soft",
  queued: "text-wait bg-wait-soft",
  processing: "text-wait bg-wait-soft",
  failed: "text-danger bg-danger-soft",
};

// The label carries the state too, colour is never the only signal.
export function StatusPill({ status, label }: { status: DocStatus; label: string }) {
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[13px] font-semibold ${TONES[status]}`}
    >
      <span aria-hidden className="size-[7px] rounded-full bg-current" />
      {label}
    </span>
  );
}
