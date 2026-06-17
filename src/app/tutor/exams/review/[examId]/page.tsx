import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TutorReviewFrame from "@/components/tutor/exams/TutorReviewFrame";

export const dynamic = "force-dynamic";

/**
 * ดูเฉลยฉบับติวเตอร์ — render review_html พร้อมป้อนเฉลยที่ถูกต้อง (จาก exam_answer_keys)
 * ติวเตอร์ดูได้เสมอไม่ผูกกับ allow_review (เป็นการตรวจเฉลยของชุด ไม่ใช่ผลของนักเรียน)
 */
export default async function ExamReviewPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  const supabase = await createClient();
  const [{ data: exam }, { data: key }] = await Promise.all([
    supabase
      .from("exams")
      .select("title, exam_code, total_questions, duration_minutes, review_html")
      .eq("id", examId)
      .single(),
    supabase.from("exam_answer_keys").select("answers").eq("exam_id", examId).single(),
  ]);

  if (!exam) notFound();

  return (
    <div className="mx-auto flex h-[calc(100dvh-4rem)] max-w-6xl flex-col px-4 py-4 sm:px-5">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-t-2xl border border-line bg-canvas px-4 py-3 sm:px-6">
        <Link
          href="/tutor/results"
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
        <span className="ml-auto rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
          เฉลย · เฉพาะติวเตอร์
        </span>
      </header>
      {exam.review_html ? (
        <TutorReviewFrame
          reviewHtml={exam.review_html}
          answers={(key?.answers as number[] | null) ?? []}
          title={exam.title}
        />
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-b-2xl border border-t-0 border-line bg-white px-6 py-14 text-center">
          <div>
            <p className="text-2xl">📝</p>
            <p className="mt-2 font-semibold text-ink">ชุดนี้ยังไม่มีเฉลย</p>
            <p className="mt-1 text-sm text-muted">อัปโหลดไฟล์เฉลย (review) ของชุดนี้ก่อนจึงจะดูได้</p>
          </div>
        </div>
      )}
    </div>
  );
}
