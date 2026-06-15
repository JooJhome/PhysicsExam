import { ChalkDoodles } from "@/components/Decor";

/**
 * การ์ดความคืบหน้า — ฐานเดียวกับจำนวนชุดสอบที่ได้รับ ("ทำเสร็จ {done}/{assigned}")
 * ring เป็น SVG ล้วน (ไม่พึ่ง dependency) + มีตัวเลข % กำกับ (a11y: ไม่พึ่งสีอย่างเดียว)
 */
export default function ProgressRing({
  doneCount,
  assignedCount,
  percent,
}: {
  doneCount: number;
  assignedCount: number;
  percent: number;
}) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const dash = (percent / 100) * circ;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-brand-600 p-5 text-white shadow-card sm:p-6">
      <ChalkDoodles className="absolute inset-0 h-full w-full text-white/10" />
      <div className="relative flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white/80">ทำเสร็จแล้ว</p>
          <p className="mt-1 flex items-end gap-1.5">
            <span className="font-display text-4xl font-extrabold tabular-nums leading-none">
              {doneCount}
            </span>
            <span className="mb-0.5 text-base font-semibold text-white/70">
              /{assignedCount} ที่ได้รับ
            </span>
          </p>
        </div>
        <div className="relative grid flex-none place-items-center" aria-hidden="true">
          <svg width="68" height="68" viewBox="0 0 68 68" className="-rotate-90">
            <circle cx="34" cy="34" r={r} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="7" />
            <circle
              cx="34"
              cy="34"
              r={r}
              fill="none"
              stroke="#E89C1C"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circ}`}
              className="transition-[stroke-dasharray] duration-700"
            />
          </svg>
          <span className="absolute font-display text-sm font-extrabold tabular-nums">
            {percent}%
          </span>
        </div>
      </div>
    </div>
  );
}
