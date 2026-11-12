"use client";

import { useRef, useState } from "react";
import { ExternalLink, Upload } from "lucide-react";
import { api, UPLOAD_DISABLED } from "@/lib/api";
import { useT } from "@/lib/i18n/client";
import { useData } from "@/lib/use-data";
import { buttonClass } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { StatusPill } from "@/components/ui/status-pill";

const ACCEPT = [".pdf", ".docx"];

function UploadZone() {
  const t = useT();
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  async function upload(file?: File) {
    if (!file) return;
    if (!ACCEPT.some((ext) => file.name.toLowerCase().endsWith(ext))) {
      setMessage({ text: t("upload.wrongType", { name: file.name }), error: true });
      return;
    }
    setMessage({ text: t("upload.busy", { name: file.name }), error: false });
    try {
      await api.uploadDoc(file);
    } catch (e) {
      const disabled = e instanceof Error && e.message === UPLOAD_DISABLED;
      setMessage({ text: disabled ? t("upload.disabled", { name: file.name }) : t("upload.error"), error: !disabled });
    } finally {
      if (input.current) input.current.value = "";
    }
  }

  return (
    <section aria-labelledby="upload-title" className="flex flex-col gap-3">
      <h2 id="upload-title" className="text-lg">
        {t("upload.title")}
      </h2>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          upload(e.dataTransfer.files[0]);
        }}
        className={`flex flex-col items-center gap-3 rounded-card border-2 border-dashed px-6 py-8 text-center ${dragging ? "border-accent bg-accent-soft" : "border-line bg-surface"}`}
      >
        <Upload aria-hidden size={28} className="text-muted" />
        <p>{t("upload.drop")}</p>
        <label className={buttonClass("secondary", "cursor-pointer focus-within:outline-3 focus-within:outline-accent")}>
          {t("upload.choose")}
          <input
            ref={input}
            type="file"
            accept={ACCEPT.join(",")}
            onChange={(e) => upload(e.target.files?.[0])}
            className="sr-only"
          />
        </label>
        <p className="text-[13px] text-muted">{t("upload.note")}</p>
      </div>
      <p
        role="status"
        className={message ? `rounded-field px-4 py-3 text-sm ${message.error ? "bg-danger-soft text-danger" : "bg-wait-soft text-wait"}` : "sr-only"}
      >
        {message?.text}
      </p>
    </section>
  );
}

export function Documents() {
  const t = useT();
  const [docs] = useData(api.listDocs);
  const ready = docs?.filter((d) => d.status === "ready").length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      {docs && <p className="text-sm text-muted">{t("docs.meta", { ready, queued: docs.length - ready })}</p>}
      <UploadZone />
      {docs ? (
        <DataTable
          label={t("docs.table")}
          cols="sm:grid-cols-[minmax(0,1fr)_120px_60px_140px]"
          columns={[t("docs.col.title"), t("docs.col.code"), t("docs.col.lang"), t("docs.col.status")]}
          rows={docs.map((d) => ({
            key: d.id,
            cells: [
              <a
                key="t"
                href={d.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block py-3 text-accent hover:underline sm:py-0"
              >
                {d.title}
                <ExternalLink aria-hidden size={13} className="ml-1.5 inline align-[-1px]" />
              </a>,
              d.code ?? "—",
              t(`lang.${d.lang}`),
              <StatusPill key="s" status={d.status} label={t(`status.${d.status}`)} />,
            ],
          }))}
        />
      ) : (
        <p className="text-muted">{t("common.loading")}</p>
      )}
    </div>
  );
}
