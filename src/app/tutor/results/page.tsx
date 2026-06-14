import { getResults } from "@/lib/results";
import ResultsView from "@/components/tutor/results/ResultsView";

export const dynamic = "force-dynamic";

export default async function ResultsPage() {
  const data = await getResults();

  return (
    <main className="mx-auto max-w-6xl px-4 pb-10 pt-6 sm:px-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-h1 font-extrabold text-ink">ผลสอบ</h1>
          <p className="mt-2 text-muted sm:text-lg">
            ติดตามคะแนนเรียลไทม์ · วิเคราะห์รายข้อ · ดาวน์โหลด CSV
          </p>
        </div>
        <a
          href="/api/results/export"
          className="rounded-xl border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:bg-sand-100"
        >
          ↓ ดาวน์โหลด CSV
        </a>
      </header>
      <ResultsView data={data} />
    </main>
  );
}
