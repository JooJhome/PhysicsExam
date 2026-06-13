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
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-5">
      <header>
        <h1 className="font-display text-4xl font-extrabold text-ink sm:text-5xl">
          จัดการข้อสอบ
        </h1>
        <p className="mt-3 text-lg text-muted">
          อัปโหลดชุดข้อสอบ เผยแพร่ และกำหนดสิทธิ์ดูเฉลย
        </p>
      </header>
      <ExamManager exams={(data as ExamRow[]) ?? []} />
    </main>
  );
}
