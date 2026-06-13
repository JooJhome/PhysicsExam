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

interface SurveyRow {
  attempt_id: string;
  difficulty: number;
  time_adequacy: number;
  confidence: number;
  stress: number;
  hardest_topics: string | null;
  comment: string | null;
}

export default async function ResultsPage() {
  const supabase = await createClient();
  const [{ data }, { data: surveyData }] = await Promise.all([
    supabase
      .from("attempts")
      .select(
        "id, status, score, total, started_at, submitted_at, exam_id, student_id, exams(title, exam_code), profiles(username, full_name)"
      )
      .order("submitted_at", { ascending: false, nullsFirst: false }),
    supabase
      .from("exam_surveys")
      .select(
        "attempt_id, difficulty, time_adequacy, confidence, stress, hardest_topics, comment"
      ),
  ]);

  const rows = (data as unknown as AttemptRow[]) ?? [];
  const surveys = new Map(
    ((surveyData as SurveyRow[] | null) ?? []).map((s) => [s.attempt_id, s])
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold text-ink sm:text-5xl">
            ผลสอบ
          </h1>
          <p className="mt-3 text-lg text-muted">
            ติดตามคะแนนแบบเรียลไทม์ · ดาวน์โหลด CSV · รีเซ็ตให้ทำใหม่ได้
          </p>
        </div>
        <a
          href="/api/results/export"
          className="rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:bg-sand-100"
        >
          ↓ ดาวน์โหลด CSV
        </a>
      </header>

      <div className="mt-8 overflow-x-auto rounded-3xl border border-line bg-white shadow-card">
        <table className="w-full min-w-[760px] text-left">
          <thead>
            <tr className="border-b border-line bg-brand-50/70 text-sm text-brand-800">
              <th className="px-5 py-4 font-semibold">นักเรียน</th>
              <th className="px-5 py-4 font-semibold">ชุด</th>
              <th className="px-5 py-4 font-semibold">สถานะ</th>
              <th className="px-5 py-4 font-semibold">คะแนน</th>
              <th className="px-5 py-4 font-semibold">ส่งเมื่อ</th>
              <th className="px-5 py-4 font-semibold">แบบสอบถาม</th>
              <th className="px-5 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.id} className="transition-colors hover:bg-canvas/70">
                <td className="px-5 py-4">
                  <span className="inline-flex items-center gap-2.5">
                    <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-brand-50 font-display text-sm font-bold uppercase text-brand-700">
                      {(r.profiles?.full_name || r.profiles?.username || "?").charAt(0)}
                    </span>
                    <span className="font-semibold text-ink">
                      {r.profiles?.full_name || r.profiles?.username}
                    </span>
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="inline-block rounded-full bg-brand-50 px-2.5 py-0.5 font-display text-xs font-bold text-brand-700">
                    {r.exams?.exam_code}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1 ${
                      r.status === "submitted"
                        ? "bg-green-50 text-green-700 ring-green-200"
                        : "bg-accent-50 text-accent-800 ring-accent-200"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        r.status === "submitted" ? "bg-green-600" : "bg-accent-500"
                      }`}
                    />
                    {r.status === "submitted" ? "ส่งแล้ว" : "กำลังทำ"}
                  </span>
                </td>
                <td className="whitespace-nowrap px-5 py-4">
                  {r.score != null ? (
                    <span className="font-display text-base font-bold tabular-nums text-ink">
                      {r.score}
                      <span className="text-muted">/{r.total}</span>
                    </span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-sm text-muted">
                  {r.submitted_at
                    ? new Date(r.submitted_at).toLocaleString("th-TH")
                    : "—"}
                </td>
                <td className="px-5 py-4 text-sm">
                  <SurveyCell survey={surveys.get(r.id)} />
                </td>
                <td className="px-5 py-4 text-right">
                  <ResetButton examId={r.exam_id} studentId={r.student_id} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-14 text-center text-muted">
                  <p className="text-2xl">📊</p>
                  <p className="mt-2 font-semibold text-ink">ยังไม่มีการทำข้อสอบ</p>
                  <p className="mt-1 text-sm">
                    เมื่อนักเรียนเริ่มทำ ผลจะปรากฏที่นี่แบบเรียลไทม์
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function SurveyCell({ survey }: { survey?: SurveyRow }) {
  if (!survey) return <span className="text-muted">—</span>;

  const metrics: [string, number][] = [
    ["ความยาก", survey.difficulty],
    ["เวลาเพียงพอ", survey.time_adequacy],
    ["ความมั่นใจ", survey.confidence],
    ["ความเครียด", survey.stress],
  ];

  return (
    <details className="group">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 font-semibold text-brand-700 transition-colors hover:text-brand-800">
        ดู
        <span className="transition-transform group-open:rotate-180">▾</span>
      </summary>
      <div className="mt-2 w-64 space-y-1.5 rounded-2xl border border-line bg-canvas p-4">
        {metrics.map(([label, val]) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-ink-soft">{label}</span>
            <span className="font-display font-bold tabular-nums text-ink">
              {val}<span className="text-muted">/5</span>
            </span>
          </div>
        ))}
        {survey.hardest_topics && (
          <p className="border-t border-line pt-2 text-ink-soft">
            <span className="text-muted">บทที่ยาก: </span>
            {survey.hardest_topics}
          </p>
        )}
        {survey.comment && (
          <p className="whitespace-pre-wrap pt-1 text-ink-soft">
            <span className="text-muted">ความเห็น: </span>
            {survey.comment}
          </p>
        )}
      </div>
    </details>
  );
}
