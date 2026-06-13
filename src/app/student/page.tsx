import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/components/AppHeader";
import { getProfile } from "@/lib/profile";
import {
  Underline,
  Sparkle,
  Squiggle,
  ChalkDoodles,
  ArrowUpRight,
} from "@/components/Decor";

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
  reviewed_at: string | null;
}

export default async function StudentHome() {
  const supabase = await createClient();
  // อิสระต่อกัน → ยิงขนาน (เลี่ยง waterfall)
  const [profile, { data, error }] = await Promise.all([
    getProfile(),
    supabase.rpc("list_student_exams"),
  ]);
  const all = (data as StudentExam[] | null) ?? [];
  // ซ่อนชุดที่ "ส่งแล้ว + กดออกจากเฉลยแล้ว" (ดูซ้ำไม่ได้)
  // ชุดที่ส่งแล้วแต่ยังไม่กดออก → ยังเหลือสิทธิ์ดูเฉลยครั้งเดียว
  const exams = all.filter(
    (e) => !(e.attempt_status === "submitted" && e.reviewed_at)
  );
  // สถิติคืบหน้า (มาจากข้อมูลเดิม ไม่ใช่ฟีเจอร์ใหม่)
  const doneCount = all.filter((e) => e.attempt_status === "submitted").length;
  const totalCount = all.length;
  const pct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <>
      <AppHeader
        title="BSIINK Physics"
        name={profile.full_name || profile.username}
      />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-5">
        {/* ── Hero ── */}
        <section className="grid items-center gap-6 md:grid-cols-[1.4fr_1fr]">
          <div className="relative">
            <Sparkle className="absolute -left-2 -top-5 h-6 w-6 text-accent-400" />
            <h1 className="font-display text-3xl font-extrabold leading-[1.12] text-ink sm:text-4xl">
              ชุดข้อสอบ{" "}
              <span className="relative inline-block">
                ของคุณ
                <Underline className="absolute -bottom-2 left-0 w-full text-accent-400" />
              </span>
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink-soft">
              แต่ละชุดทำได้ครั้งเดียวเท่านั้น เลือกชุดที่ต้องการแล้วกดเริ่มทำได้เลย
              ระบบจะจับเวลาและบันทึกคำตอบให้อัตโนมัติ
            </p>
            <Squiggle className="mt-5 h-5 w-28 text-brand-300" />
          </div>

          {totalCount > 0 && (
            <div className="relative overflow-hidden rounded-3xl bg-brand-600 p-6 text-white">
              <ChalkDoodles className="absolute inset-0 h-full w-full text-white/15" />
              <p className="relative text-sm font-medium text-white/80">
                ความคืบหน้าของคุณ
              </p>
              <div className="relative mt-2 flex items-end gap-2">
                <span className="font-display text-5xl font-extrabold tabular-nums">
                  {doneCount}
                </span>
                <span className="mb-1.5 text-lg font-semibold text-white/70">
                  / {totalCount} ชุด
                </span>
              </div>
              <p className="relative mt-1 text-sm text-white/70">ส่งคำตอบแล้ว</p>
              <div className="relative mt-4 h-2 w-full overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-accent-400 transition-[width] duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}
        </section>

        {error && (
          <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-100">
            โหลดข้อมูลไม่สำเร็จ: {error.message}
          </p>
        )}

        {/* ── รายการชุด ── */}
        <section className="mt-10">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-xl font-extrabold text-ink">
              ชุดที่ได้รับมอบหมาย
            </h2>
            {exams.length > 0 && (
              <span className="text-sm text-muted">ทั้งหมด {exams.length} ชุด</span>
            )}
          </div>

          {exams.length === 0 && !error ? (
            <div className="mt-5 rounded-2xl border border-dashed border-line bg-white/60 px-6 py-14 text-center">
              <p className="text-2xl">🎒</p>
              <p className="mt-2 font-semibold text-ink">ยังไม่มีชุดข้อสอบ</p>
              <p className="mt-1 text-sm text-muted">
                เมื่อติวเตอร์มอบหมายชุดให้ จะปรากฏที่นี่
              </p>
            </div>
          ) : (
            <ul className="mt-5 grid gap-4 sm:grid-cols-2">
              {exams.map((e) => (
                <li
                  key={e.exam_id}
                  className="group flex flex-col rounded-3xl border border-line bg-white p-5 shadow-card transition-transform hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-full bg-brand-50 px-3 py-1 font-display text-xs font-bold tracking-wide text-brand-700">
                      {e.exam_code}
                    </span>
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-sand-100 text-ink transition-colors group-hover:bg-brand-600 group-hover:text-white">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>

                  <p className="mt-4 text-lg font-bold leading-snug text-ink">
                    {e.title}
                  </p>
                  <p className="mt-1 text-sm text-ink-soft">
                    <span className="font-display font-semibold tabular-nums">
                      {e.total_questions}
                    </span>{" "}
                    ข้อ ·{" "}
                    <span className="font-display font-semibold tabular-nums">
                      {e.duration_minutes}
                    </span>{" "}
                    นาที
                  </p>

                  <div className="mt-5 flex items-center justify-between gap-3">
                    {e.attempt_status === "submitted" ? (
                      <>
                        {e.score != null && (
                          <span className="inline-flex items-baseline gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-green-700 ring-1 ring-green-200">
                            <span className="font-display text-base font-extrabold tabular-nums">
                              {e.score}/{e.total}
                            </span>
                            <span className="text-xs font-semibold">คะแนน</span>
                          </span>
                        )}
                        <Link
                          href={`/student/result/${e.exam_id}`}
                          className="text-sm font-bold text-brand-700 hover:text-brand-800"
                        >
                          ดูเฉลย →
                        </Link>
                      </>
                    ) : e.attempt_status === "in_progress" ? (
                      <Link
                        href={`/student/exam/${e.exam_id}`}
                        className="w-full rounded-xl border-2 border-brand-600 py-2.5 text-center text-sm font-bold text-brand-700 transition-colors hover:bg-brand-50"
                      >
                        ทำต่อ
                      </Link>
                    ) : (
                      <Link
                        href={`/student/exam/${e.exam_id}`}
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-accent-400 py-2.5 text-sm font-bold text-ink shadow-sm transition-colors hover:bg-accent-500"
                      >
                        เริ่มทำ
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
