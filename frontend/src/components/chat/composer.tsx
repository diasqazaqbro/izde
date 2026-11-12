"use client";

import { useLayoutEffect, type RefObject } from "react";
import { ArrowUp, ChevronDown, Square, X } from "lucide-react";
import { MAX_QUESTION, type Chat, type Doc } from "@/lib/api";
import { useT } from "@/lib/i18n/client";

export function Composer({
  inputRef,
  value,
  onChange,
  onSubmit,
  onStop,
  onEditLast,
  onCancelEdit,
  busy,
  disabled,
  editing,
  enterSends,
  scope,
  onScope,
  docs,
}: {
  inputRef: RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  onEditLast?: () => void;
  onCancelEdit: () => void;
  busy: boolean;
  disabled: boolean;
  editing: boolean;
  enterSends: boolean;
  scope: Chat["scope"];
  onScope: (scope: Chat["scope"]) => void;
  docs: Doc[];
}) {
  const t = useT();
  const canSend = !busy && !disabled && value.trim().length > 0;

  // Grow with the text; CSS max-height stops it at 8 lines and the rest scrolls.
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value, inputRef]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSend) onSubmit();
      }}
      className="rounded-[22px] bg-surface shadow-search focus-within:shadow-search-focus"
    >
      {editing && (
        <div className="flex items-center justify-between gap-2 pt-1 pr-1 pl-4 text-[13px] text-muted">
          {t("chat.editing")}
          <button
            type="button"
            onClick={onCancelEdit}
            aria-label={t("chat.editing.cancel")}
            className="grid size-11 place-items-center rounded-full hover:bg-bg hover:text-fg sm:size-8"
          >
            <X aria-hidden size={16} />
          </button>
        </div>
      )}
      <textarea
        ref={inputRef}
        rows={1}
        value={value}
        maxLength={MAX_QUESTION}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && enterSends && !e.nativeEvent.isComposing) {
            e.preventDefault();
            if (canSend) onSubmit();
          } else if (e.key === "ArrowUp" && !value && onEditLast) {
            e.preventDefault();
            onEditLast();
          }
        }}
        aria-label={t("chat.input.label")}
        placeholder={t("chat.input.placeholder")}
        className="block max-h-[calc(8*1.5rem+1.25rem)] w-full resize-none overflow-y-auto bg-transparent px-4 py-2.5 text-base leading-6 focus-visible:outline-none disabled:cursor-not-allowed"
      />
      <div className="flex items-center gap-2 px-2 pb-2">
        <label className="relative flex min-w-0 items-center">
          <span className="sr-only">{t("chat.scope")}</span>
          <select
            value={scope.type === "doc" ? scope.docId : ""}
            onChange={(e) => onScope(e.target.value ? { type: "doc", docId: e.target.value } : { type: "all" })}
            className="h-11 w-full max-w-[240px] min-w-0 appearance-none truncate rounded-full bg-bg pr-8 pl-3 text-[13px] sm:h-9"
          >
            <option value="">{t("chat.scope.all")}</option>
            {docs.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>
          <ChevronDown aria-hidden size={14} className="pointer-events-none absolute right-3 text-muted" />
        </label>
        {value.length > MAX_QUESTION - 200 && (
          <span className="shrink-0 text-xs text-muted">
            {t("chat.input.counter", { n: value.length, max: MAX_QUESTION })}
          </span>
        )}
        {busy ? (
          <button
            type="button"
            onClick={onStop}
            aria-label={t("chat.stop")}
            title={t("chat.stop")}
            className="ml-auto grid size-11 shrink-0 place-items-center rounded-full bg-accent text-white hover:brightness-110 sm:size-9"
          >
            <Square aria-hidden size={14} fill="currentColor" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!canSend}
            aria-label={t("chat.send")}
            title={t("chat.send")}
            className="ml-auto grid size-11 shrink-0 place-items-center rounded-full bg-accent text-white hover:brightness-110 disabled:cursor-not-allowed disabled:bg-line sm:size-9"
          >
            <ArrowUp aria-hidden size={18} strokeWidth={2.4} />
          </button>
        )}
      </div>
    </form>
  );
}
