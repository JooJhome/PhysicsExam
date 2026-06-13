import { createClient } from "@/lib/supabase/server";
import ExamManager, { type ExamRow } from "@/components/tutor/ExamManager";

export default async function ExamsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("exams")
    .select(
      "id, title, exam_code, duration_minutes, total_questions, status, allow_review, created_at"
    )
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-lg font-bold text-gray-900">จัดการข้อสอบ</h1>
      <ExamManager exams={(data as ExamRow[]) ?? []} />
    </main>
  );
}
