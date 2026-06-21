"use client";

import { useState } from "react";
import Link from "next/link";
import type { ExamSummary } from "@/lib/results";
import ScoreDotPlot from "./ScoreDotPlot";

export default function ExamSummaryView({
  exams,
  pending,
  onSavePassing,
  onOpenBreakdown,
  onOpenSurvey,
}: {
  exams: ExamSummary[];
  pending: boolean;
  onSavePassing: (examId: string, score: number | null) => void;
  onOpenBreakdown: (examId: string, examCode: string) => void;
  onOpenSurvey: (examId: string, examCode: string) => void;
}) {
  if (exams.length === 0) return <Empty />;

  // จัดลำดับตามการมีข้อมูลจริง: ชุดที่มีการส่งลอยขึ้นบน · ชุดที่ยังว่างยุบเป็นแถว
  const active = exams.filter((e) => e.submitted > 0);
  const empty = exams.filter((e) => e.submitted === 0);

  return (
    <div className="space-y-3">
      {active.length > 0 && (
        <>
          <SectionHeader label={`มีการส่งแล้ว · ${active.length} ชุด`} />
          {active.map((e) => (
            <ExamSummaryCard
              key={e.examId}
              exam={e}
              pending={pending}
              onSavePassing={onSavePassing}
              onOpenBreakdown={onOpenBreakdown}
              onOpenSurvey={onOpenSurvey}
            />
          ))}
        </>
      )}

      {empty.length > 0 && <EmptyGroup exams={empty} />}
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-1 text-sm font-semibold text-muted">
      <span className="whitespace-nowrap">{label}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

function ExamSummaryCard({
  exam,
  pending,
  onSavePassing,
  onOpenBreakdown,
  onOpenSurvey,
}: {
  exam: ExamSummary;
  pending: boolean;
  onSavePassing: (examId: string, score: number | null) => void;
  onOpenBreakdown: (examId: string, examCode: string) => void;
  onOpenSurvey: (examId: string, examCode: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(exam.passingScore));

  function commit() {
    setEditing(false);
    const n = Math.round(Number(draft));
    if (Number.isFinite(n) && n >= 0 && n <= exam.total) onSavePassing(exam.examId, n);
  }

  return (
    <article className="rounded-2xl border border-line bg-white p-4 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-base font-bold text-ink">{exam.examTitle}</h3>
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

      {/* การกระจายคะแนน — dot plot ระดับคะแนนดิบ (หน่วยเดียวกับเกณฑ์ผ่าน) */}
      <ScoreDotPlot scores={exam.scores} totalScore={exam.total} passingScore={exam.passingScore} />

      {/* สรุปรายกลุ่ม — เทียบห้อง A vs B */}
      {exam.groupStats.length > 0 && (
        <div className="mt-4 border-t border-line pt-3">
          <p className="mb-2 text-xs font-semibold text-muted">รายกลุ่ม</p>
          <div className="flex flex-wrap gap-2">
            {exam.groupStats.map((g) => (
              <div
                key={g.groupId}
                className="rounded-xl border border-line bg-canvas/50 px-3 py-2 text-sm"
                title={`${g.name} · ส่ง ${g.submitted} คน · เฉลี่ย ${g.avgPercent}% · ผ่าน ${g.passRate}%`}
              >
                <span className="font-display font-bold text-ink">{g.name}</span>
                <span className="ml-2 text-xs text-muted">{g.submitted} คน</span>
                <span className="ml-2 font-display font-bold tabular-nums text-ink-soft">{g.avgPercent}%</span>
                <span className="ml-1.5 text-xs text-muted">เฉลี่ย · ผ่าน {g.passRate}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

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
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <PreviewLink examId={exam.examId} />
          <ReviewLink examId={exam.examId} />
          <button
            type="button"
            onClick={() => onOpenSurvey(exam.examId, exam.examCode)}
            className="rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-ink-soft transition-colors hover:bg-canvas"
          >
            แบบสอบถาม
          </button>
          <button
            type="button"
            onClick={() => onOpenBreakdown(exam.examId, exam.examCode)}
            className="rounded-lg border border-brand-200 px-3 py-1.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
          >
            วิเคราะห์รายข้อ
          </button>
        </div>
      </div>
    </article>
  );
}

/** กลุ่มชุดที่ยังไม่มีการส่ง — ยุบเป็นแถวกระชับ พับ/กางได้ (ลดการเลื่อนยาวโดยเปล่าประโยชน์) */
function EmptyGroup({ exams }: { exams: ExamSummary[] }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="pt-3">
      <div className="flex items-center gap-3 text-sm font-semibold text-muted">
        <span className="whitespace-nowrap">ยังไม่มีการส่ง · {exams.length} ชุด</span>
        <span className="h-px flex-1 bg-line" />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="rounded-lg border border-line bg-white px-2.5 py-1 text-xs font-semibold text-ink-soft transition-colors hover:border-brand-200 hover:text-brand-700"
        >
          {open ? "ซ่อน" : "แสดง"}
        </button>
      </div>

      {open && (
        <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-white shadow-card">
          {exams.map((e) => (
            <ResultRowEmpty key={e.examId} exam={e} />
          ))}
        </div>
      )}
    </div>
  );
}

function ResultRowEmpty({ exam }: { exam: ExamSummary }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line px-4 py-3 first:border-t-0">
      <span className="font-display text-sm font-bold text-ink">{exam.examTitle}</span>
      <span className="rounded-full bg-brand-50 px-2.5 py-0.5 font-display text-xs font-bold text-brand-700">
        {exam.examCode}
      </span>
      <span className="min-w-0 flex-1 text-sm text-hint">
        ส่งแล้ว 0/{exam.assigned} คน · ยังไม่มีการส่ง
      </span>
      <span className="text-xs text-muted">
        เกณฑ์ {exam.passingScore}/{exam.total}
      </span>
      <div className="flex flex-none gap-1.5">
        <PreviewLink examId={exam.examId} compact />
        <ReviewLink examId={exam.examId} compact />
        <span
          title="วิเคราะห์ได้เมื่อมีการส่ง"
          className="cursor-not-allowed rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-hint opacity-60"
        >
          วิเคราะห์รายข้อ
        </span>
      </div>
    </div>
  );
}

function PreviewLink({ examId, compact = false }: { examId: string; compact?: boolean }) {
  return (
    <Link
      href={`/tutor/exams/preview/${examId}`}
      target="_blank"
      className={`inline-flex items-center gap-1.5 rounded-lg border border-line font-semibold text-ink-soft transition-colors hover:bg-canvas ${
        compact ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      ดูตัวอย่าง
    </Link>
  );
}

function ReviewLink({ examId, compact = false }: { examId: string; compact?: boolean }) {
  return (
    <Link
      href={`/tutor/exams/review/${examId}`}
      target="_blank"
      className={`inline-flex items-center gap-1.5 rounded-lg border border-line font-semibold text-ink-soft transition-colors hover:bg-canvas ${
        compact ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M9 11l3 3 8-8" />
        <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9" />
      </svg>
      ดูเฉลย
    </Link>
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
