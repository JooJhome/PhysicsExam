"use client";

import { useEffect, useRef } from "react";

type Tone = "brand" | "danger";

/**
 * Modal ยืนยันแบรนด์ — แทน native confirm()/alert()
 * ใช้ <dialog> จริง: ได้ focus-trap, Esc, และหลุด stacking context เองโดยไม่ต้องตั้ง z-index
 *
 * - confirm/cancel: ใส่ทั้งสอง = ปุ่มยืนยัน + ยกเลิก
 * - mode "notice": ใส่เฉพาะ onConfirm (ปุ่มเดียว) สำหรับแจ้งเตือน/บอกผล
 * - dismissible=false: ปิดด้วย Esc/คลิกฉากหลังไม่ได้ (สำหรับ flow ที่ต้องตัดสินใจ)
 */
export default function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "ยืนยัน",
  cancelLabel,
  tone = "brand",
  busy = false,
  dismissible = true,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: Tone;
  busy?: boolean;
  dismissible?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  // Esc → ปฏิบัติเหมือนกดยกเลิก (ถ้าปิดได้)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onCancelEvent = (e: Event) => {
      e.preventDefault(); // กัน default close เพื่อให้ state คุมเอง
      if (dismissible && !busy) onCancel?.();
    };
    el.addEventListener("cancel", onCancelEvent);
    return () => el.removeEventListener("cancel", onCancelEvent);
  }, [dismissible, busy, onCancel]);

  const confirmClass =
    tone === "danger"
      ? "bg-red-600 hover:bg-red-700 text-white"
      : "bg-brand-600 hover:bg-brand-700 text-white";

  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-title"
      className="m-auto w-[calc(100vw-2rem)] max-w-md rounded-xl bg-white p-0 text-ink shadow-card backdrop:bg-ink/40 backdrop:backdrop-blur-[2px] open:animate-dialog-in"
      onClick={(e) => {
        // คลิกฉากหลัง (พื้นที่นอกการ์ด) → ยกเลิก
        if (e.target === ref.current && dismissible && !busy) onCancel?.();
      }}
    >
      <div className="p-5 sm:p-6">
        <h2 id="confirm-title" className="text-lg font-bold text-ink">
          {title}
        </h2>
        {body && (
          <div className="mt-2 text-sm leading-relaxed text-ink-soft">
            {body}
          </div>
        )}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {cancelLabel && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:bg-slate-50 disabled:opacity-60 sm:py-2"
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            autoFocus
            className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 sm:py-2 ${confirmClass}`}
          >
            {busy ? "กำลังดำเนินการ..." : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
