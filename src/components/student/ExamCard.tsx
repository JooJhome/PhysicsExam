"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { StudentExamCard } from "@/lib/studentHome";
import { ArrowUpRight } from "@/components/Decor";
import StartConfirmDialog from "./StartConfirmDialog";

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M3 9h18M8 2v4M16 2v4" />
    </svg>
  );
}
function ClockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

const BTN = "flex w-full min-h-[48px] items-center justify-center gap-1.5 rounded-xl text-sm font-bold transition-colors";

export default function ExamCard({ exam }: { exam: StudentExamCard }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [starting, setStarting] = useState(false);

  const examUrl = `/student/exam/${exam.examId}`;
  const resultUrl = `/student/result/${exam.examId}`;
  const blocked = exam.notYetOpen || exam.closed; // เริ่มใหม่ไม่ได้

  function confirmStart() {
    setStarting(true);
    router.push(examUrl);
  }

  return (
    <li className="flex flex-col rounded-[14px] border border-line bg-white p-4 shadow-card transition-all hover:border-brand-200 hover:shadow-lift motion-safe:hover:-translate-y-0.5">
      {/* header: tag + practice badge */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded-full bg-brand-50 px-3 py-1 font-display text-xs font-bold tracking-wide text-brand-700">
          {exam.code}
        </span>
        {exam.kind === "practice" && (
          <span className="rounded-full bg-accent-50 px-2.5 py-1 text-xs font-bold text-accent-700 ring-1 ring-accent-200">
            แบบฝึกหัด
          </span>
        )}
        {exam.status === "in_progress" && (
          <span className="rounded-full bg-accent-50 px-2.5 py-1 text-xs font-bold text-accent-700 ring-1 ring-accent-200">
            ทำค้างไว้
          </span>
        )}
      </div>

      <h3 className="mt-3 font-display text-lg font-bold leading-snug text-ink">{exam.title}</h3>
      <p className="mt-1 text-sm text-ink-soft">
        <span className="font-display font-semibold tabular-nums">{exam.questionCount}</span> ข้อ ·{" "}
        {exam.untimed ? (
          "ไม่จับเวลา"
        ) : (
          <>
            <span className="font-display font-semibold tabular-nums">{exam.durationMin}</span> นาที
          </>
        )}
      </p>

      {/* แถบสถานะกลาง — ต่างกันตาม status */}
      <div className="mt-2.5 min-h-[1.75rem]">
        {/* not_started: โชว์ป้ายเวลาเฉพาะเมื่อใกล้กำหนด (urgent) — ที่เหลือซ่อนไว้ ลด noise
            (สถานะ "ยังไม่เปิด"/"ปิดรับแล้ว" สื่อผ่านปุ่มด้านล่างแล้ว) */}
        {exam.status === "not_started" && exam.urgent && exam.availabilityLabel && (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
            <CalendarIcon className="h-3.5 w-3.5" />⚠ {exam.availabilityLabel}
          </span>
        )}

        {/* in_progress: เหลือเวลา */}
        {exam.status === "in_progress" && exam.remainingLabel && (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent-50 px-2.5 py-1 text-xs font-semibold text-accent-700">
            <ClockIcon className="h-3.5 w-3.5" />
            ทำค้างไว้ · {exam.remainingLabel}
          </span>
        )}

        {/* submitted: คะแนน + ผ่าน/ไม่ผ่าน */}
        {exam.status === "submitted" && (
          <div className="flex flex-wrap items-center gap-2">
            {exam.score != null && (
              <span className="inline-flex items-baseline gap-1.5">
                <span className="font-display text-2xl font-extrabold tabular-nums text-ink">
                  {exam.score}
                </span>
                <span className="text-sm font-semibold text-muted">
                  /{exam.total}
                  {exam.percent != null && ` · ${exam.percent}%`}
                </span>
              </span>
            )}
            {exam.passed != null && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                  exam.passed ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                }`}
              >
                {exam.passed ? <CheckIcon className="h-3 w-3" /> : null}
                {exam.passed ? "ผ่าน" : "ไม่ผ่าน"}
              </span>
            )}
          </div>
        )}
      </div>

      {exam.status === "submitted" && exam.submittedLabel && (
        <p className="mt-1.5 text-xs text-muted">
          {exam.submittedLabel}
          {exam.canReview && " · เฉลยพร้อมให้ทบทวน"}
          {exam.reviewClosed && " · เฉลยปิด"}
          {exam.reviewedAlready && " · ดูเฉลยไปแล้ว"}
        </p>
      )}

      {/* ปุ่ม — ต่างกันตาม status */}
      <div className="mt-4">
        {exam.status === "submitted" ? (
          exam.canReview ? (
            <Link href={resultUrl} className={`${BTN} border border-brand-200 text-brand-700 hover:bg-brand-50`}>
              {exam.kind === "practice" ? "ดูเฉลย / ทำใหม่" : "ดูเฉลย"}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          ) : (
            <div className={`${BTN} cursor-default border border-line bg-canvas text-muted`}>
              <CheckIcon className="h-4 w-4 text-green-600" />
              ส่งแล้ว
            </div>
          )
        ) : exam.status === "in_progress" ? (
          <Link href={examUrl} className={`${BTN} border-2 border-accent-400 text-accent-800 hover:bg-accent-50`}>
            ทำต่อ
          </Link>
        ) : blocked ? (
          <div className={`${BTN} cursor-not-allowed border border-line bg-canvas text-hint`}>
            {exam.notYetOpen ? "ยังไม่เปิด" : "ปิดรับแล้ว"}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className={`${BTN} bg-accent-400 text-ink shadow-sm hover:bg-accent-500`}
          >
            เริ่มทำ
            <ArrowUpRight className="h-4 w-4" />
          </button>
        )}
      </div>

      <StartConfirmDialog
        open={confirming}
        examName={exam.title}
        durationMin={exam.durationMin}
        untimed={exam.untimed}
        busy={starting}
        onConfirm={confirmStart}
        onCancel={() => setConfirming(false)}
      />
    </li>
  );
}
