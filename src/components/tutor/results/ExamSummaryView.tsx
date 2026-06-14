"use client";

import { useState } from "react";
import type { ExamSummary } from "@/lib/results";

export default function ExamSummaryView({
  exams,
  pending,
  onSavePassing,
  onOpenBreakdown,
}: {
  exams: ExamSummary[];
  pending: boolean;
  onSavePassing: (examId: string, score: number | null) => void;
  onOpenBreakdown: (examId: string, examCode: string) => void;
}) {
  if (exams.length === 0) {
    return <Empty />;
  }
  return (
    <div className="space-y-3">
      {exams.map((e) => (
        <ExamSummaryCard
          key={e.examId}
          exam={e}
          pending={pending}
          onSavePassing={onSavePassing}
          onOpenBreakdown={onOpenBreakdown}
        />
      ))}
    </div>
  );
}

function ExamSummaryCard({
  exam,
  pending,
  onSavePassing,
  onOpenBreakdown,
}: {
  exam: ExamSummary;
  pending: boolean;
  onSavePassing: (examId: string, score: number | null) => void;
  onOpenBreakdown: (examId: string, examCode: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(exam.passingScore));
  const maxBucket = Math.max(1, ...exam.distribution);

  function commit() {
    setEditing(false);
    const n = Math.round(Number(draft));
    if (Number.isFinite(n) && n >= 0 && n <= exam.total) onSavePassing(exam.examId, n);
  }

  return (
    <article className="rounded-2xl border border-line bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-bold text-ink">{exam.examTitle}</h3>
          <p className="text-sm text-muted">
            {exam.examCode} · ส่งแล้ว{" "}
            <b className="font-display tabular-nums text-ink-soft">
              {exam.submitted}/{exam.assigned}
            </b>{" "}
            คน
            {exam.passRate != null && (
              <>
                {" "}
                · ผ่าน <b className="font-display tabular-nums text-ink-soft">{exam.passRate}%</b>
              </>
            )}
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-2xl font-extrabold tabular-nums text-ink">
            {exam.avgPercent != null ? `${exam.avgPercent}%` : "—"}
          </p>
          <p className="text-xs text-muted">เฉลี่ย</p>
        </div>
      </div>

      {exam.anomalyFlag && (
        <button
          type="button"
          onClick={() => onOpenBreakdown(exam.examId, exam.examCode)}
          className="mt-3 block w-full rounded-xl bg-accent-50 px-4 py-2.5 text-left text-sm text-accent-800 ring-1 ring-accent-100 transition-colors hover:bg-accent-100"
        >
          คะแนนต่ำผิดปกติทั้งชุด — อาจตรวจเฉลยเพี้ยน (ANS mapping) ·{" "}
          <span className="font-bold underline">ตรวจ mapping เฉลย</span>
        </button>
      )}

      {/* การกระจายคะแนน */}
      <div className="mt-4 flex items-end gap-1.5">
        {exam.distribution.map((count, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-16 w-full items-end">
              <div
                className="w-full rounded-t bg-brand-200"
                style={{ height: `${(count / maxBucket) * 100}%` }}
                title={`${count} คน`}
              />
            </div>
            <span className="text-[10px] text-hint">{i * 20}–{i * 20 + 20}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted">เกณฑ์ผ่าน:</span>
          {editing ? (
            <input
              autoFocus
              type="number"
              min={0}
              max={exam.total}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                else if (e.key === "Escape") setEditing(false);
              }}
              className="w-16 rounded-md border border-brand-300 px-1.5 py-0.5 text-center font-display font-bold tabular-nums focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setDraft(String(exam.passingScore));
                setEditing(true);
              }}
              className="font-display font-bold tabular-nums text-ink underline decoration-dotted underline-offset-4 hover:text-brand-700"
            >
              {exam.passingScore}/{exam.total}
            </button>
          )}
          {exam.isDefault && <span className="text-xs text-hint">(ค่าเริ่มต้น)</span>}
          {!exam.isDefault && (
            <button
              type="button"
              disabled={pending}
              onClick={() => onSavePassing(exam.examId, null)}
              className="text-xs font-semibold text-muted hover:text-ink"
            >
              คืนค่าเริ่มต้น
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => onOpenBreakdown(exam.examId, exam.examCode)}
          className="ml-auto rounded-lg border border-brand-200 px-3 py-1.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
        >
          วิเคราะห์รายข้อ
        </button>
      </div>
    </article>
  );
}

function Empty() {
  return (
    <div className="rounded-2xl border border-line bg-white px-5 py-14 text-center shadow-card">
      <p className="text-2xl">📊</p>
      <p className="mt-2 font-semibold text-ink">ยังไม่มีข้อมูลผลรายชุด</p>
      <p className="mt-1 text-sm text-muted">เมื่อมีนักเรียนส่งคำตอบ ผลจะสรุปที่นี่</p>
    </div>
  );
}
