"use client";

import { useEffect, useRef, useState } from "react";
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

export default function UploadModal({
  open,
  onClose,
  onUploaded,
  subjects = [],
}: {
  open: boolean;
  onClose: () => void;
  onUploaded: (msg: { ok: boolean; text: string }) => void;
  subjects?: string[];
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [kind, setKind] = useState<"exam" | "practice">("exam");
  const [dragOver, setDragOver] = useState(false);
  const [validating, setValidating] = useState(false);
  const [report, setReport] = useState<ValidateResult | null>(null);
  const [uploading, setUploading] = useState(false);

  // sync prop → <dialog>
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  // reset เมื่อปิด
  useEffect(() => {
    if (!open) {
      setFile(null);
      setKind("exam");
      setReport(null);
      setValidating(false);
      setUploading(false);
    }
  }, [open]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      if (!uploading) onClose();
    };
    el.addEventListener("cancel", onCancel);
    return () => el.removeEventListener("cancel", onCancel);
  }, [onClose, uploading]);

  async function handleFile(f: File | null) {
    setFile(f);
    setReport(null);
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

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file || !report?.ok) return;
    setUploading(true);
    const fd = new FormData(e.currentTarget);
    fd.set("file", file);
    const r = await createExam(fd);
    setUploading(false);
    if (r.ok) {
      onUploaded({ ok: true, text: r.message });
      onClose();
      router.refresh();
    } else {
      onUploaded({ ok: false, text: r.message });
    }
  }

  const canUpload = !!file && !!report?.ok && !validating && !uploading;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="upload-title"
      onClick={(e) => {
        if (e.target === dialogRef.current && !uploading) onClose();
      }}
      className="m-0 h-dvh max-h-none w-full max-w-none bg-white p-0 text-ink backdrop:bg-ink/40 backdrop:backdrop-blur-[2px] open:animate-dialog-in sm:m-auto sm:h-auto sm:max-h-[90vh] sm:w-[calc(100vw-2rem)] sm:max-w-lg sm:rounded-3xl sm:shadow-lift"
    >
      <form onSubmit={onSubmit} className="flex h-full flex-col">
        {/* header */}
        <div className="flex items-start justify-between gap-3 border-b border-line p-5">
          <div>
            <h2 id="upload-title" className="font-display text-lg font-bold text-ink">
              อัปโหลดข้อสอบ (HTML)
            </h2>
            <p className="mt-1 text-sm text-muted">
              ระบบจะถอดเฉลย ลบปุ่มเฉลย/แอนิเมชันออกจากฉบับสอบให้อัตโนมัติ
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="grid h-10 w-10 flex-none place-items-center rounded-lg text-muted transition-colors hover:bg-canvas hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* body (scroll) */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* ประเภท (ข้อสอบ/แบบฝึกหัด) + วิชา/หมวด */}
          <div className="mb-3 grid gap-3 sm:grid-cols-3">
            <div>
              <span className="mb-1.5 block text-sm font-semibold text-ink-soft">ประเภท</span>
              <div className="flex rounded-xl bg-canvas p-1">
                {(["exam", "practice"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    aria-pressed={kind === k}
                    className={`min-h-[40px] flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                      kind === k ? "bg-brand-600 text-white shadow-sm" : "text-ink-soft hover:bg-white"
                    }`}
                  >
                    {k === "exam" ? "ข้อสอบ" : "แบบฝึกหัด"}
                  </button>
                ))}
              </div>
              <input type="hidden" name="kind" value={kind} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="subject" className="mb-1.5 block text-sm font-semibold text-ink-soft">
                วิชา/หมวด <span className="font-normal text-muted">(ไม่บังคับ)</span>
              </label>
              <input
                id="subject"
                name="subject"
                list="subject-options"
                placeholder="เช่น CU-ATS, TBAT, ฟิสิกส์ ม.6"
                autoComplete="off"
                className="w-full rounded-xl border border-line bg-white px-4 py-3 text-base transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
              <datalist id="subject-options">
                {subjects.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
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
            className={`mt-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-7 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/40 ${
              dragOver ? "border-brand-500 bg-brand-50" : "border-line bg-canvas/40 hover:border-brand-300"
            }`}
          >
            <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-50 text-brand-600">
              <UploadIcon className="h-5 w-5" />
            </span>
            <p className="text-sm font-semibold text-ink">
              {file ? file.name : "ลากไฟล์ .html มาวาง หรือเลือกไฟล์"}
            </p>
            <p className="text-xs text-muted">รองรับฉบับ Interactive ไฟล์เดียว</p>
            <input
              ref={inputRef}
              name="file"
              type="file"
              accept=".html,text/html"
              className="sr-only"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
          </div>

          {validating && (
            <p className="mt-3 rounded-xl bg-canvas px-4 py-3 text-sm text-muted">กำลังตรวจไฟล์…</p>
          )}
          {report && !validating && <ValidateBar report={report} />}
        </div>

        {/* footer */}
        <div className="flex flex-none items-center justify-end gap-2 border-t border-line p-5">
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="rounded-xl border border-line bg-white px-5 py-3 text-sm font-semibold text-ink-soft transition-colors hover:bg-canvas disabled:opacity-60"
          >
            ยกเลิก
          </button>
          <button
            disabled={!canUpload}
            className="rounded-xl bg-brand-600 px-6 py-3 text-base font-bold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? "กำลังประมวลผล…" : "อัปโหลด & บันทึกเป็นฉบับร่าง"}
          </button>
        </div>
      </form>
    </dialog>
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
