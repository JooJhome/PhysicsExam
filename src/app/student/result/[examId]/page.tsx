import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ReviewView from "@/components/ReviewView";

interface ReviewData {
  title: string;
  score: number;
  total: number;
  submitted_at: string;
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
  const { data, error } = await supabase.rpc("get_review", {
    p_exam_id: examId,
  });

  if (error || !data) {
    // ยังไม่ส่ง → กลับไปทำ
    redirect(`/student/exam/${examId}`);
  }
  const r = data as ReviewData;
  const pct = r.total ? Math.round((r.score / r.total) * 100) : 0;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/student" className="text-sm text-blue-600 hover:underline">
        ← กลับหน้ารวม
      </Link>

      <div className="mt-3 rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-gray-200">
        <p className="text-sm text-gray-500">{r.title}</p>
        <p className="mt-2 text-4xl font-bold text-gray-900">
          {r.score}
          <span className="text-2xl text-gray-400">/{r.total}</span>
        </p>
        <p className="mt-1 text-sm font-medium text-blue-600">{pct}%</p>
        <p className="mt-2 text-xs text-gray-400">
          ส่งเมื่อ {new Date(r.submitted_at).toLocaleString("th-TH")}
        </p>
      </div>

      {r.allow_review && r.review_html ? (
        <div className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-gray-700">
            เฉลยและวิธีทำ
          </h2>
          <ReviewView
            reviewHtml={r.review_html}
            answers={r.answers ?? []}
          />
        </div>
      ) : (
        <p className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-center text-sm text-amber-800">
          ครูยังไม่เปิดให้ดูเฉลยสำหรับชุดนี้
        </p>
      )}
    </main>
  );
}
