/** กราฟพัฒนาการ % ตามเวลา (SVG ล้วน) — จุดเขียว=ผ่าน แดง=ไม่ผ่าน + เส้นอ้างอิง 50% */
export default function ProgressChart({
  points,
}: {
  points: { pct: number; passed: boolean | null; code: string }[];
}) {
  const W = 320;
  const H = 120;
  const padX = 12;
  const top = 10;
  const bottom = 22;
  const n = points.length;
  const x = (i: number) => padX + (i / (n - 1)) * (W - 2 * padX);
  const y = (pct: number) => top + (1 - pct / 100) * (H - top - bottom);
  const line = points.map((p, i) => `${x(i)},${y(p.pct)}`).join(" ");
  const first = points[0].pct;
  const last = points[n - 1].pct;
  const delta = last - first;

  return (
    <div className="rounded-2xl border border-line bg-canvas/40 p-4">
      <div className="mb-2 flex items-baseline justify-between">
        <p className="text-sm font-semibold text-ink">พัฒนาการตามเวลา</p>
        <p className="text-xs font-semibold">
          <span className="text-muted">ครั้งแรก {first}% → ล่าสุด {last}% · </span>
          <span className={delta > 0 ? "text-green-700" : delta < 0 ? "text-red-600" : "text-muted"}>
            {delta > 0 ? `ดีขึ้น +${delta}` : delta < 0 ? `ลดลง ${delta}` : "คงที่"}
          </span>
        </p>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`กราฟคะแนน ${n} ชุด`}>
        <line x1={padX} y1={y(50)} x2={W - padX} y2={y(50)} stroke="#E7E0CE" strokeWidth="1" strokeDasharray="4 4" />
        <text x={padX} y={y(50) - 3} className="fill-hint" fontSize="9">50%</text>
        <polyline points={line} fill="none" stroke="#16695b" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.pct)} r="3.5" fill={p.passed ? "#1f7a69" : "#B3261E"} stroke="#fff" strokeWidth="1.5" />
        ))}
      </svg>
    </div>
  );
}
