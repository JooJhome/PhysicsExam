/**
 * การกระจายคะแนนแบบ dot plot ระดับคะแนนดิบ — 1 คอลัมน์ = 1 คะแนน, 1 จุด = 1 คน
 * เส้นเกณฑ์ผ่านผูกกับ passingScore จริง (ไม่ fix 50%) · สีไม่ใช่ตัวสื่อเดียว (มีเส้น+legend+ตำแหน่ง)
 * ปรับความสูง SVG อัตโนมัติตามกองที่สูงสุด
 */
const FAIL = "#E24B4A"; // ต่ำกว่าเกณฑ์
const PASS = "#1F6B4A"; // ผ่าน (teal-mid)
const AMBER = "#C9870C";
const AXIS = "#E7E0CC";
const LBL = "#9AA098";
const LBL2 = "#5E665E";

export default function ScoreDotPlot({
  scores,
  totalScore,
  passingScore,
}: {
  scores: number[];
  totalScore: number;
  passingScore: number;
}) {
  if (scores.length === 0) return null;

  const W = 720;
  const r = 7;
  const step = 2 * r + 4; // r*2 + gap
  const padL = 48;
  const padR = 16;
  const padT = 18;
  const padB = 46;

  // นับจำนวนคนต่อคะแนนดิบ (ปัดเข้าช่วง 0..totalScore)
  const counts = new Map<number, number>();
  for (const s of scores) {
    const v = Math.max(0, Math.min(totalScore, Math.round(s)));
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  const maxC = Math.max(1, ...counts.values());
  const H = padT + maxC * step + r + padB;
  const x0 = padL;
  const x1 = W - padR;
  const yB = H - padB;
  const yT = padT;
  const sx = (v: number) => x0 + (x1 - x0) * (v / totalScore);
  const cy = (k: number) => yB - r - (k - 1) * step; // k=1 อยู่ล่างสุด
  const tx = sx(passingScore - 0.5); // เส้นเกณฑ์อยู่ระหว่างคะแนนตก/ผ่าน

  // สรุปสำหรับ aria
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const passN = scores.filter((s) => s >= passingScore).length;
  const aria = `การกระจายคะแนน: ${scores.length} คน เฉลี่ย ${avg} จาก ${totalScore} · ผ่านเกณฑ์ (≥${passingScore}) ${passN} คน`;

  const yTicks = [];
  for (let c = 0; c <= maxC; c++) {
    const y = c === 0 ? yB : cy(c);
    yTicks.push(
      <text key={`y${c}`} x={x0 - 10} y={y + 4} fontSize="10.5" fill={LBL} textAnchor="end">
        {c}
      </text>
    );
  }
  const xTicks = [];
  for (let v = 0; v <= totalScore; v += 5) {
    xTicks.push(
      <text key={`x${v}`} x={sx(v)} y={yB + 18} fontSize="10.5" fill={LBL} textAnchor="middle">
        {v}
      </text>
    );
  }
  const dots = [];
  for (const [v, c] of counts) {
    const cxv = sx(v);
    const fail = v < passingScore;
    for (let k = 1; k <= c; k++) {
      dots.push(<circle key={`${v}-${k}`} cx={cxv} cy={cy(k)} r={r} fill={fail ? FAIL : PASS} />);
    }
  }
  const ymid = (yT + yB) / 2;

  return (
    <figure className="mt-4">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full"
        role="img"
        aria-label={aria}
        style={{ fontFamily: "inherit" }}
      >
        {/* แกน */}
        <line x1={x0} y1={yT} x2={x0} y2={yB} stroke={AXIS} strokeWidth="1.5" />
        <line x1={x0} y1={yB} x2={x1} y2={yB} stroke={AXIS} strokeWidth="1.5" />
        {yTicks}
        {xTicks}
        {/* ชื่อแกน */}
        <text x={(x0 + x1) / 2} y={H - 6} fontSize="11" fill={LBL2} textAnchor="middle">
          คะแนนดิบ (เต็ม {totalScore})
        </text>
        <text
          x={14}
          y={ymid}
          fontSize="11"
          fill={LBL2}
          textAnchor="middle"
          transform={`rotate(-90 14 ${ymid})`}
        >
          นักเรียน (คน)
        </text>
        {/* เส้นเกณฑ์ผ่าน */}
        <line x1={tx} y1={yT - 2} x2={tx} y2={yB} stroke={AMBER} strokeWidth="2" strokeDasharray="5 4" />
        <text x={tx} y={yT - 5} fontSize="10.5" fill={AMBER} textAnchor="middle">
          ผ่าน ≥{passingScore}
        </text>
        {dots}
      </svg>
      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: PASS }} />ผ่านเกณฑ์
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: FAIL }} />ต่ำกว่าเกณฑ์
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-3 rounded-[2px]" style={{ background: AMBER }} />
          เกณฑ์ผ่าน {passingScore}/{totalScore}
        </span>
      </div>
    </figure>
  );
}
