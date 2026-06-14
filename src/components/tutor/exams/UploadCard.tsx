"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createExam, validateExamFile, type ValidateResult } from "@/lib/actions/tutor";

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 5 6v6c0 4.4 3 7.5 7 9 4-1.5 7-4.6 7-9V6l-7-3z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
function UploadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 16V4M8 8l4-4 4 4" />
      <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}

export default function UploadCard() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [validating, setValidating] = useState(false);
  const [report, setReport] = useState<ValidateResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleFile(f: File | null) {
    setFile(f);
    setReport(null);
    setMsg(null);
    if (!f) return;
    if (!/\.html?$/i.test(f.name)) {
      setReport({
        ok: false,
        filename: f.name,
        title: "",
        questionCount: 0,
        strippedCount: 0,
        katexOk: false,
        errors: ["รองรับเฉพาะไฟล์ .html"],
        warnings: [],
      });
      return;
    }
    setValidating(true);
    const fd = new FormData();
    fd.set("file", f);
    setReport(await validateExamFile(fd));
    setValidating(false);
  }

  async function onUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file || !report?.ok) return;
    setUploading(true);
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    fd.set("file", file);
    const r = await createExam(fd);
    setMsg({ ok: r.ok, text: r.message });
    setUploading(false);
    if (r.ok) {
      setFile(null);
      setReport(null);
      (e.target as HTMLFormElement).reset();
      router.refresh();
    }
  }

  const canUpload = !!file && !!report?.ok && !validating && !uploading;

  return (
    <form
      onSubmit={onUpload}
      className="rounded-2xl border border-line bg-white p-4 shadow-card sm:p-5"
    >
      <h2 className="font-display text-lg font-bold text-ink">อัปโหลดข้อสอบ (HTML)</h2>
      <p className="mt-1 text-sm text-muted">
        ระบบจะถอดเฉลย ลบปุ่มเฉลย/แอนิเมชันออกจากฉบับสอบให้อัตโนมัติ
      </p>

      {/* labels ถาวร: รหัสชุด + เวลาสอบ */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label htmlFor="exam_code" className="mb-1.5 block text-sm font-semibold text-ink-soft">
            รหัสชุด
          </label>
          <input
            id="exam_code"
            name="exam_code"
            placeholder="เช่น CU-ATS_Aug2027"
            required
            className="w-full rounded-xl border border-line bg-white px-4 py-3 text-base transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
        <div>
          <label htmlFor="duration_minutes" className="mb-1.5 block text-sm font-semibold text-ink-soft">
            เวลาสอบ
          </label>
          <div className="relative">
            <input
              id="duration_minutes"
              name="duration_minutes"
              type="number"
              defaultValue={30}
              min={1}
              className="w-full rounded-xl border border-line bg-white py-3 pl-4 pr-14 text-base transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted">
              นาที
            </span>
          </div>
        </div>
      </div>

      {/* dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFile(e.dataTransfer.files?.[0] ?? null);
        }}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="ลากไฟล์ .html มาวาง หรือเลือกไฟล์"
        className={`mt-3 flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed px-4 py-3.5 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/40 ${
          dragOver ? "border-brand-500 bg-brand-50" : "border-line bg-canvas/40 hover:border-brand-300"
        }`}
      >
        <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-brand-50 text-brand-600">
          <UploadIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">
            {file ? file.name : "ลากไฟล์ .html มาวาง หรือเลือกไฟล์"}
          </p>
          <p className="text-xs text-muted">รองรับฉบับ Interactive ไฟล์เดียว</p>
        </div>
        <span className="hidden flex-none rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink-soft sm:inline-block">
          เลือกไฟล์
        </span>
        <input
          ref={inputRef}
          name="file"
          type="file"
          accept=".html,text/html"
          className="sr-only"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
      </div>

      {/* แถบสรุปผล validate */}
      {validating && (
        <p className="mt-3 rounded-xl bg-canvas px-4 py-3 text-sm text-muted">กำลังตรวจไฟล์…</p>
      )}
      {report && !validating && <ValidateBar report={report} />}

      {msg && (
        <p
          className={`mt-3 rounded-xl px-4 py-3 text-sm font-medium ring-1 ${
            msg.ok ? "bg-green-50 text-green-700 ring-green-200" : "bg-red-50 text-red-700 ring-red-100"
          }`}
        >
          {msg.text}
        </p>
      )}

      <div className="mt-4 flex">
        <button
          disabled={!canUpload}
          className="ml-auto w-full rounded-xl bg-brand-600 px-6 py-3 text-base font-bold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {uploading ? "กำลังประมวลผล…" : "อัปโหลด & บันทึกเป็นฉบับร่าง"}
        </button>
      </div>
    </form>
  );
}

function ValidateBar({ report }: { report: ValidateResult }) {
  if (!report.ok) {
    return (
      <div className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
        <p className="font-semibold">{report.filename || "ไฟล์"} — ตรวจไม่ผ่าน</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-5">
          {report.errors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      </div>
    );
  }
  const hasWarn = report.warnings.length > 0;
  return (
    <div
      className={`mt-3 rounded-xl px-4 py-3 text-sm ring-1 ${
        hasWarn ? "bg-accent-50 text-accent-800 ring-accent-100" : "bg-green-50 text-green-700 ring-green-200"
      }`}
    >
      <p className="flex items-center gap-2 font-semibold">
        <ShieldCheckIcon className="h-4 w-4 flex-none" />
        {report.filename}
      </p>
      <p className="mt-1 text-[13px] leading-relaxed">
        พบ {report.questionCount} ข้อ · ถอดเฉลยออกแล้ว {report.strippedCount} ข้อ · KaTeX{" "}
        {report.katexOk ? "ผ่าน" : "พบปัญหา"} · ลายน้ำเพิ่มอัตโนมัติตอนสอบ
      </p>
      {hasWarn && (
        <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-[13px]">
          {report.warnings.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
