"use client";

import { useState } from "react";

/** ปุ่มคัดลอกข้อความเตือน → clipboard (ยังไม่มี push/email infra) */
export default function CopyButton({ text, label = "คัดลอกข้อความเตือน" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // เบราว์เซอร์ไม่รองรับ clipboard → fallback select-all ผ่าน prompt
      window.prompt("คัดลอกข้อความนี้:", text);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`flex-none rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
        copied
          ? "border-green-200 bg-green-50 text-green-700"
          : "border-accent-200 text-accent-700 hover:bg-accent-50"
      }`}
    >
      {copied ? "คัดลอกแล้ว ✓" : label}
    </button>
  );
}
