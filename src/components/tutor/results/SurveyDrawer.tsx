"use client";

import { useEffect, useState } from "react";
import { getExamSurveys, type ExamSurveys } from "@/lib/actions/tutor";

const METRICS = [
  { key: "difficulty", label: "ความยาก", hint: "1 ง่าย — 5 ยาก", invert: true },
  { key: "timeAdequacy", label: "เวลาเพียงพอ", hint: "1 น้อย — 5 พอดี", invert: false },
  { key: "confidence", label: "ความมั่นใจ", hint: "1 ไม่มั่นใจ — 5 มั่นใจ", invert: false },
  { key: "stress", label: "ความเครียด", hint: "1 ผ่อนคลาย — 5 เครียด", invert: true },
] as const;

export default function SurveyDrawer({
  examId,
  examCode,
  onClose,
}: {
  examId: string;
  examCode: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<ExamSurveys | null>(null);

  useEffect(() => {
    let alive = true;
    getExamSurveys(examId).then((d) => {
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

  const comments = data?.responses.filter((r) => r.comment || r.hardestTopics) ?? [];

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-ink/40 animate-fade-in" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`แบบสอบถาม ${examCode}`}
        className="absolute inset-x-0 bottom-0 flex max-h-[92vh] flex-col rounded-t-3xl bg-white shadow-lift animate-dialog-in sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:w-[56%] sm:max-w-xl sm:rounded-none"
      >
        <div className="flex items-center gap-3 border-b border-line px-5 py-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-bold text-ink">แบบสอบถามหลังสอบ</h2>
            <p className="text-sm text-muted">
              {examCode}
              {data && <> · ตอบแล้ว {data.count} คน</>}
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
            <p className="py-10 text-center text-sm text-muted">กำลังโหลด…</p>
          ) : data.count === 0 ? (
            <p className="py-10 text-center text-sm text-muted">ยังไม่มีนักเรียนตอบแบบสอบถามของชุดนี้</p>
          ) : (
            <>
              {/* ค่าเฉลี่ย 4 ด้าน */}
              <div className="grid grid-cols-2 gap-3">
                {METRICS.map((m) => {
                  const v = data.avg ? data.avg[m.key] : 0;
                  return (
                    <div key={m.key} className="rounded-xl border border-line p-3">
                      <p className="text-[13px] font-medium text-muted">{m.label}</p>
                      <p className="mt-0.5 font-display text-2xl font-extrabold tabular-nums text-ink">
                        {v}
                        <span className="text-base text-muted">/5</span>
                      </p>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-sand-100">
                        <div
                          className={`h-full rounded-full ${barTone(v, m.invert)}`}
                          style={{ width: `${(v / 5) * 100}%` }}
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-hint">{m.hint}</p>
                    </div>
                  );
                })}
              </div>

              {/* ความเห็น / บทที่ยากสุด รายคน */}
              <h3 className="mt-5 mb-2 text-sm font-semibold text-ink">
                ความเห็น & บทที่ยากสุด{" "}
                <span className="font-normal text-muted">({comments.length})</span>
              </h3>
              {comments.length === 0 ? (
                <p className="rounded-xl bg-canvas px-4 py-6 text-center text-sm text-muted">
                  ไม่มีใครเขียนความเห็นเพิ่มเติม
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {comments.map((r, i) => (
                    <li key={i} className="rounded-xl border border-line p-3">
                      <div className="flex items-center gap-2">
                        <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-brand-50 font-display text-xs font-bold text-brand-700">
                          {r.initials}
                        </span>
                        <span className="text-sm font-semibold text-ink">{r.studentName}</span>
                      </div>
                      {r.hardestTopics && (
                        <p className="mt-2 text-sm text-ink-soft">
                          <span className="text-muted">บทที่ยากสุด:</span> {r.hardestTopics}
                        </p>
                      )}
                      {r.comment && (
                        <p className="mt-1 text-sm text-ink-soft">
                          <span className="text-muted">ถึงติวเตอร์:</span> {r.comment}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function barTone(v: number, invert: boolean): string {
  // invert=true → ค่าสูง = ไม่ดี (ยาก/เครียด) → แดงเมื่อสูง
  const good = invert ? 5 - v + 1 : v;
  if (good >= 3.5) return "bg-green-500";
  if (good >= 2.5) return "bg-accent-400";
  return "bg-red-500";
}
