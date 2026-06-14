"use client";

import { useEffect, useRef } from "react";
import Watermark from "@/components/Watermark";

export default function ReviewView({
  reviewHtml,
  answers,
  studentName,
}: {
  reviewHtml: string;
  answers: number[];
  studentName: string;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      const d = e.data || {};
      if (d.source === "bsiink-exam" && d.type === "REVIEW_READY") {
        iframeRef.current?.contentWindow?.postMessage(
          { type: "REVIEW_APPLY", answers },
          "*"
        );
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [answers]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white">
      <iframe
        ref={iframeRef}
        srcDoc={reviewHtml}
        className="h-[80vh] w-full border-0"
        title="review"
      />
      {/* ลายน้ำชื่อนักเรียน — เหมือนตอนทำข้อสอบจริง (กันแคป/ไฟล์หลุด) */}
      <Watermark name={studentName} />
    </div>
  );
}
