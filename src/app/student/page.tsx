import AppHeader from "@/components/AppHeader";
import RefreshOnShow from "@/components/RefreshOnShow";
import { getProfile } from "@/lib/profile";
import { getStudentHome } from "@/lib/studentHome";
import ProgressRing from "@/components/student/ProgressRing";
import ExamCard from "@/components/student/ExamCard";
import { Sparkle } from "@/components/Decor";

export const dynamic = "force-dynamic";

export default async function StudentHome() {
  // อิสระต่อกัน → ยิงขนาน (เลี่ยง waterfall)
  const [profile, home] = await Promise.all([getProfile(), getStudentHome()]);
  const firstName = profile.full_name || profile.username;
  const hasAny = home.todo.length + home.done.length > 0;

  return (
    <>
      <AppHeader title="BSIINK Physics" name={firstName} />
      <RefreshOnShow />
      <main className="mx-auto max-w-5xl px-4 pb-12 pt-6 sm:px-5">
        {/* ── หัว + ความคืบหน้า ── */}
        <section className="grid items-start gap-5 md:grid-cols-[1.5fr_1fr]">
          <div className="relative motion-safe:animate-rise-in">
            <Sparkle className="absolute -left-2 -top-4 h-5 w-5 text-accent-400" />
            <h1 className="font-display text-h1 font-extrabold leading-tight text-ink">
              สวัสดี {firstName} <span className="align-middle">👋</span>
            </h1>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink-soft">
              เลือกชุดที่อยากทำได้เลย · <b className="text-ink">กดเริ่มแล้วเวลาจะเดินทันที และทำได้ครั้งเดียว</b>
            </p>
          </div>

          {home.assignedCount > 0 && (
            <div className="motion-safe:animate-rise-in [animation-delay:90ms]">
              <ProgressRing
                doneCount={home.doneCount}
                assignedCount={home.assignedCount}
                percent={home.percent}
              />
            </div>
          )}
        </section>

        {!hasAny ? (
          <div className="mt-10 rounded-2xl border border-dashed border-line bg-white/60 px-6 py-16 text-center">
            <p className="text-2xl">🎒</p>
            <p className="mt-2 font-semibold text-ink">ยังไม่มีชุดข้อสอบ</p>
            <p className="mt-1 text-sm text-muted">เมื่อติวเตอร์มอบหมายชุดให้ จะปรากฏที่นี่</p>
          </div>
        ) : (
          <>
            {/* ── ต้องทำ ── */}
            {home.todo.length > 0 && (
              <Group title="ต้องทำ" count={home.todo.length}>
                {home.todo.map((e) => (
                  <ExamCard key={e.examId} exam={e} />
                ))}
              </Group>
            )}

            {/* ── ทำเสร็จแล้ว ── */}
            {home.done.length > 0 && (
              <Group title="ทำเสร็จแล้ว" count={home.done.length} muted>
                {home.done.map((e) => (
                  <ExamCard key={e.examId} exam={e} />
                ))}
              </Group>
            )}
          </>
        )}
      </main>
    </>
  );
}

function Group({
  title,
  count,
  muted = false,
  children,
}: {
  title: string;
  count: number;
  muted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-9">
      <div className="flex items-baseline gap-2">
        <h2 className={`font-display text-xl font-extrabold ${muted ? "text-muted" : "text-ink"}`}>
          {title}
        </h2>
        <span className="text-sm text-muted">· {count} ชุด</span>
      </div>
      <ul className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</ul>
    </section>
  );
}
