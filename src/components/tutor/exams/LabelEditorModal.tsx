"use client";

import { useEffect, useRef, useState } from "react";
import type { ExamListItem } from "@/lib/exams";

const MAX = 6;

export default function LabelEditorModal({
  exam,
  allSubjects,
  onClose,
  onSave,
}: {
  exam: ExamListItem | null;
  allSubjects: string[];
  onClose: () => void;
  onSave: (labels: string[]) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [labels, setLabels] = useState<string[]>([]);
  const [draft, setDraft] = useState("");

  // sync open + reset ค่าเริ่มต้นจากชุดที่เลือก
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (exam) {
      setLabels(exam.subjects);
      setDraft("");
      if (!el.open) el.showModal();
    } else if (el.open) {
      el.close();
    }
  }, [exam]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    el.addEventListener("cancel", onCancel);
    return () => el.removeEventListener("cancel", onCancel);
  }, [onClose]);

  function add(value: string) {
    const v = value.trim();
    if (!v) return;
    if (labels.some((l) => l.toLowerCase() === v.toLowerCase())) {
      setDraft("");
      return;
    }
    if (labels.length >= MAX) return;
    setLabels((prev) => [...prev, v]);
    setDraft("");
    inputRef.current?.focus();
  }
  function remove(label: string) {
    setLabels((prev) => prev.filter((l) => l !== label));
  }

  // suggestion = label ที่เคยใช้ทั้งระบบ แต่ชุดนี้ยังไม่มี
  const suggestions = allSubjects.filter(
    (s) => !labels.some((l) => l.toLowerCase() === s.toLowerCase())
  );

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="label-editor-title"
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      className="m-0 h-dvh max-h-none w-full max-w-none bg-white p-0 text-ink backdrop:bg-ink/40 backdrop:backdrop-blur-[2px] open:animate-dialog-in sm:m-auto sm:h-auto sm:max-h-[90vh] sm:w-[calc(100vw-2rem)] sm:max-w-md sm:rounded-3xl sm:shadow-lift"
    >
      <div className="flex h-full flex-col">
        {/* header */}
        <div className="flex items-start justify-between gap-3 border-b border-line p-5">
          <div className="min-w-0">
            <h2 id="label-editor-title" className="font-display text-lg font-bold text-ink">
              แก้ป้ายกำกับ
            </h2>
            <p className="mt-1 truncate text-sm text-muted">{exam?.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="grid h-10 w-10 flex-none place-items-center rounded-lg text-muted transition-colors hover:bg-canvas hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto p-5">
          <p className="mb-2 text-sm font-semibold text-ink-soft">
            ป้ายของชุดนี้{" "}
            <span className="font-normal text-muted">({labels.length}/{MAX})</span>
          </p>
          {labels.length === 0 ? (
            <p className="rounded-xl bg-canvas px-4 py-3 text-sm text-muted">ยังไม่มีป้าย</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {labels.map((l) => (
                <span
                  key={l}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 py-1 pl-3 pr-1.5 text-sm font-semibold text-brand-700 ring-1 ring-brand-100"
                >
                  {l}
                  <button
                    type="button"
                    onClick={() => remove(l)}
                    aria-label={`ลบป้าย ${l}`}
                    className="grid h-5 w-5 place-items-center rounded-full text-brand-700/70 transition-colors hover:bg-brand-200/60 hover:text-brand-800"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* add input */}
          <div className="mt-4 flex gap-2">
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  add(draft);
                }
              }}
              list="label-suggestions"
              placeholder="พิมพ์ป้าย เช่น CU-ATS, TBAT, ฟิสิกส์"
              disabled={labels.length >= MAX}
              className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-base transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:bg-canvas"
            />
            <datalist id="label-suggestions">
              {suggestions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
            <button
              type="button"
              onClick={() => add(draft)}
              disabled={!draft.trim() || labels.length >= MAX}
              className="flex-none rounded-xl bg-brand-600 px-4 text-sm font-bold text-white transition-colors hover:bg-brand-700 disabled:opacity-40"
            >
              เพิ่ม
            </button>
          </div>

          {/* quick-add suggestions */}
          {suggestions.length > 0 && labels.length < MAX && (
            <div className="mt-3">
              <p className="mb-1.5 text-xs font-medium text-muted">เคยใช้:</p>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => add(s)}
                    className="rounded-full border border-line bg-white px-3 py-1 text-sm text-ink-soft transition-colors hover:border-brand-200 hover:text-brand-700"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* footer */}
        <div className="flex flex-none items-center justify-end gap-2 border-t border-line p-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:bg-canvas"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={() => onSave(labels)}
            className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            บันทึก
          </button>
        </div>
      </div>
    </dialog>
  );
}
