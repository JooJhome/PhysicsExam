"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SubmissionRow } from "@/lib/results";
import { saveAttemptFeedback } from "@/lib/actions/tutor";
import ProgressChart from "./ProgressChart";

/** drawer แสดงคะแนนทุกชุดของนักเรียนคนเดียว (drill-down จาก "สรุปรายคน") */
export default function StudentScoresDrawer({
  studentId,
  studentName,
  rows,
  onClose,
}: {
  studentId: string;
  studentName: string;
  rows: SubmissionRow[];
  onClose: () => void;
}) {
  useEffect(() => {
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

  const submitted = rows.filter((r) => r.status === "submitted" && r.percent != null);
  const avg =
    submitted.length > 0
      ? Math.round(submitted.reduce((s, r) => s + (r.percent ?? 0), 0) / submitted.length)
      : null;

  // จุดกราฟ เรียงตามเวลาส่ง (เก่า→ใหม่)
  const trend = [...submitted]
    .filter((r) => r.submittedAt)
    .sort((a, b) => (a.submittedAt ?? "").localeCompare(b.submittedAt ?? ""))
    .map((r) => ({ pct: r.percent ?? 0, passed: r.passed, code: r.examCode }));

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-ink/40 animate-fade-in" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`คะแนนของ ${studentName}`}
        className="absolute inset-x-0 bottom-0 flex max-h-[92vh] flex-col rounded-t-3xl bg-white shadow-lift animate-dialog-in sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:w-[56%] sm:max-w-xl sm:rounded-none"
      >
        <div className="flex items-center gap-3 border-b border-line px-5 py-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-bold text-ink">คะแนนรายชุด</h2>
            <p className="text-sm text-muted">
              {studentName}
              {avg != null && (
                <> · เฉลี่ย <b className="font-display tabular-nums text-ink-soft">{avg}%</b> จาก {submitted.length} ชุด</>
              )}
            </p>
          </div>
          <Link
            href={`/tutor/report/${studentId}`}
            target="_blank"
            className="flex-none rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-bold text-brand-700 transition-colors hover:bg-brand-50"
          >
            เปิดรายงาน
          </Link>
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
          {trend.length >= 2 && (
            <div className="mb-4">
              <ProgressChart points={trend} />
            </div>
          )}

          {rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">นักเรียนคนนี้ยังไม่ได้เริ่มทำชุดใด</p>
          ) : (
            <ul className="space-y-2.5">
              {rows.map((r) => (
                <li
                  key={r.attemptId}
                  className="rounded-xl border border-line p-3"
                >
                  <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">{r.examTitle}</p>
                    <p className="truncate text-xs text-muted">
                      <span className="font-display">{r.examCode}</span>
                      {r.submittedAt && <> · {new Date(r.submittedAt).toLocaleDateString("th-TH")}</>}
                    </p>
                  </div>
                  {r.status === "in_progress" ? (
                    <span className="flex-none rounded-full bg-accent-50 px-2.5 py-1 text-xs font-bold text-accent-700">
                      กำลังทำ
                    </span>
                  ) : (
                    <div className="flex flex-none flex-col items-end">
                      <span className="font-display text-base font-bold tabular-nums text-ink">
                        {r.percent}%
                        <span className="ml-1 text-xs font-normal text-muted">
                          ({r.score}/{r.total})
                        </span>
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                          r.passed ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                        }`}
                      >
                        {r.passed ? "ผ่าน" : "ไม่ผ่าน"}
                      </span>
                    </div>
                  )}
                  </div>
                  {r.status === "submitted" && (
                    <FeedbackEditor
                      examId={r.examId}
                      studentId={studentId}
                      initial={r.tutorFeedback}
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/** ช่องคอมเมนต์ของติวเตอร์ต่อการทำครั้งนั้น — นักเรียนเห็นในหน้าผล */
function FeedbackEditor({
  examId,
  studentId,
  initial,
}: {
  examId: string;
  studentId: string;
  initial: string | null;
}) {
  const router = useRouter();
  const [text, setText] = useState(initial ?? "");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const dirty = text.trim() !== (initial ?? "").trim();

  function save() {
    startTransition(async () => {
      const r = await saveAttemptFeedback(examId, studentId, text);
      if (r.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 1800);
        router.refresh();
      }
    });
  }

  return (
    <div className="mt-2.5 border-t border-line pt-2.5">
      <label className="text-xs font-semibold text-muted">ฟีดแบ็กถึงนักเรียน (เห็นในหน้าผล)</label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        placeholder="เช่น ครั้งนี้ดีขึ้นมาก ลองทบทวนเรื่องไฟฟ้าข้อ 12 นะ"
        className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
      />
      <div className="mt-1.5 flex items-center justify-end gap-2">
        {saved && <span className="text-xs font-semibold text-green-700">บันทึกแล้ว ✓</span>}
        <button
          type="button"
          onClick={save}
          disabled={pending || !dirty}
          className="rounded-lg bg-brand-600 px-3.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
        >
          {pending ? "กำลังบันทึก…" : "บันทึกฟีดแบ็ก"}
        </button>
      </div>
    </div>
  );
}
