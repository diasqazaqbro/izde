"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import * as Tooltip from "@radix-ui/react-tooltip";
import { Check, ChevronDown, Copy, LoaderCircle, RotateCcw, Search, Square, ThumbsDown, ThumbsUp, X } from "lucide-react";
import type { ChatMessage, Citation, Clause, Doc } from "@/lib/api";
import { useT } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";
import { Tiles } from "./tiles";

export type Source = { doc: Doc; clause: Clause };
export type Lookup = (clauseId: string) => Source | undefined;

const ICON_BUTTON =
  "grid size-11 place-items-center rounded-full text-muted hover:bg-bg hover:text-fg aria-pressed:text-accent sm:size-8";

export function UserMessage({ text }: { text: string }) {
  return (
    <div className="max-w-[85%] self-end rounded-tile bg-bg px-4 py-2.5 whitespace-pre-wrap break-words">{text}</div>
  );
}

function CitationMark({ citation, source, onOpen }: { citation: Citation; source?: Source; onOpen: () => void }) {
  const t = useT();
  const button = (
    <button
      type="button"
      onClick={onOpen}
      data-hit-area
      aria-label={
        source
          ? t("chat.source.open", { n: citation.index, doc: source.doc.title, clause: source.clause.number })
          : String(citation.index)
      }
      // the ::after box widens the tap area to 44 px without moving the text
      className="relative mx-0.5 inline-grid size-5 place-items-center rounded-full bg-accent-soft align-[2px] text-[11px] font-semibold text-accent after:absolute after:-inset-3 after:content-[''] hover:bg-accent hover:text-white"
    >
      {citation.index}
    </button>
  );
  if (!source) return button;
  return (
    <Tooltip.Root delayDuration={150}>
      <Tooltip.Trigger asChild>{button}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          sideOffset={6}
          collisionPadding={16}
          className="z-30 max-w-xs rounded-field border border-line bg-surface px-3 py-2 text-[13px] text-fg shadow-panel"
        >
          {source.clause.text}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

function AnswerText({
  text,
  citations,
  lookup,
  onOpen,
}: {
  text: string;
  citations: Citation[];
  lookup: Lookup;
  onOpen: (c: Citation) => void;
}) {
  const cite = (part = "") => citations.find((c) => `[${c.index}]` === part);
  // "[1]" markers become citation buttons, glued to the word before them so they never wrap alone
  const parts = text.split(/\s*(\[\d+\])/);
  return (
    <div className="whitespace-pre-wrap break-words">
      {parts.map((part, i) => {
        if (cite(part)) return null;
        const next = cite(parts[i + 1]);
        if (!next) return <Fragment key={i}>{/^\[\d+\]$/.test(part) ? ` ${part}` : part}</Fragment>;
        const [, head, word] = /^([\s\S]*?)(\S*)$/.exec(part)!;
        return (
          <Fragment key={i}>
            {head}
            <span className="whitespace-nowrap">
              {word}
              <CitationMark citation={next} source={lookup(next.clauseId)} onOpen={() => onOpen(next)} />
            </span>
          </Fragment>
        );
      })}
    </div>
  );
}

function Steps({ steps, searching }: { steps: NonNullable<ChatMessage["steps"]>; searching: boolean }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const icon = searching ? (
    <LoaderCircle aria-hidden size={14} className="animate-spin" />
  ) : (
    <Search aria-hidden size={14} />
  );
  return (
    <div className="text-[13px] text-muted">
      {steps.docs.length > 0 ? (
        <button
          type="button"
          aria-expanded={open}
          aria-label={`${steps.text}. ${t("chat.steps.toggle")}`}
          onClick={() => setOpen(!open)}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-md hover:text-fg sm:min-h-7"
        >
          {icon}
          {steps.text}
          <ChevronDown aria-hidden size={14} className={open ? "rotate-180" : ""} />
        </button>
      ) : (
        <p className="inline-flex min-h-11 items-center gap-1.5 sm:min-h-7">
          {icon}
          {steps.text}
        </p>
      )}
      {open && (
        <ul className="mt-1 ml-5 list-disc space-y-0.5 pl-4">
          {steps.docs.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function plainText(m: ChatMessage, lookup: Lookup, label: string) {
  const body = m.text.replace(/\s*\[\d+\]/g, "").trim();
  const sources = m.citations
    .map((c) => {
      const s = lookup(c.clauseId);
      return s ? `[${c.index}] ${s.doc.title}, ${s.clause.number}` : null;
    })
    .filter(Boolean);
  return sources.length ? `${body}\n\n${label}:\n${sources.join("\n")}` : body;
}

export function AssistantMessage({
  message,
  streaming = false,
  last = false,
  lookup,
  onOpenSource,
  onRetry,
  onFeedback,
  onAsk,
}: {
  message: ChatMessage;
  streaming?: boolean;
  last?: boolean;
  lookup: Lookup;
  onOpenSource: (c: Citation) => void;
  onRetry?: () => void;
  onFeedback?: (value: "up" | "down", comment?: string) => void;
  onAsk: (question: string) => void;
}) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const [comment, setComment] = useState("");
  const [askComment, setAskComment] = useState(false);
  const noAnswer = !streaming && !message.stopped && message.citations.length === 0 && !!message.text;
  const done = !streaming;

  async function copy() {
    await navigator.clipboard.writeText(plainText(message, lookup, t("chat.sources")));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <article aria-label={t("chat.izde")} className="flex flex-col gap-2">
      {message.steps && (
        <div aria-live="polite">
          <Steps steps={message.steps} searching={streaming && !message.text} />
        </div>
      )}

      {message.text && (
        <div className={noAnswer ? "font-semibold" : ""}>
          <AnswerText text={message.text} citations={message.citations} lookup={lookup} onOpen={onOpenSource} />
        </div>
      )}
      {noAnswer && <p className="text-muted">{t("chat.noAnswer.hint")}</p>}
      {message.stopped && (
        <p className="inline-flex items-center gap-1.5 text-[13px] text-muted">
          <Square aria-hidden size={12} />
          {t("chat.stopped")}
        </p>
      )}

      {done && message.citations.length > 0 && (
        <ul aria-label={t("chat.sources")} className="flex flex-wrap gap-2 pt-1">
          {message.citations.map((c) => {
            const s = lookup(c.clauseId);
            return (
              <li key={c.index} className="min-w-0">
                <button
                  type="button"
                  onClick={() => onOpenSource(c)}
                  className="flex min-h-11 max-w-full items-center gap-2 rounded-field border border-line bg-surface px-3 py-1.5 text-left text-sm hover:bg-accent-soft sm:min-h-9"
                >
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent">
                    {c.index}
                  </span>
                  <span className="min-w-0 truncate">
                    {s?.doc.title}
                    <span className="text-muted"> · {s?.clause.number}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {done && message.text && onFeedback && (
        <div className="flex flex-wrap items-center gap-0.5 text-muted">
          <button type="button" onClick={copy} aria-label={t("chat.actions.copy")} title={t("chat.actions.copy")} className={ICON_BUTTON}>
            {copied ? <Check aria-hidden size={16} /> : <Copy aria-hidden size={16} />}
          </button>
          {last && onRetry && (
            <button type="button" onClick={onRetry} aria-label={t("chat.actions.retry")} title={t("chat.actions.retry")} className={ICON_BUTTON}>
              <RotateCcw aria-hidden size={16} />
            </button>
          )}
          <button
            type="button"
            aria-pressed={message.feedback === "up"}
            onClick={() => {
              setAskComment(false);
              onFeedback("up");
            }}
            aria-label={t("chat.actions.up")}
            title={t("chat.actions.up")}
            className={ICON_BUTTON}
          >
            <ThumbsUp aria-hidden size={16} />
          </button>
          <button
            type="button"
            aria-pressed={message.feedback === "down"}
            onClick={() => {
              setAskComment(true);
              onFeedback("down");
            }}
            aria-label={t("chat.actions.down")}
            title={t("chat.actions.down")}
            className={ICON_BUTTON}
          >
            <ThumbsDown aria-hidden size={16} />
          </button>
          <span aria-live="polite" className="pl-1 text-[13px]">
            {copied ? t("chat.actions.copied") : ""}
          </span>
        </div>
      )}

      {askComment && message.feedback === "down" && !message.feedbackComment && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!comment.trim()) return;
            onFeedback?.("down", comment);
            setAskComment(false);
          }}
          className="flex flex-col gap-2 rounded-field border border-line bg-surface p-3"
        >
          <label className="flex flex-col gap-1.5 text-sm text-muted">
            {t("chat.feedback.label")}
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              rows={2}
              className="resize-none rounded-field border border-line bg-bg px-3 py-2 text-base text-fg"
            />
          </label>
          <Button type="submit" variant="secondary" className="w-fit" disabled={!comment.trim()}>
            {t("chat.feedback.send")}
          </Button>
        </form>
      )}
      {message.feedbackComment && <p className="text-[13px] text-muted">{t("chat.feedback.thanks")}</p>}

      {done && last && message.suggestions && message.suggestions.length > 0 && (
        <div className="flex flex-col gap-2 pt-2">
          <h2 className="text-[13px] font-normal tracking-normal text-muted">{t("chat.suggestions")}</h2>
          <Tiles items={message.suggestions} onPick={onAsk} />
        </div>
      )}
    </article>
  );
}

export function SourcePanel({ source, onClose }: { source: Source; onClose: () => void }) {
  const t = useT();
  const { doc, clause } = source;
  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold tracking-[0.06em] text-accent uppercase">{t("chat.source")}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("chat.source.close")}
          className="grid size-11 place-items-center rounded-full text-muted hover:bg-bg hover:text-fg sm:size-8"
        >
          <X aria-hidden size={18} />
        </button>
      </div>
      <h2 className="text-xl">{doc.title}</h2>
      <p className="text-[13px] text-muted">
        {[doc.code, clause.section, clause.number].filter(Boolean).join(" · ")}
      </p>
      <blockquote className="border-l-[3px] border-accent pl-3.5">
        <mark className="px-1 py-0.5 text-[15px] [box-decoration-break:clone]">{clause.text}</mark>
      </blockquote>
      <Link
        href={{ pathname: `/docs/${doc.id}`, query: { clause: clause.id } }}
        className="inline-flex min-h-11 w-fit items-center rounded-full bg-accent px-[22px] font-semibold text-white hover:brightness-110"
      >
        {t("chat.source.doc")}
      </Link>
    </div>
  );
}

