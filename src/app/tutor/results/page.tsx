import { createClient } from "@/lib/supabase/server";
import ResetButton from "@/components/tutor/ResetButton";

interface AttemptRow {
  id: string;
  status: string;
  score: number | null;
  total: number | null;
  started_at: string;
  submitted_at: string | null;
  exam_id: string;
  student_id: string;
  exams: { title: string; exam_code: string } | null;
  profiles: { username: string; full_name: string | null } | null;
}

export default async function ResultsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("attempts")
    .select(
      "id, status, score, total, started_at, submitted_at, exam_id, student_id, exams(title, exam_code), profiles(username, full_name)"
    )
    .order("submitted_at", { ascending: false, nullsFirst: false });

  const rows = (data as unknown as AttemptRow[]) ?? [];

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">ผลสอบ</h1>
        <a
          href="/api/results/export"
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          ดาวน์โหลด CSV
        </a>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-2">นักเรียน</th>
              <th className="px-4 py-2">ชุด</th>
              <th className="px-4 py-2">สถานะ</th>
              <th className="px-4 py-2">คะแนน</th>
              <th className="px-4 py-2">ส่งเมื่อ</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 text-gray-900">
                  {r.profiles?.full_name || r.profiles?.username}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {r.exams?.exam_code}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      r.status === "submitted"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {r.status === "submitted" ? "ส่งแล้ว" : "กำลังทำ"}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold text-gray-900">
                  {r.score != null ? `${r.score}/${r.total}` : "—"}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {r.submitted_at
                    ? new Date(r.submitted_at).toLocaleString("th-TH")
                    : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <ResetButton examId={r.exam_id} studentId={r.student_id} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                  ยังไม่มีการทำข้อสอบ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
