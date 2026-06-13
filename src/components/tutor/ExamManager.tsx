"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createExam,
  setExamStatus,
  setAllowReview,
  deleteExam,
} from "@/lib/actions/tutor";

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
  const [, startTransition] = useTransition();

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
    <div className="mt-4 space-y-6">
      {/* อัปโหลด */}
      <form
        onSubmit={onUpload}
        className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200"
      >
        <p className="font-semibold text-gray-900">อัปโหลดข้อสอบ (HTML)</p>
        <p className="mt-1 text-xs text-gray-500">
          ระบบจะถอดเฉลย ลบปุ่มเฉลย/แอนิเมชันออกจากฉบับสอบให้อัตโนมัติ
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <input
            name="exam_code"
            placeholder="รหัสชุด เช่น CU-ATS_Aug2027"
            required
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm sm:col-span-2"
          />
          <input
            name="duration_minutes"
            type="number"
            defaultValue={180}
            min={1}
            placeholder="นาที"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="mt-3 flex items-center gap-3">
          <input
            name="file"
            type="file"
            accept=".html,text/html"
            required
            className="text-sm"
          />
          <button
            disabled={uploading}
            className="ml-auto rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {uploading ? "กำลังประมวลผล..." : "อัปโหลด"}
          </button>
        </div>
      </form>

      {msg && (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            msg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
        >
          {msg.text}
        </p>
      )}

      {/* รายการ */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-2">ชุด</th>
              <th className="px-4 py-2">ข้อ/เวลา</th>
              <th className="px-4 py-2">สถานะ</th>
              <th className="px-4 py-2">เฉลย</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {exams.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{e.title}</p>
                  <p className="text-xs text-gray-400">{e.exam_code}</p>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {e.total_questions} ข้อ · {e.duration_minutes} น.
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() =>
                      act(() =>
                        setExamStatus(
                          e.id,
                          e.status === "published" ? "draft" : "published"
                        )
                      )
                    }
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      e.status === "published"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {e.status === "published" ? "เผยแพร่แล้ว" : "ร่าง"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <label className="inline-flex cursor-pointer items-center gap-1 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={e.allow_review}
                      onChange={(ev) =>
                        act(() => setAllowReview(e.id, ev.target.checked))
                      }
                    />
                    ให้ดูเฉลย
                  </label>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => {
                      if (confirm(`ลบชุด "${e.title}"?`))
                        act(() => deleteExam(e.id));
                    }}
                    className="text-xs text-red-600 hover:underline"
                  >
                    ลบ
                  </button>
                </td>
              </tr>
            ))}
            {exams.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  ยังไม่มีข้อสอบ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
