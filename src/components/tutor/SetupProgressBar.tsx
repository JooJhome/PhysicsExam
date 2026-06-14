"use client";

import { useEffect, useState } from "react";
import type { SetupStep } from "@/lib/overview";

const STORAGE_KEY = "bsiink:tutor-setup-dismissed";

export default function SetupProgressBar({
  done,
  steps,
}: {
  done: number;
  steps: SetupStep[];
}) {
  const total = steps.length;
  const complete = done >= total;
  const [dismissed, setDismissed] = useState(true); // ซ่อนไว้ก่อนจน hydrate เสร็จ (กันกระพริบ)

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  // ครบทุกขั้น → ไม่ต้องแสดง (และจำไว้ว่าเคลียร์แล้ว)
  if (complete || dismissed) return null;

  const next = steps.find((s) => !s.done)?.label ?? "";
  const pct = Math.round((done / total) * 100);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-accent-100 bg-accent-50/70 px-4 py-2.5">
      <p className="text-sm text-accent-800">
        ตั้งค่าเริ่มต้นเสร็จแล้ว{" "}
        <span className="font-display font-bold tabular-nums">
          {done}/{total}
        </span>
        {next && (
          <>
            {" "}
            — เหลือ <span className="font-semibold">{next}</span>
          </>
        )}
      </p>
      <div
        className="ml-auto hidden h-1.5 w-32 overflow-hidden rounded-full bg-accent-100 sm:block"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-accent-400 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="ปิดแถบตั้งค่า"
        className="grid h-7 w-7 flex-none place-items-center rounded-lg text-accent-700 transition-colors hover:bg-accent-100"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  );
}
