"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

const SIDES = {
  left: "my-0 ml-0 mr-auto h-dvh max-h-dvh w-[min(320px,85vw)] rounded-r-card",
  bottom: "mx-0 mb-0 mt-auto h-[85dvh] max-h-[85dvh] w-full max-w-full rounded-t-card",
  center: "m-auto max-h-[85dvh] w-[min(440px,calc(100vw-32px))] rounded-card",
};

// Native modal <dialog>: focus trap, Esc and inert background come from the browser.
export function Sheet({
  open,
  onClose,
  side,
  label,
  closeLabel,
  children,
}: {
  open: boolean;
  onClose: () => void;
  side: keyof typeof SIDES;
  label: string;
  closeLabel?: string; // adds a visible close button on top
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      onClose={onClose}
      // a click on the dialog box itself (not its content) is a click on the backdrop
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className={`overflow-hidden bg-surface p-0 text-fg shadow-panel backdrop:bg-[rgb(29_29_31/0.4)] ${SIDES[side]}`}
    >
      {open && (
        <div className="h-full overflow-y-auto">
          {closeLabel && (
            <div className="flex justify-end px-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                aria-label={closeLabel}
                className="grid size-11 place-items-center rounded-full text-muted hover:bg-bg hover:text-fg"
              >
                <X aria-hidden size={18} />
              </button>
            </div>
          )}
          {children}
        </div>
      )}
    </dialog>
  );
}
