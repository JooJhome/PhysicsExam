"use client";

import { useEffect, useState } from "react";
import { getExamBreakdown, type ExamBreakdown } from "@/lib/actions/tutor";

export default function BreakdownDrawer({
  examId,
  examCode,
  onClose,
}: {
  examId: string;
  examCode: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<ExamBreakdown | null>(null);

  useEffect(() => {
    let alive = true;
    getExamBreakdown(examId).then((d) => {
      if (alive) setData(d);
    });
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      alive = false;
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [examId, onClose]);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-ink/40 animate-fade-in" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`วิเคราะห์รายข้อ ${examCode}`}
        className="absolute inset-x-0 bottom-0 flex max-h-[92vh] flex-col rounded-t-3xl bg-white shadow-lift animate-dialog-in sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:w-[56%] sm:max-w-xl sm:rounded-none"
      >
        <div className="flex items-center gap-3 border-b border-line px-5 py-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-bold text-ink">วิเคราะห์รายข้อ</h2>
            <p className="text-sm text-muted">
              {examCode}
              {data && <> · จากผู้ส่ง {data.submitted} คน · เรียงข้อยากสุดก่อน</>}
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
          {!data ? (
            <p className="py-10 text-center text-sm text-muted">กำลังวิเคราะห์…</p>
          ) : data.submitted === 0 ? (
            <p className="py-10 text-center text-sm text-muted">ยังไม่มีผู้ส่งชุดนี้</p>
          ) : (
            <ul className="space-y-2.5">
              {data.items.map((it) => {
                const tone =
                  it.pctCorrect >= 70 ? "bg-green-500" : it.pctCorrect >= 40 ? "bg-accent-400" : "bg-red-500";
                return (
                  <li key={it.n} className="rounded-xl border border-line p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-display font-bold text-ink">ข้อ {it.n}</span>
                      <span className="font-display font-bold tabular-nums text-ink-soft">
                        {it.pctCorrect}% ถูก
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-sand-100">
                      <div className={`h-full rounded-full ${tone}`} style={{ width: `${it.pctCorrect}%` }} />
                    </div>
                    <p className="mt-1.5 text-xs text-muted">
                      ตอบถูก {it.correct}/{it.answered} คน
                      {it.topWrongChoice != null && (
                        <>
                          {" "}
                          · มักตอบผิดเป็นตัวเลือก{" "}
                          <b className="text-red-600">{it.topWrongChoice}</b> ({it.topWrongCount} คน)
                        </>
                      )}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
