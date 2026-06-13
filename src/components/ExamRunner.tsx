"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface StartData {
  exam_id: string;
  title: string;
  exam_html: string;
  duration_minutes: number;
  total_questions: number;
  started_at: string;
}

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
  const submittedRef = useRef(false);

  // ---- เริ่ม/กลับเข้าทำข้อสอบ ----
  useEffect(() => {
    const supabase = createClient();
    supabase
      .rpc("start_attempt", { p_exam_id: examId })
      .then(({ data, error }) => {
        if (error) {
          if (error.message.includes("already_submitted")) {
            router.replace(`/student/result/${examId}`);
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
        submittedRef.current = false;
        setSubmitting(false);
        alert("ส่งคำตอบไม่สำเร็จ: " + mapError(error.message));
        return;
      }
      iframeRef.current?.contentWindow?.postMessage({ type: "EXAM_LOCK" }, "*");
      router.replace(`/student/result/${examId}`);
    },
    [examId, router]
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
    if (!data) return;
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
  }, [data]);

  function requestCollect() {
    iframeRef.current?.contentWindow?.postMessage(
      { type: "EXAM_COLLECT" },
      "*"
    );
  }

  function onClickSubmit() {
    const left = data ? data.total_questions - answered : 0;
    if (
      left > 0 &&
      !confirm(`ยังไม่ได้ตอบ ${left} ข้อ ต้องการส่งคำตอบเลยหรือไม่?`)
    )
      return;
    requestCollect();
  }

  if (loadError) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="rounded-xl bg-red-50 p-6 ring-1 ring-red-200">
          <p className="font-semibold text-red-800">{loadError}</p>
          <button
            onClick={() => router.replace("/student")}
            className="mt-4 rounded-lg bg-white px-4 py-2 text-sm ring-1 ring-gray-300"
          >
            กลับหน้ารวม
          </button>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="px-4 py-16 text-center text-gray-500">
        กำลังโหลดข้อสอบ...
      </main>
    );
  }

  return (
    <div className="relative flex h-[calc(100vh-57px)] flex-col">
      {/* แถบควบคุม */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-gray-200 bg-white px-4 py-2">
        <span className="font-semibold text-gray-900">{data.title}</span>
        <span className="text-sm text-gray-500">
          ตอบแล้ว {answered}/{data.total_questions}
        </span>
        <span
          className={`ml-auto rounded-full px-3 py-1 text-sm font-bold tabular-nums ${
            remaining !== null && remaining < 60000
              ? "bg-red-600 text-white"
              : "bg-gray-900 text-white"
          }`}
        >
          ⏱ {fmt(remaining)}
        </span>
        <button
          onClick={onClickSubmit}
          disabled={submitting}
          className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? "กำลังส่ง..." : "ส่งคำตอบ"}
        </button>
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

function fmt(ms: number | null): string {
  if (ms === null) return "--:--";
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function mapError(msg: string): string {
  if (msg.includes("not_assigned")) return "คุณไม่ได้รับมอบหมายข้อสอบชุดนี้";
  if (msg.includes("exam_not_available")) return "ข้อสอบยังไม่เปิดให้ทำ";
  if (msg.includes("already_submitted")) return "คุณทำข้อสอบชุดนี้ไปแล้ว";
  if (msg.includes("not_authenticated")) return "กรุณาเข้าสู่ระบบใหม่";
  return msg;
}
