"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createExam,
  setExamStatus,
  setExamDuration,
  setAllowReview,
  deleteExam,
} from "@/lib/actions/tutor";
import ConfirmDialog from "@/components/ConfirmDialog";

export interface ExamRow {
  id: string;
  title: string;
  exam_code: string;
  duration_minutes: number;
  total_questions: number;
  status: "draft" | "published";
  allow_review: boolean;
}

export default function ExamManager({ exams }: { exams: ExamRow[] }) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const [toDelete, setToDelete] = useState<{ id: string; title: string } | null>(
    null
  );

  async function onUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploading(true);
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    const r = await createExam(fd);
    setMsg({ ok: r.ok, text: r.message });
    setUploading(false);
    if (r.ok) {
      (e.target as HTMLFormElement).reset();
      router.refresh();
    }
  }

  function act(fn: () => Promise<{ ok: boolean; message: string }>) {
    startTransition(async () => {
      const r = await fn();
      setMsg({ ok: r.ok, text: r.message });
      router.refresh();
    });
  }

  return (
    <div className="mt-8 space-y-6">
      {/* อัปโหลด */}
      <form
        onSubmit={onUpload}
        className="rounded-3xl border border-line bg-white p-7 shadow-card"
      >
        <h2 className="font-display text-xl font-bold text-ink">
          อัปโหลดข้อสอบ (HTML)
        </h2>
        <p className="mt-1 text-sm text-muted">
          ระบบจะถอดเฉลย ลบปุ่มเฉลย/แอนิเมชันออกจากฉบับสอบให้อัตโนมัติ
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <input
            name="exam_code"
            placeholder="รหัสชุด เช่น CU-ATS_Aug2027"
            required
            className="rounded-xl border border-line bg-white px-4 py-3 text-base transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 sm:col-span-2"
          />
          <input
            name="duration_minutes"
            type="number"
            defaultValue={30}
            min={1}
            placeholder="นาที"
            className="rounded-xl border border-line bg-white px-4 py-3 text-base transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            name="file"
            type="file"
            accept=".html,text/html"
            required
            className="max-w-full text-sm text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
          />
          <button
            disabled={uploading}
            className="ml-auto rounded-xl bg-brand-600 px-6 py-3 text-base font-bold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-60"
          >
            {uploading ? "กำลังประมวลผล…" : "อัปโหลด"}
          </button>
        </div>
      </form>

      {msg && (
        <p
          className={`rounded-xl px-4 py-3 text-sm font-medium ring-1 ${
            msg.ok
              ? "bg-green-50 text-green-700 ring-green-200"
              : "bg-red-50 text-red-700 ring-red-100"
          }`}
        >
          {msg.text}
        </p>
      )}

      {/* รายการ */}
      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-display text-xl font-bold text-ink">
            ชุดข้อสอบทั้งหมด
          </h2>
          <span className="text-sm text-muted">
            <span className="font-display font-bold tabular-nums text-ink-soft">
              {exams.length}
            </span>{" "}
            ชุด
          </span>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-line bg-white shadow-card">
          <table className="w-full min-w-[680px] text-left">
            <thead>
              <tr className="border-b border-line bg-brand-50/70 text-sm text-brand-800">
                <th className="px-5 py-4 font-semibold">ชุด</th>
                <th className="px-5 py-4 font-semibold">ข้อ / เวลา</th>
                <th className="px-5 py-4 font-semibold">สถานะ</th>
                <th className="px-5 py-4 font-semibold">เฉลย</th>
                <th className="px-5 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {exams.map((e) => (
                <tr
                  key={e.id}
                  className="transition-colors hover:bg-canvas/70"
                >
                  <td className="px-5 py-4">
                    <p className="font-semibold text-ink">{e.title}</p>
                    <span className="mt-1.5 inline-block rounded-full bg-brand-50 px-2.5 py-0.5 font-display text-xs font-bold text-brand-700">
                      {e.exam_code}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-ink-soft">
                    <span className="font-display font-bold tabular-nums text-ink">
                      {e.total_questions}
                    </span>{" "}
                    ข้อ ·{" "}
                    <DurationEditor
                      key={e.duration_minutes}
                      value={e.duration_minutes}
                      disabled={pending}
                      onSave={(mins) =>
                        act(() => setExamDuration(e.id, mins))
                      }
                    />{" "}
                    น.
                  </td>
                  <td className="px-5 py-4">
                    <button
                      title="คลิกเพื่อสลับสถานะเผยแพร่"
                      onClick={() =>
                        act(() =>
                          setExamStatus(
                            e.id,
                            e.status === "published" ? "draft" : "published"
                          )
                        )
                      }
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ring-1 transition-shadow hover:ring-2 ${
                        e.status === "published"
                          ? "bg-green-50 text-green-700 ring-green-200"
                          : "bg-sand-100 text-muted ring-line"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          e.status === "published"
                            ? "bg-green-600"
                            : "bg-muted"
                        }`}
                      />
                      {e.status === "published" ? "เผยแพร่แล้ว" : "ร่าง"}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
                      <input
                        type="checkbox"
                        checked={e.allow_review}
                        onChange={(ev) =>
                          act(() => setAllowReview(e.id, ev.target.checked))
                        }
                        className="h-4 w-4 accent-brand-600"
                      />
                      ให้ดูเฉลย
                    </label>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => setToDelete({ id: e.id, title: e.title })}
                      disabled={pending}
                      className="rounded-lg px-3 py-1.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              ))}
              {exams.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-14 text-center text-muted"
                  >
                    <p className="text-2xl">📄</p>
                    <p className="mt-2 font-semibold text-ink">
                      ยังไม่มีชุดข้อสอบ
                    </p>
                    <p className="mt-1 text-sm">อัปโหลดไฟล์ HTML ด้านบนเพื่อเริ่ม</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={toDelete !== null}
        title="ลบชุดข้อสอบ?"
        body={
          <p>
            ลบชุด{" "}
            <span className="font-semibold text-ink">
              “{toDelete?.title}”
            </span>{" "}
            พร้อมเฉลยและผลสอบที่เกี่ยวข้อง — ย้อนกลับไม่ได้
          </p>
        }
        confirmLabel="ลบชุดนี้"
        cancelLabel="ยกเลิก"
        tone="danger"
        busy={pending}
        onConfirm={() => {
          const id = toDelete?.id;
          setToDelete(null);
          if (id) act(() => deleteExam(id));
        }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}

function DurationEditor({
  value,
  disabled,
  onSave,
}: {
  value: number;
  disabled: boolean;
  onSave: (mins: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  function commit() {
    const mins = Math.round(Number(draft));
    setEditing(false);
    if (Number.isFinite(mins) && mins >= 1 && mins !== value) {
      onSave(mins);
    } else {
      setDraft(String(value));
    }
  }

  if (!editing) {
    return (
      <button
        type="button"
        title="คลิกเพื่อแก้เวลา"
        disabled={disabled}
        onClick={() => {
          setDraft(String(value));
          setEditing(true);
        }}
        className="rounded-md px-1.5 font-display font-bold tabular-nums text-ink underline decoration-dotted decoration-line underline-offset-4 transition-colors hover:bg-brand-50 hover:text-brand-700 disabled:opacity-50"
      >
        {value}
      </button>
    );
  }

  return (
    <input
      autoFocus
      type="number"
      min={1}
      value={draft}
      onChange={(ev) => setDraft(ev.target.value)}
      onBlur={commit}
      onKeyDown={(ev) => {
        if (ev.key === "Enter") commit();
        else if (ev.key === "Escape") {
          setDraft(String(value));
          setEditing(false);
        }
      }}
      className="w-16 rounded-md border border-brand-300 bg-white px-1.5 py-0.5 text-center font-display font-bold tabular-nums text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
    />
  );
}
