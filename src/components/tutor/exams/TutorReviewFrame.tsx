"use client";

import { useEffect, useRef } from "react";

/**
 * เฉลยฉบับติวเตอร์ — render review_html แล้วป้อน "เฉลยที่ถูกต้อง" (answer key) เข้าไป
 * ผ่าน handshake เดียวกับฝั่งนักเรียน (REVIEW_READY → REVIEW_APPLY) เพื่อให้ทุกข้อ
 * โชว์คำตอบที่ถูก + วิธีทำ โดยไม่ผูกกับนักเรียนคนใดคนหนึ่ง
 */
export default function TutorReviewFrame({
  reviewHtml,
  answers,
  title,
}: {
  reviewHtml: string;
  answers: number[];
  title: string;
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
    <iframe
      ref={iframeRef}
      title={`เฉลย ${title}`}
      srcDoc={reviewHtml}
      className="min-h-0 w-full flex-1 rounded-b-2xl border border-t-0 border-line bg-white"
    />
  );
}
