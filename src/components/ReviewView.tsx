"use client";

import { useEffect, useRef } from "react";

export default function ReviewView({
  reviewHtml,
  answers,
}: {
  reviewHtml: string;
  answers: number[];
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
      srcDoc={reviewHtml}
      className="h-[80vh] w-full rounded-xl border border-gray-200 bg-white"
      title="review"
    />
  );
}
