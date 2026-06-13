import { getTutorOverview } from "@/lib/overview";
import SetupProgressBar from "@/components/tutor/SetupProgressBar";
import {
  MetricCard,
  ActionItems,
  ActivityFeed,
  PrimaryActions,
  CompletionCard,
  FileIcon,
  UsersIcon,
  ClockIcon,
  ChartIcon,
} from "@/components/tutor/overview/sections";

export const dynamic = "force-dynamic";

export default async function TutorDashboard() {
  const o = await getTutorOverview();
  const taskCount = o.actionItems.length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-5">
      {/* B. แถบ setup */}
      <SetupProgressBar done={o.setup.done} steps={o.setup.steps} />

      {/* C. หัวเรื่อง + สรุป dynamic */}
      <header className="mt-5">
        <h1 className="font-display text-3xl font-extrabold text-ink sm:text-4xl">
          ภาพรวมระบบ
        </h1>
        <p className="mt-2 text-muted">
          {taskCount > 0 ? (
            <>
              วันนี้มี{" "}
              <span className="font-bold text-accent-700">
                {taskCount} อย่างที่ต้องจัดการ
              </span>
            </>
          ) : (
            <span className="font-semibold text-brand-700">ไม่มีงานค้าง — เคลียร์หมดแล้ว</span>
          )}{" "}
          · อัปเดตล่าสุด เมื่อสักครู่
        </p>
      </header>

      {/* D. เมตริก 4 ใบ */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          icon={<FileIcon />}
          label="ชุดข้อสอบ"
          value={o.exams.total}
          context={`${o.exams.published} เผยแพร่ · ${o.exams.draft} ฉบับร่าง`}
        />
        <MetricCard
          icon={<UsersIcon />}
          label="นักเรียน"
          value={o.students.total}
          context={`ใช้งานสัปดาห์นี้ ${o.students.activeThisWeek} คน`}
        />
        <MetricCard
          icon={<ClockIcon />}
          label="ค้างส่ง"
          value={o.pending}
          context="มอบหมายแล้วยังไม่ทำ"
          accent
        />
        <MetricCard
          icon={<ChartIcon />}
          label="คะแนนเฉลี่ย"
          value={
            <>
              {o.avgScore.score}
              <span className="text-xl text-muted">/{o.avgScore.total}</span>
            </>
          }
          context={`จาก ${o.avgScore.count} ครั้งที่ส่ง`}
        />
      </div>

      {/* E. สองคอลัมน์ */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.7fr_1fr]">
        <div className="space-y-5">
          <ActionItems items={o.actionItems} />
          <ActivityFeed rows={o.activity} />
        </div>
        <div className="space-y-5">
          <PrimaryActions />
          <CompletionCard
            rate={o.completion.rate}
            done={o.completion.done}
            total={o.completion.total}
          />
        </div>
      </div>
    </main>
  );
}
