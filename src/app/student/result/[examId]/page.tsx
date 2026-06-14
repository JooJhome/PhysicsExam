import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ReviewView from "@/components/ReviewView";
import ReviewExitButton from "@/components/ReviewExitButton";
import AppHeader from "@/components/AppHeader";
import { getProfile } from "@/lib/profile";
import { Sparkle, ChalkDoodles } from "@/components/Decor";

interface Review {
  title: string;
  score: number | null;
  total: number | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  allow_review: boolean;
  answers: number[] | null;
  review_html: string | null;
}

export default async function ResultPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  const supabase = await createClient();

  // คำขอเหล่านี้อิสระต่อกัน → ยิงขนาน (เลี่ยง request waterfall)
  const [profile, reviewRes, surveyRes, examRes] = await Promise.all([
    getProfile(),
    supabase.rpc("get_review", { p_exam_id: examId }),
    supabase.rpc("has_survey", { p_exam_id: examId }),
    supabase.from("exams").select("kind").eq("id", examId).single(),
  ]);

  const { data, error } = reviewRes;
  const isPractice = examRes.data?.kind === "practice";

  // ยังไม่ส่ง → กลับไปทำต่อ ; error อื่น → กลับหน้าหลัก
  if (error) {
    if (error.message.includes("not_submitted")) redirect(`/student/exam/${examId}`);
    redirect("/student");
  }
  const review = data as Review;

  // ข้อสอบจริง: ต้องตอบแบบสอบถามก่อนจึงดูเฉลยได้ (แบบฝึกหัดข้าม)
  if (!isPractice && !surveyRes.data) redirect(`/student/exam/${examId}`);

  // ข้อสอบจริง: ดูเฉลยได้ครั้งเดียว (แบบฝึกหัดดูได้ไม่จำกัด + ทำใหม่ได้)
  if (!isPractice && review.reviewed_at) redirect("/student");

  return (
    <>
      <AppHeader
        title="BSIINK Physics"
        name={profile.full_name || profile.username}
      />
      <main className="mx-auto max-w-4xl px-4 pb-10 pt-6 sm:px-5">
        {/* ── การ์ดคะแนน (ช่วงพีคของ flow) ── */}
        <section className="relative overflow-hidden rounded-3xl bg-brand-600 p-7 text-white sm:p-8">
          <ChalkDoodles className="absolute -right-4 -top-4 h-48 w-48 text-white/15" />
          <Sparkle className="absolute right-8 top-8 h-6 w-6 text-accent-300" />
          <p className="relative text-sm font-medium text-white/80">
            ผลคะแนน · {review.title}
          </p>
          <div className="relative mt-3 flex items-end gap-3">
            <span className="font-display text-hero font-extrabold leading-none tabular-nums">
              {review.score}
            </span>
            <span className="mb-1 font-display text-h2 font-bold text-white/60">
              / {review.total}
            </span>
            <span className="mb-2.5 ml-1 text-sm font-medium text-white/70">
              คะแนน
            </span>
          </div>
          {review.total ? (
            <p className="relative mt-2 text-sm text-white/75">
              ทำถูก{" "}
              <span className="font-semibold text-white">
                {Math.round(((review.score ?? 0) / review.total) * 100)}%
              </span>{" "}
              ของข้อสอบ — เยี่ยมมาก ลองดูเฉลยเพื่อเก็บจุดที่พลาดกัน
            </p>
          ) : null}
        </section>

        {isPractice ? (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800 ring-1 ring-brand-200">
            <span aria-hidden>🔁</span>
            <p>
              <b>แบบฝึกหัด</b> — ดูเฉลยได้ไม่จำกัด และกลับมาทำใหม่ได้ทุกเมื่อ
            </p>
          </div>
        ) : (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-accent-50 px-4 py-3 text-sm text-accent-900 ring-1 ring-accent-200">
            <span aria-hidden>⚠️</span>
            <p>
              หน้านี้ดูได้ <b>ครั้งเดียว</b> — เมื่อกด “ออก”
              จะกลับมาดูเฉลยชุดนี้ไม่ได้อีก
            </p>
          </div>
        )}

        {review.allow_review && review.review_html ? (
          <div className="mt-4">
            <ReviewView
              reviewHtml={review.review_html}
              answers={review.answers ?? []}
            />
          </div>
        ) : (
          <p className="mt-4 rounded-2xl border border-line bg-white px-4 py-10 text-center text-sm text-muted">
            ติวเตอร์ไม่ได้เปิดให้ดูเฉลยของชุดนี้
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          {isPractice && (
            <a
              href={`/student/exam/${examId}`}
              className="rounded-lg border border-brand-200 px-5 py-2 text-sm font-bold text-brand-700 transition-colors hover:bg-brand-50"
            >
              ทำใหม่อีกครั้ง
            </a>
          )}
          <ReviewExitButton examId={examId} isPractice={isPractice} />
        </div>
      </main>
    </>
  );
}
