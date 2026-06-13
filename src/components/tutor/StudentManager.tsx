"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createStudent,
  createStudentsBulk,
  deleteStudent,
} from "@/lib/actions/tutor";

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
  const [, startTransition] = useTransition();

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

  function onDelete(id: string, username: string) {
    if (!confirm(`ลบนักเรียน ${username}? (ลบผลสอบทั้งหมดด้วย)`)) return;
    startTransition(async () => {
      const r = await deleteStudent(id);
      setMsg({ ok: r.ok, text: r.message });
      router.refresh();
    });
  }

  return (
    <div className="mt-4 space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {/* ทีละคน */}
        <form
          onSubmit={onCreate}
          className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200"
        >
          <p className="font-semibold text-gray-900">เพิ่มทีละคน</p>
          <div className="mt-3 space-y-2">
            <input
              name="username"
              placeholder="username"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              name="password"
              placeholder="password (≥ 6 ตัว)"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              name="full_name"
              placeholder="ชื่อ-สกุล (ไม่บังคับ)"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            disabled={busy}
            className="mt-3 w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            เพิ่มนักเรียน
          </button>
        </form>

        {/* CSV */}
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <p className="font-semibold text-gray-900">เพิ่มทีละหลายคน (CSV)</p>
          <p className="mt-1 text-xs text-gray-500">
            บรรทัดละคน: <code>username,password,ชื่อ-สกุล</code>
          </p>
          <textarea
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
            rows={5}
            placeholder={"som,pass1234,สมชาย ใจดี\nying,pass5678,สมหญิง รักเรียน"}
            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs"
          />
          <button
            onClick={onBulk}
            disabled={busy || !bulk.trim()}
            className="mt-2 w-full rounded-lg bg-gray-900 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-60"
          >
            สร้างจาก CSV
          </button>
        </div>
      </div>

      {msg && (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            msg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
        >
          {msg.text}
        </p>
      )}

      {/* รายชื่อ */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-2">username</th>
              <th className="px-4 py-2">ชื่อ-สกุล</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {students.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 font-mono text-gray-900">{s.username}</td>
                <td className="px-4 py-3 text-gray-600">{s.full_name}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => onDelete(s.id, s.username)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    ลบ
                  </button>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                  ยังไม่มีนักเรียน
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <p className="px-4 py-2 text-right text-xs text-gray-400">
          ทั้งหมด {students.length} คน
        </p>
      </div>
    </div>
  );
}
