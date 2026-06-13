"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createStudent,
  createStudentsBulk,
  deleteStudent,
} from "@/lib/actions/tutor";
import ConfirmDialog from "@/components/ConfirmDialog";

export interface StudentRow {
  id: string;
  username: string;
  full_name: string | null;
}

export default function StudentManager({
  students,
}: {
  students: StudentRow[];
}) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [bulk, setBulk] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, startTransition] = useTransition();
  const [toDelete, setToDelete] = useState<{ id: string; username: string } | null>(
    null
  );

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const r = await createStudent(new FormData(e.currentTarget));
    setMsg({ ok: r.ok, text: r.message });
    setBusy(false);
    if (r.ok) {
      (e.target as HTMLFormElement).reset();
      router.refresh();
    }
  }

  async function onBulk() {
    setBusy(true);
    setMsg(null);
    const r = await createStudentsBulk(bulk);
    setMsg({ ok: r.ok, text: r.message });
    setBusy(false);
    if (r.ok) setBulk("");
    router.refresh();
  }

  function confirmDelete() {
    if (!toDelete) return;
    const id = toDelete.id;
    setToDelete(null);
    startTransition(async () => {
      const r = await deleteStudent(id);
      setMsg({ ok: r.ok, text: r.message });
      router.refresh();
    });
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        {/* ทีละคน */}
        <form
          onSubmit={onCreate}
          className="rounded-3xl border border-line bg-white p-7 shadow-card"
        >
          <h2 className="font-display text-xl font-bold text-ink">เพิ่มทีละคน</h2>
          <div className="mt-5 space-y-3">
            <input
              name="username"
              placeholder="username"
              required
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="w-full rounded-xl border border-line bg-white px-4 py-3 text-base transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
            <input
              name="password"
              placeholder="password (≥ 6 ตัว)"
              required
              className="w-full rounded-xl border border-line bg-white px-4 py-3 text-base transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
            <input
              name="full_name"
              placeholder="ชื่อ-สกุล (ไม่บังคับ)"
              className="w-full rounded-xl border border-line bg-white px-4 py-3 text-base transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
          <button
            disabled={busy}
            className="mt-4 w-full rounded-xl bg-brand-600 py-3 text-base font-bold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-60"
          >
            เพิ่มนักเรียน
          </button>
        </form>

        {/* CSV */}
        <div className="rounded-3xl border border-line bg-white p-7 shadow-card">
          <h2 className="font-display text-xl font-bold text-ink">
            เพิ่มทีละหลายคน (CSV)
          </h2>
          <p className="mt-1 text-sm text-muted">
            บรรทัดละคน:{" "}
            <code className="rounded bg-sand-100 px-1.5 py-0.5 font-display text-xs text-ink-soft">
              username,password,ชื่อ-สกุล
            </code>
          </p>
          <textarea
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
            rows={4}
            placeholder={"som,pass1234,สมชาย ใจดี\nying,pass5678,สมหญิง รักเรียน"}
            className="mt-3 w-full rounded-xl border border-line bg-white px-4 py-3 font-mono text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
          <button
            onClick={onBulk}
            disabled={busy || !bulk.trim()}
            className="mt-3 w-full rounded-xl border-2 border-brand-600 py-3 text-base font-bold text-brand-700 transition-colors hover:bg-brand-50 disabled:opacity-50"
          >
            สร้างจาก CSV
          </button>
        </div>
      </div>

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

      {/* รายชื่อ */}
      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-display text-xl font-bold text-ink">รายชื่อนักเรียน</h2>
          <span className="text-sm text-muted">
            <span className="font-display font-bold tabular-nums text-ink-soft">
              {students.length}
            </span>{" "}
            คน
          </span>
        </div>
        <div className="overflow-x-auto rounded-3xl border border-line bg-white shadow-card">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr className="border-b border-line bg-brand-50/70 text-sm text-brand-800">
                <th className="px-5 py-4 font-semibold">Username</th>
                <th className="px-5 py-4 font-semibold">ชื่อ-สกุล</th>
                <th className="px-5 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {students.map((s) => (
                <tr key={s.id} className="transition-colors hover:bg-canvas/70">
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-2.5">
                      <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-brand-50 font-display text-sm font-bold uppercase text-brand-700">
                        {(s.full_name || s.username).charAt(0)}
                      </span>
                      <span className="font-display font-semibold text-ink">
                        {s.username}
                      </span>
                    </span>
                  </td>
                  <td className="px-5 py-4 text-ink-soft">
                    {s.full_name || <span className="text-muted">—</span>}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() =>
                        setToDelete({ id: s.id, username: s.username })
                      }
                      disabled={pending}
                      className="rounded-lg px-3 py-1.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-14 text-center text-muted">
                    <p className="text-2xl">👥</p>
                    <p className="mt-2 font-semibold text-ink">ยังไม่มีนักเรียน</p>
                    <p className="mt-1 text-sm">เพิ่มทีละคนหรือวาง CSV ด้านบน</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={toDelete !== null}
        title="ลบนักเรียน?"
        body={
          <p>
            ลบบัญชี{" "}
            <span className="font-semibold text-ink">{toDelete?.username}</span>{" "}
            และ<span className="font-medium text-ink">ผลสอบทั้งหมด</span>ของคนนี้
            — ย้อนกลับไม่ได้
          </p>
        }
        confirmLabel="ลบนักเรียน"
        cancelLabel="ยกเลิก"
        tone="danger"
        busy={pending}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
