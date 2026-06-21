"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { StudentExamCard } from "@/lib/studentHome";
import { ArrowUpRight } from "@/components/Decor";
import StartConfirmDialog from "./StartConfirmDialog";

/**
 * การ์ดเด่น "ชุดถัดไป" — ดึงชุดที่ควรทำต่อมาไว้บนสุด เต็มความกว้าง พื้นเขียวอ่อน (calm)
 * เริ่ม/ทำต่อ ได้จากที่นี่เลย (เฉพาะชุดที่เริ่มได้จริง — ไม่ถูกบล็อกด้วยช่วงเวลา)
 */
export default function NextExamCard({ exam }: { exam: StudentExamCard }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [starting, setStarting] = useState(false);
  const examUrl = `/student/exam/${exam.examId}`;
  const resuming = exam.status === "in_progress";

  return (
    <div className="relative overflow-hidden rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-50 to-brand-100/70 p-5 shadow-card sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-brand-700">
            <span aria-hidden>★</span>
            {resuming ? "ทำต่อจากที่ค้างไว้" : "แนะนำให้ทำชุดนี้ต่อ"}
          </p>
          <h3 className="mt-1.5 font-display text-2xl font-extrabold leading-tight text-brand-800 sm:text-3xl">
            {exam.title}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-ink-soft">
            <span className="rounded-full bg-white/70 px-2.5 py-0.5 font-display text-xs font-bold text-brand-700">
              {exam.code}
            </span>
            <span>
              <b className="font-display tabular-nums">{exam.questionCount}</b> ข้อ ·{" "}
              {exam.untimed ? (
                "ไม่จับเวลา"
              ) : (
                <>
                  <b className="font-display tabular-nums">{exam.durationMin}</b> นาที
                </>
              )}
            </span>
            {exam.status === "in_progress" && exam.remainingLabel && (
              <span className="font-semibold text-accent-700">· {exam.remainingLabel}</span>
            )}
            {exam.status !== "in_progress" && exam.availabilityLabel && (
              <span className={exam.urgent ? "font-semibold text-red-600" : ""}>
                · {exam.urgent && "⚠ "}
                {exam.availabilityLabel}
              </span>
            )}
          </div>
        </div>

        <div className="flex-none">
          {resuming ? (
            <Link
              href={examUrl}
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-1.5 rounded-xl border-2 border-accent-400 bg-white px-6 text-sm font-bold text-accent-800 transition-colors hover:bg-accent-50 sm:w-auto"
            >
              ทำต่อ
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-1.5 rounded-xl bg-accent-400 px-6 text-sm font-bold text-ink shadow-sm transition-colors hover:bg-accent-500 sm:w-auto"
            >
              เริ่มทำ
              <ArrowUpRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <StartConfirmDialog
        open={confirming}
        examName={exam.title}
        durationMin={exam.durationMin}
        untimed={exam.untimed}
        busy={starting}
        onConfirm={() => {
          setStarting(true);
          router.push(examUrl);
        }}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}
