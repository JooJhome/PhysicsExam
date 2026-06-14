import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * ดูตัวอย่างฉบับนักเรียน (ติวเตอร์เท่านั้น) — render exam_html ที่ถอดเฉลยแล้ว
 * ใน iframe sandbox ไม่มีการบันทึก attempt ใด ๆ (เป็นแค่ตัวอย่าง)
 */
export default async function ExamPreviewPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  const supabase = await createClient();
  const { data: exam } = await supabase
    .from("exams")
    .select("title, exam_code, total_questions, duration_minutes, exam_html")
    .eq("id", examId)
    .single();

  if (!exam) notFound();

  return (
    <div className="mx-auto flex h-[calc(100dvh-4rem)] max-w-6xl flex-col px-4 py-4 sm:px-5">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-t-2xl border border-line bg-canvas px-4 py-3 sm:px-6">
        <Link
          href="/tutor/exams"
          className="rounded-lg px-2 py-1.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
        >
          ← กลับ
        </Link>
        <div className="min-w-0">
          <p className="truncate font-display font-bold text-ink">{exam.title}</p>
          <p className="truncate text-xs text-muted">
            {exam.exam_code} · {exam.total_questions} ข้อ · {exam.duration_minutes} นาที
          </p>
        </div>
        <span className="ml-auto rounded-full bg-accent-50 px-3 py-1 text-xs font-bold text-accent-700">
          ตัวอย่าง · ไม่บันทึกผล
        </span>
      </header>
      <iframe
        title={`ตัวอย่างข้อสอบ ${exam.title}`}
        srcDoc={exam.exam_html}
        sandbox="allow-scripts"
        className="min-h-0 w-full flex-1 rounded-b-2xl border border-t-0 border-line bg-white"
      />
    </div>
  );
}
