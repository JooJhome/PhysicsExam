"use client";

import { useEffect, useRef } from "react";
import type { HelpDoc } from "@/lib/help/content";

export default function HelpDrawer({
  doc,
  onClose,
}: {
  doc: HelpDoc;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panelRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-ink/40 animate-fade-in" onClick={onClose} />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={doc.title}
        className="absolute inset-x-0 bottom-0 flex max-h-[92vh] flex-col rounded-t-3xl bg-white shadow-lift outline-none animate-dialog-in sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:w-[28rem] sm:rounded-none"
      >
        {/* header */}
        <div className="flex items-center gap-3 border-b border-line px-5 py-4 sm:px-6">
          <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-brand-50 font-display text-base font-bold text-brand-700">
            ?
          </span>
          <h2 className="min-w-0 flex-1 truncate font-display text-lg font-bold text-ink">
            {doc.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="grid h-9 w-9 flex-none place-items-center rounded-lg text-muted transition-colors hover:bg-canvas hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <p className="text-sm text-ink-soft">{doc.summary}</p>

          {/* steps */}
          <h3 className="mt-5 font-display text-sm font-bold text-ink">ขั้นตอน</h3>
          <ol className="mt-2 space-y-3">
            {doc.steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="grid h-6 w-6 flex-none place-items-center rounded-full bg-brand-50 font-display text-xs font-bold text-brand-700">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{s.title}</p>
                  <p className="text-sm text-muted">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>

          {/* tips */}
          {doc.tips && doc.tips.length > 0 && (
            <div className="mt-5 rounded-xl bg-accent-50 p-4 ring-1 ring-accent-100">
              <h3 className="font-display text-sm font-bold text-accent-800">เคล็ดลับ & ข้อควรระวัง</h3>
              <ul className="mt-2 space-y-1.5">
                {doc.tips.map((t, i) => (
                  <li key={i} className="flex gap-2 text-sm text-accent-800">
                    <span aria-hidden className="flex-none">•</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* faq */}
          {doc.faq && doc.faq.length > 0 && (
            <div className="mt-5">
              <h3 className="font-display text-sm font-bold text-ink">คำถามที่พบบ่อย</h3>
              <div className="mt-2 divide-y divide-line rounded-xl border border-line">
                {doc.faq.map((f, i) => (
                  <details key={i} className="group px-4 py-3">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-ink">
                      {f.q}
                      <span className="flex-none text-muted transition-transform group-open:rotate-180">▾</span>
                    </summary>
                    <p className="mt-2 text-sm text-muted">{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
