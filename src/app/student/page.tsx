import AppHeader from "@/components/AppHeader";
import RefreshOnShow from "@/components/RefreshOnShow";
import { getProfile } from "@/lib/profile";
import { getStudentHome } from "@/lib/studentHome";
import ProgressCard from "@/components/student/ProgressCard";
import SortableExamGroup from "@/components/student/SortableExamGroup";
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
        {/* ── หัวทักทาย ── */}
        <section className="relative motion-safe:animate-rise-in">
          <Sparkle className="absolute -left-2 -top-4 h-5 w-5 text-accent-400" />
          <h1 className="font-display text-h1 font-extrabold leading-tight text-ink">
            สวัสดี {firstName} <span className="align-middle">👋</span>
          </h1>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink-soft">
            เลือกชุดที่อยากทำได้เลย · <b className="text-ink">กดเริ่มแล้วเวลาจะเดินทันที และทำได้ครั้งเดียว</b>
          </p>
        </section>

        {/* ── ความคืบหน้า (เปิดหัวด้วยภาพรวม — Progress-forward) ── */}
        {home.assignedCount > 0 && (
          <div className="mt-6 motion-safe:animate-rise-in [animation-delay:90ms]">
            <ProgressCard
              doneCount={home.doneCount}
              assignedCount={home.assignedCount}
              percent={home.percent}
              avgPct={home.avgPct}
              passedCount={home.passedCount}
            />
          </div>
        )}

        {!hasAny ? (
          <div className="mt-10 rounded-2xl border border-dashed border-line bg-white/60 px-6 py-16 text-center">
            <p className="text-2xl">🎒</p>
            <p className="mt-2 font-semibold text-ink">ยังไม่มีชุดข้อสอบ</p>
            <p className="mt-1 text-sm text-muted">เมื่อติวเตอร์มอบหมายชุดให้ จะปรากฏที่นี่</p>
          </div>
        ) : (
          <>
            {/* ── ต้องทำ (ดึงชุดถัดไปเป็นการ์ดเด่นบนสุด) ── */}
            {home.todo.length > 0 && (
              <SortableExamGroup
                title="ต้องทำ"
                exams={home.todo}
                nextExamId={home.nextExamId}
              />
            )}

            {/* ── ทำเสร็จแล้ว ── */}
            {home.done.length > 0 && (
              <SortableExamGroup title="ทำเสร็จแล้ว" exams={home.done} muted />
            )}
          </>
        )}
      </main>
    </>
  );
}
