"use client";

import type { AssignExam } from "@/lib/assign";

export default function ExamAssignRow({
  exam,
  totalStudents,
  onOpen,
}: {
  exam: AssignExam;
  totalStudents: number;
  onOpen: () => void;
}) {
  const isDraft = exam.status === "draft";
  const pct = totalStudents > 0 ? Math.round((exam.assignedCount / totalStudents) * 100) : 0;

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 shadow-card sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-base font-bold text-ink">{exam.name}</h3>
          {isDraft && (
            <span className="rounded-full bg-sand-100 px-2.5 py-0.5 text-xs font-bold text-muted">
              ฉบับร่าง
            </span>
          )}
          {exam.status === "archived" && (
            <span className="rounded-full bg-sand-100 px-2.5 py-0.5 text-xs font-bold text-muted">
              คลัง
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-muted">
          {exam.code} · มอบหมาย{" "}
          <b className="font-display font-bold tabular-nums text-ink-soft">
            {exam.assignedCount}/{totalStudents}
          </b>{" "}
          คน
        </p>
        <div className="mt-2.5 h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-sand-100">
          <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="flex-none">
        {isDraft ? (
          <button
            type="button"
            disabled
            title="ต้องเผยแพร่ชุดนี้ก่อนจึงจะมอบหมายได้"
            className="w-full min-h-[44px] cursor-not-allowed rounded-xl bg-sand-100 px-5 py-2.5 text-sm font-bold text-muted sm:w-auto"
          >
            ต้องเผยแพร่ก่อน
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpen}
            className="w-full min-h-[44px] rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-700 sm:w-auto"
          >
            มอบหมาย
          </button>
        )}
      </div>
    </article>
  );
}
