import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

interface StudentExam {
  exam_id: string;
  title: string;
  exam_code: string;
  description: string | null;
  duration_minutes: number;
  total_questions: number;
  score: number | null;
  total: number | null;
  submitted_at: string | null;
  attempt_status: string | null;
}

export default async function StudentHome() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_student_exams");
  const exams = (data as StudentExam[] | null) ?? [];

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-lg font-bold text-gray-900">ชุดข้อสอบของฉัน</h1>
      <p className="mt-1 text-sm text-gray-500">
        แต่ละชุดทำได้ครั้งเดียวเท่านั้น
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          โหลดข้อมูลไม่สำเร็จ: {error.message}
        </p>
      )}

      {exams.length === 0 && !error && (
        <p className="mt-6 rounded-lg bg-white px-4 py-6 text-center text-sm text-gray-500 ring-1 ring-gray-200">
          ยังไม่มีชุดข้อสอบที่ถูกมอบหมาย
        </p>
      )}

      <ul className="mt-6 space-y-3">
        {exams.map((e) => {
          const done = e.attempt_status === "submitted";
          return (
            <li
              key={e.exam_id}
              className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900">{e.title}</p>
                <p className="text-sm text-gray-500">
                  {e.total_questions} ข้อ · {e.duration_minutes} นาที
                </p>
              </div>

              {done ? (
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-700">
                    {e.score}/{e.total} คะแนน
                  </span>
                  <Link
                    href={`/student/result/${e.exam_id}`}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    ดูผล
                  </Link>
                </div>
              ) : e.attempt_status === "in_progress" ? (
                <Link
                  href={`/student/exam/${e.exam_id}`}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
                >
                  ทำต่อ
                </Link>
              ) : (
                <Link
                  href={`/student/exam/${e.exam_id}`}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  เริ่มทำ
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
