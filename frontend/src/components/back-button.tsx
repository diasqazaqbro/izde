"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackButton({ label }: { label: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      // Opened from a shared link there is no history to go back to.
      onClick={() => (history.length > 1 ? router.back() : router.push("/"))}
      className="inline-flex min-h-11 w-fit items-center gap-1.5 text-[15px] text-accent hover:underline sm:min-h-9"
    >
      <ArrowLeft aria-hidden size={18} />
      {label}
    </button>
  );
}
