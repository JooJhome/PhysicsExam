"use client";

import { useEffect, useRef, useState } from "react";
import type { ExamListItem } from "@/lib/exams";

/**
 * แท็กหัวข้อรายข้อ — ลิสต์ข้อ 1..N แต่ละข้อใส่ชื่อหัวข้อได้ (free-form)
 * + datalist แนะนำหัวข้อที่เคยใช้ · "เติมต่อ" คัดลอกหัวข้อข้อก่อนหน้าลงมา
 */
export default function TopicTagModal({
  exam,
  suggestions,
  onClose,
  onSave,
}: {
  exam: ExamListItem | null;
  suggestions: string[];
  onClose: () => void;
  onSave: (topics: string[]) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const n = exam?.questionCount ?? 0;
  const [topics, setTopics] = useState<string[]>([]);

  useEffect(() => {
    if (!exam) return;
    const init = Array.from({ length: exam.questionCount }, (_, i) => exam.questionTopics[i] ?? "");
    setTopics(init);
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
  }, [exam, onClose]);

  if (!exam) return null;

  const tagged = topics.filter((t) => t.trim()).length;
  // เติมหัวข้อของข้อ i ลงข้อถัดๆ ไปที่ยังว่าง (จนเจอข้อที่กรอกแล้ว)
  function fillDown(i: number) {
    const v = topics[i]?.trim();
    if (!v) return;
    setTopics((prev) => {
      const next = [...prev];
      for (let j = i + 1; j < n; j++) {
        if (next[j]?.trim()) break;
        next[j] = v;
      }
      return next;
    });
  }

  const field =
    "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-ink/40 animate-fade-in" onClick={onClose} />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`แท็กหัวข้อ ${exam.title}`}
        className="absolute inset-x-0 bottom-0 flex max-h-[92vh] flex-col rounded-t-3xl bg-white shadow-lift outline-none animate-dialog-in sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:w-[56%] sm:max-w-lg sm:rounded-none"
      >
        <div className="flex items-start gap-3 border-b border-line px-5 py-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-lg font-bold text-ink">แท็กหัวข้อรายข้อ</h2>
            <p className="truncate text-sm text-muted">
              {exam.title} · แท็กแล้ว {tagged}/{n} ข้อ
            </p>
          </div>
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

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          <p className="mb-3 rounded-xl bg-sand-100 px-3 py-2 text-xs text-ink-soft">
            ใส่หัวข้อของแต่ละข้อ (เช่น กลศาสตร์ / ไฟฟ้า / คลื่น) — ระบบจะสรุปจุดอ่อนรายหัวข้อให้ ·
            ลูกศร ↓ = เติมหัวข้อลงข้อถัดไปที่ยังว่าง
          </p>
          <datalist id="topic-suggestions">
            {suggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          <ul className="space-y-2">
            {topics.map((t, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="w-12 flex-none font-display text-sm font-bold tabular-nums text-muted">
                  ข้อ {i + 1}
                </span>
                <input
                  value={t}
                  onChange={(e) =>
                    setTopics((prev) => {
                      const next = [...prev];
                      next[i] = e.target.value;
                      return next;
                    })
                  }
                  list="topic-suggestions"
                  placeholder="— ยังไม่แท็ก —"
                  className={field}
                />
                <button
                  type="button"
                  onClick={() => fillDown(i)}
                  disabled={!t.trim() || i === n - 1}
                  title="เติมลงข้อถัดไปที่ยังว่าง"
                  className="grid h-9 w-9 flex-none place-items-center rounded-lg border border-line text-muted transition-colors hover:bg-canvas disabled:opacity-30"
                >
                  ↓
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-line bg-white px-5 py-3 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:bg-canvas"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={() => onSave(topics)}
            className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            บันทึกหัวข้อ
          </button>
        </div>
      </div>
    </div>
  );
}
