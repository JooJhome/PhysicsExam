"use client";

import { useEffect } from "react";
import type { SubmissionRow } from "@/lib/results";

/** drawer แสดงคะแนนทุกชุดของนักเรียนคนเดียว (drill-down จาก "สรุปรายคน") */
export default function StudentScoresDrawer({
  studentName,
  rows,
  onClose,
}: {
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
          {trend.length >= 2 && <ProgressChart points={trend} />}

          {rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">นักเรียนคนนี้ยังไม่ได้เริ่มทำชุดใด</p>
          ) : (
            <ul className="space-y-2.5">
              {rows.map((r) => (
                <li
                  key={r.attemptId}
                  className="flex items-center gap-3 rounded-xl border border-line p-3"
                >
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
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/** กราฟพัฒนาการ % ตามเวลา (SVG ล้วน) — จุดเขียว=ผ่าน แดง=ไม่ผ่าน + เส้นอ้างอิง 50% */
function ProgressChart({ points }: { points: { pct: number; passed: boolean | null; code: string }[] }) {
  const W = 320;
  const H = 120;
  const padX = 12;
  const top = 10;
  const bottom = 22;
  const n = points.length;
  const x = (i: number) => padX + (i / (n - 1)) * (W - 2 * padX);
  const y = (pct: number) => top + (1 - pct / 100) * (H - top - bottom);
  const line = points.map((p, i) => `${x(i)},${y(p.pct)}`).join(" ");
  const first = points[0].pct;
  const last = points[n - 1].pct;
  const delta = last - first;

  return (
    <div className="mb-4 rounded-2xl border border-line bg-canvas/40 p-4">
      <div className="mb-2 flex items-baseline justify-between">
        <p className="text-sm font-semibold text-ink">พัฒนาการตามเวลา</p>
        <p className="text-xs font-semibold">
          <span className="text-muted">ครั้งแรก {first}% → ล่าสุด {last}% · </span>
          <span className={delta > 0 ? "text-green-700" : delta < 0 ? "text-red-600" : "text-muted"}>
            {delta > 0 ? `ดีขึ้น +${delta}` : delta < 0 ? `ลดลง ${delta}` : "คงที่"}
          </span>
        </p>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`กราฟคะแนน ${n} ชุด`}>
        {/* เส้นอ้างอิง 50% */}
        <line x1={padX} y1={y(50)} x2={W - padX} y2={y(50)} stroke="#E7E0CE" strokeWidth="1" strokeDasharray="4 4" />
        <text x={padX} y={y(50) - 3} className="fill-hint" fontSize="9">50%</text>
        {/* เส้นพัฒนาการ */}
        <polyline points={line} fill="none" stroke="#16695b" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {/* จุด */}
        {points.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.pct)} r="3.5" fill={p.passed ? "#1f7a69" : "#B3261E"} stroke="#fff" strokeWidth="1.5" />
        ))}
      </svg>
    </div>
  );
}
