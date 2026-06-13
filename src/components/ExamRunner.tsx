"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ExamSurvey from "@/components/ExamSurvey";
import ConfirmDialog from "@/components/ConfirmDialog";

interface StartData {
  exam_id: string;
  title: string;
  exam_html: string;
  duration_minutes: number;
  total_questions: number;
  started_at: string;
}

// dialog ที่กำลังเปิด (แทน native confirm/alert ทั้งหมด)
type DialogState =
  | { kind: "submit"; unanswered: number }
  | { kind: "submit-error"; message: string }
  | { kind: "session-expired" }
  | null;

const CAUTION_MS = 10 * 60000; // เหลือ 10 นาที = เตือน
const DANGER_MS = 2 * 60000; // เหลือ 2 นาที = เร่งด่วน

export default function ExamRunner({
  examId,
  studentName,
}: {
  examId: string;
  studentName: string;
}) {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [data, setData] = useState<StartData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [answered, setAnswered] = useState(0);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [dialog, setDialog] = useState<DialogState>(null);
  const submittedRef = useRef(false);
  const startedRef = useRef(false);

  // ---- เริ่ม/กลับเข้าทำข้อสอบ ----
  useEffect(() => {
    // กันยิงซ้ำ (React Strict Mode รัน effect 2 รอบ → 2 RPC ชนกัน)
    if (startedRef.current) return;
    startedRef.current = true;
    const supabase = createClient();
    supabase
      .rpc("start_attempt", { p_exam_id: examId })
      .then(async ({ data, error }) => {
        if (error) {
          if (error.message.includes("already_submitted")) {
            // ส่งไปแล้ว → ถ้ายังไม่ตอบแบบสอบถาม บังคับตอบก่อน, ไม่งั้นกลับหน้าหลัก
            const { data: done } = await supabase.rpc("has_survey", {
              p_exam_id: examId,
            });
            if (done) router.replace(`/student/result/${examId}`);
            else setShowSurvey(true);
            return;
          }
          setLoadError(mapError(error.message));
          return;
        }
        setData(data as StartData);
      });
  }, [examId, router]);

  // ---- ส่งคำตอบ ----
  const doSubmit = useCallback(
    async (answers: (number | null)[]) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setSubmitting(true);
      const supabase = createClient();
      const { error } = await supabase.rpc("submit_attempt", {
        p_exam_id: examId,
        p_answers: answers,
      });
      if (error) {
        // attempt หายไป (เช่น ติวเตอร์รีเซ็ต/หน้าค้าง) → พากลับไปเริ่มใหม่
        if (error.message.includes("not_started")) {
          setSubmitting(false);
          setDialog({ kind: "session-expired" });
          return;
        }
        submittedRef.current = false;
        setSubmitting(false);
        setDialog({ kind: "submit-error", message: mapError(error.message) });
        return;
      }
      iframeRef.current?.contentWindow?.postMessage({ type: "EXAM_LOCK" }, "*");
      // ส่งสำเร็จ → บังคับตอบแบบสอบถามก่อน แล้วค่อยกลับหน้าหลัก
      setShowSurvey(true);
    },
    [examId]
  );

  // ---- รับ message จาก iframe ----
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      const d = e.data || {};
      if (d.source !== "bsiink-exam") return;
      if (d.type === "EXAM_PROGRESS") setAnswered(d.answered ?? 0);
      else if (d.type === "EXAM_ANSWERS") doSubmit(d.answers);
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [doSubmit]);

  // ---- timer ----
  useEffect(() => {
    if (!data || showSurvey) return;
    const deadline =
      new Date(data.started_at).getTime() + data.duration_minutes * 60000;
    const tick = () => {
      const left = deadline - Date.now();
      setRemaining(Math.max(0, left));
      if (left <= 0 && !submittedRef.current) requestCollect();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, showSurvey]);

  function requestCollect() {
    iframeRef.current?.contentWindow?.postMessage(
      { type: "EXAM_COLLECT" },
      "*"
    );
  }

  function onClickSubmit() {
    if (!data) return;
    // ยืนยันทุกครั้ง — การส่งย้อนกลับไม่ได้ (1 ครั้ง/ชุด)
    setDialog({ kind: "submit", unanswered: data.total_questions - answered });
  }

  function confirmSubmit() {
    setDialog(null);
    requestCollect();
  }

  if (loadError) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="rounded-xl bg-red-50 p-6 ring-1 ring-red-200">
          <p className="font-semibold text-red-800">{loadError}</p>
          <button
            onClick={() => router.replace("/student")}
            className="mt-4 rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:bg-slate-50"
          >
            กลับหน้ารวม
          </button>
        </div>
      </main>
    );
  }

  if (showSurvey) {
    return (
      <ExamSurvey
        examId={examId}
        onDone={() => router.replace(`/student/result/${examId}`)}
      />
    );
  }

  if (!data) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <Spinner />
        <p className="text-sm font-medium text-muted">กำลังเตรียมข้อสอบ…</p>
      </main>
    );
  }

  const total = data.total_questions;
  const progressPct = total ? Math.round((answered / total) * 100) : 0;
  const phase = timerPhase(remaining);

  return (
    <div className="relative flex h-[100dvh] flex-col">
      {/* แถบควบคุม (โหมดโฟกัส — ไม่มี nav/ออกจากระบบ) */}
      <div className="border-b border-line bg-white">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-2.5">
          <span className="hidden font-display text-sm font-bold tracking-tight text-brand-700 sm:inline">
            BSIINK
          </span>
          <span className="font-semibold text-ink">{data.title}</span>
          <span className="text-sm text-muted">
            ตอบแล้ว{" "}
            <span className="font-display font-semibold tabular-nums text-ink-soft">
              {answered}/{total}
            </span>
          </span>

          <div className="ml-auto flex items-center gap-2.5">
            {phase !== "normal" && (
              <span
                aria-live="polite"
                className={`hidden text-xs font-semibold sm:inline ${
                  phase === "danger" ? "text-red-700" : "text-amber-700"
                }`}
              >
                {phase === "danger" ? "ใกล้หมดเวลามาก" : "ใกล้หมดเวลา"}
              </span>
            )}
            <span
              role="timer"
              aria-label={`เวลาที่เหลือ ${fmt(remaining)}`}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-display text-sm font-bold tabular-nums ring-1 ${timerToneClass(
                phase
              )}`}
            >
              <ClockIcon />
              {fmt(remaining)}
            </span>
            <button
              onClick={onClickSubmit}
              disabled={submitting}
              className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
            >
              {submitting ? "กำลังส่ง…" : "ส่งคำตอบ"}
            </button>
          </div>
        </div>

        {/* แถบความคืบหน้า — visibility of status แบบเงียบๆ */}
        <div
          className="h-1 w-full bg-slate-100"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={answered}
          aria-label="ความคืบหน้าการตอบ"
        >
          <div
            className="h-full bg-brand-500 transition-[width] duration-300 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* ข้อสอบใน iframe (sandbox) */}
      <div className="relative flex-1">
        <iframe
          ref={iframeRef}
          srcDoc={data.exam_html}
          className="h-full w-full border-0"
          title="exam"
        />
        {/* ลายน้ำชื่อนักเรียน (กันแคป/ไฟล์หลุด) */}
        <Watermark name={studentName} />
      </div>

      {/* ---- Dialogs (แทน native confirm/alert) ---- */}
      <ConfirmDialog
        open={dialog?.kind === "submit"}
        title="ส่งคำตอบ?"
        body={
          <>
            {dialog?.kind === "submit" && dialog.unanswered > 0 ? (
              <p>
                คุณยังไม่ได้ตอบอีก{" "}
                <span className="font-semibold text-ink">
                  {dialog.unanswered} ข้อ
                </span>
              </p>
            ) : (
              <p>คุณตอบครบทุกข้อแล้ว</p>
            )}
            <p className="mt-1.5 font-medium text-ink">
              เมื่อส่งแล้วจะแก้ไขคำตอบไม่ได้ และทำชุดนี้ซ้ำไม่ได้
            </p>
          </>
        }
        confirmLabel="ส่งคำตอบ"
        cancelLabel="ทำต่อ"
        tone="brand"
        onConfirm={confirmSubmit}
        onCancel={() => setDialog(null)}
      />

      <ConfirmDialog
        open={dialog?.kind === "submit-error"}
        title="ส่งคำตอบไม่สำเร็จ"
        body={dialog?.kind === "submit-error" ? dialog.message : undefined}
        confirmLabel="ลองอีกครั้ง"
        tone="danger"
        onConfirm={() => setDialog(null)}
      />

      <ConfirmDialog
        open={dialog?.kind === "session-expired"}
        title="เซสชันการทำข้อสอบหมดอายุ"
        body="กรุณากลับไปหน้ารวมแล้วกด “เริ่มทำ” ใหม่อีกครั้ง"
        confirmLabel="กลับหน้ารวม"
        tone="brand"
        dismissible={false}
        onConfirm={() => router.replace("/student")}
      />
    </div>
  );
}

function Watermark({ name }: { name: string }) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='180'><text x='0' y='100' transform='rotate(-28 160 90)' font-family='sans-serif' font-size='20' fill='%23000'>${name}</text></svg>`;
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.07]"
      style={{
        backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(
          svg
        )}")`,
        backgroundRepeat: "repeat",
      }}
    />
  );
}

function Spinner() {
  return (
    <span
      className="block h-8 w-8 animate-spin rounded-full border-2 border-line border-t-brand-600 motion-reduce:animate-none"
      role="status"
      aria-label="กำลังโหลด"
    />
  );
}

function ClockIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

type Phase = "normal" | "caution" | "danger";

function timerPhase(ms: number | null): Phase {
  if (ms === null) return "normal";
  if (ms <= DANGER_MS) return "danger";
  if (ms <= CAUTION_MS) return "caution";
  return "normal";
}

function timerToneClass(phase: Phase): string {
  switch (phase) {
    case "danger":
      return "bg-red-600 text-white ring-red-700";
    case "caution":
      return "bg-amber-100 text-amber-800 ring-amber-300";
    default:
      return "bg-ink text-white ring-transparent";
  }
}

function fmt(ms: number | null): string {
  if (ms === null) return "--:--";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  // โชว์ชั่วโมงเมื่อสอบยาว (เช่น 180 นาที) เพื่อให้อ่านง่ายกว่า "175:23"
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

function mapError(msg: string): string {
  if (msg.includes("not_assigned")) return "คุณไม่ได้รับมอบหมายข้อสอบชุดนี้";
  if (msg.includes("exam_not_available")) return "ข้อสอบยังไม่เปิดให้ทำ";
  if (msg.includes("already_submitted")) return "คุณทำข้อสอบชุดนี้ไปแล้ว";
  if (msg.includes("not_started"))
    return "ยังไม่ได้เริ่มทำข้อสอบ กรุณากด “เริ่มทำ” ใหม่";
  if (msg.includes("not_authenticated")) return "กรุณาเข้าสู่ระบบใหม่";
  return msg;
}
