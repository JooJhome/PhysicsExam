/**
 * การ์ดความคืบหน้า (แนว Progress-forward) — เปิดหัวหน้านักเรียนด้วยภาพรวม
 * สถิติแนวนอน: ทำเสร็จ · คะแนนเฉลี่ย · ผ่านเกณฑ์ + แถบความคืบหน้า
 * ยังไม่ทำชุดไหน → ไม่โชว์ 0%/0/0 แต่ทักทายให้เริ่มชุดแรก
 */
export default function ProgressCard({
  doneCount,
  assignedCount,
  percent,
  avgPct,
  passedCount,
}: {
  doneCount: number;
  assignedCount: number;
  percent: number;
  avgPct: number | null;
  passedCount: number;
}) {
  const remaining = Math.max(0, assignedCount - doneCount);
  const started = doneCount > 0;

  return (
    <div className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
      <h2 className="text-sm font-semibold text-ink-soft">ความคืบหน้าของคุณ</h2>

      {started ? (
        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:gap-8">
          <Stat value={doneCount} unit={`/ ${assignedCount}`} label="ทำเสร็จ" />
          <Stat
            value={avgPct != null ? avgPct : "—"}
            unit={avgPct != null ? "%" : ""}
            label="คะแนนเฉลี่ย"
          />
          <Stat value={passedCount} unit={`/ ${doneCount}`} label="ผ่านเกณฑ์" />

          <div className="flex-1 sm:min-w-[200px]">
            <div
              className="h-2.5 w-full overflow-hidden rounded-full bg-sand-100"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={assignedCount}
              aria-valuenow={doneCount}
              aria-label="ความคืบหน้ารวม"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-400 transition-[width] duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-muted">
              {remaining > 0 ? `เหลืออีก ${remaining} ชุด` : "ทำครบทุกชุดแล้ว 🎉"}
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <p className="text-[15px] font-medium text-ink">
            เริ่มชุดแรกเพื่อดูความคืบหน้าของคุณ
          </p>
          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-sand-100">
            <div className="h-full w-0 rounded-full bg-gradient-to-r from-brand-500 to-accent-400" />
          </div>
          <p className="mt-2 text-sm text-muted">ได้รับมอบหมาย {assignedCount} ชุด</p>
        </div>
      )}
    </div>
  );
}

function Stat({
  value,
  unit,
  label,
}: {
  value: number | string;
  unit: string;
  label: string;
}) {
  return (
    <div className="flex-none">
      <p className="font-display text-3xl font-extrabold leading-none tabular-nums text-ink">
        {value}
        {unit && <span className="ml-1 text-base font-semibold text-ink-soft">{unit}</span>}
      </p>
      <p className="mt-1.5 text-[13px] font-medium text-muted">{label}</p>
    </div>
  );
}
