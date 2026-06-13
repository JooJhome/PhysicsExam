"use client";

import { useState } from "react";

export type Credential = { username: string; password: string; displayName?: string };

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

function buildText(creds: Credential[]): string {
  return creds.map((c) => `${c.username} / ${c.password}`).join("\n");
}

function buildCsv(creds: Credential[]): string {
  const head = "username,password,full_name";
  const rows = creds.map(
    (c) => `${c.username},${c.password},${(c.displayName ?? "").replace(/,/g, " ")}`
  );
  return [head, ...rows].join("\n");
}

function printSlips(creds: Credential[]) {
  const w = window.open("", "_blank", "width=640,height=800");
  if (!w) return;
  const slips = creds
    .map(
      (c) => `
      <div class="slip">
        <p class="t">BSIINK — ข้อมูลเข้าระบบ</p>
        ${c.displayName ? `<p class="n">${c.displayName}</p>` : ""}
        <table>
          <tr><td>Username</td><td class="mono">${c.username}</td></tr>
          <tr><td>Password</td><td class="mono">${c.password}</td></tr>
        </table>
        <p class="h">เก็บไว้เป็นความลับ · รหัสนี้แสดงครั้งเดียว</p>
      </div>`
    )
    .join("");
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>สลิปเข้าระบบ</title>
    <style>
      *{font-family:system-ui,'Noto Sans Thai',sans-serif}
      body{margin:24px}
      .slip{border:1px dashed #999;border-radius:10px;padding:16px;margin:0 0 14px;page-break-inside:avoid}
      .t{font-weight:700;margin:0 0 4px}
      .n{margin:0 0 8px;color:#444}
      table{border-collapse:collapse}
      td{padding:3px 10px 3px 0}
      .mono{font-family:ui-monospace,Menlo,Consolas,monospace;font-weight:700}
      .h{margin:10px 0 0;font-size:12px;color:#888}
    </style></head><body>${slips}<script>window.onload=function(){window.print()}</script></body></html>`);
  w.document.close();
}

export default function CredentialHandoff({
  creds,
  onDismiss,
}: {
  creds: Credential[];
  onDismiss?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  if (creds.length === 0) return null;
  const single = creds.length === 1;

  async function copy() {
    try {
      await navigator.clipboard.writeText(buildText(creds));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard อาจถูกบล็อก — เงียบไว้ */
    }
  }

  function downloadCsv() {
    const blob = new Blob([buildCsv(creds)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bsiink-credentials.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const btn =
    "inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg border border-green-200 bg-white px-3 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-50";

  return (
    <div className="rounded-xl bg-green-50 p-4 ring-1 ring-green-200">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          {single ? (
            <p className="text-sm text-green-800">
              สร้าง <b>{creds[0].username}</b> แล้ว — ส่งให้นักเรียน:{" "}
              <span className="rounded bg-white px-2 py-0.5 font-mono text-[13px] font-bold text-ink ring-1 ring-green-200">
                {creds[0].username} / {creds[0].password}
              </span>
            </p>
          ) : (
            <p className="text-sm text-green-800">
              สร้าง <b>{creds.length}</b> บัญชีแล้ว — รหัสแสดงครั้งเดียว
              คัดลอก/ดาวน์โหลดเก็บไว้ก่อนปิด
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={copy} className={btn}>
            <CopyIcon className="h-4 w-4" />
            {copied ? "คัดลอกแล้ว" : single ? "คัดลอก" : "คัดลอกทั้งหมด"}
          </button>
          {!single && (
            <button type="button" onClick={downloadCsv} className={btn}>
              ดาวน์โหลด CSV
            </button>
          )}
          <button type="button" onClick={() => printSlips(creds)} className={btn}>
            {single ? "พิมพ์สลิป" : "พิมพ์สลิปทุกคน"}
          </button>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="inline-flex min-h-[40px] items-center rounded-lg px-3 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-100"
            >
              ปิด
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
