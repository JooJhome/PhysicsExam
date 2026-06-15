import Link from "next/link";
import { notFound } from "next/navigation";
import { getStudentReport } from "@/lib/studentReport";
import ProgressChart from "@/components/tutor/results/ProgressChart";
import PrintButton from "@/components/tutor/PrintButton";

export const dynamic = "force-dynamic";

export default async function StudentReportPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const report = await getStudentReport(studentId);
  if (!report) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 pb-12 pt-6 sm:px-5 print:pt-0">
      {/* แถบเครื่องมือ (ซ่อนตอนพิมพ์) */}
      <div className="mb-5 flex items-center justify-between gap-3 print:hidden">
        <Link href="/tutor/results" className="text-sm font-semibold text-muted hover:text-ink">
          ← กลับผลสอบ
        </Link>
        <PrintButton />
      </div>

      <article className="rounded-2xl border border-line bg-white p-6 shadow-card print:border-0 print:shadow-none print:p-0">
        {/* หัวรายงาน */}
        <header className="flex items-start justify-between gap-4 border-b border-line pb-4">
          <div>
            <p className="font-display text-sm font-bold tracking-wide text-brand-700">BSIINK Physics</p>
            <h1 className="mt-1 font-display text-2xl font-extrabold text-ink">รายงานผลการเรียน</h1>
            <p className="mt-1 text-lg font-bold text-ink">{report.name}</p>
            <p className="text-sm text-muted">{report.username}</p>
          </div>
          <p className="text-right text-xs text-muted">ออกรายงาน<br />{report.generatedAt}</p>
        </header>

        {/* สรุป */}
        <section className="mt-5 grid grid-cols-3 gap-3">
          <Stat label="ทำแล้ว" value={`${report.examsTaken} ชุด`} />
          <Stat label="คะแนนเฉลี่ย" value={report.avgPercent != null ? `${report.avgPercent}%` : "—"} />
          <Stat label="ผ่านเกณฑ์" value={`${report.passedCount}/${report.examsTaken}`} />
        </section>

        {/* กราฟพัฒนาการ */}
        {report.trendPoints.length >= 2 && (
          <section className="mt-5">
            <ProgressChart points={report.trendPoints} />
          </section>
        )}

        {/* ตารางคะแนนรายชุด */}
        <section className="mt-5">
          <h2 className="mb-2 font-display text-base font-bold text-ink">คะแนนรายชุด</h2>
          {report.rows.length === 0 ? (
            <p className="rounded-xl bg-canvas px-4 py-6 text-center text-sm text-muted">
              ยังไม่มีชุดที่ส่งคำตอบ
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-muted">
                  <th className="py-2 font-semibold">ชุด</th>
                  <th className="py-2 font-semibold">วันที่ส่ง</th>
                  <th className="py-2 text-right font-semibold">คะแนน</th>
                  <th className="py-2 text-right font-semibold">ผล</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {report.rows.map((r, i) => (
                  <tr key={i}>
                    <td className="py-2.5">
                      <span className="font-semibold text-ink">{r.examTitle}</span>
                      <span className="ml-1.5 font-display text-xs text-muted">{r.examCode}</span>
                    </td>
                    <td className="py-2.5 text-muted">{r.dateLabel}</td>
                    <td className="py-2.5 text-right font-display font-bold tabular-nums text-ink">
                      {r.score}/{r.total}
                      <span className="ml-1 text-xs font-normal text-muted">{r.percent}%</span>
                    </td>
                    <td className="py-2.5 text-right">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                          r.passed ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                        }`}
                      >
                        {r.passed ? "ผ่าน" : "ไม่ผ่าน"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <p className="mt-6 border-t border-line pt-3 text-center text-xs text-hint">
          รายงานนี้สร้างจากระบบ BSIINK Physics
        </p>
      </article>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-canvas/40 px-4 py-3 text-center">
      <p className="font-display text-xl font-extrabold tabular-nums text-ink">{value}</p>
      <p className="mt-0.5 text-xs text-muted">{label}</p>
    </div>
  );
}
