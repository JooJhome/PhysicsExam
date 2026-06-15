import { Skeleton } from "@/components/Skeleton";

// โหมดทำข้อสอบ (โฟกัส) — โครงคร่าว ๆ ระหว่างโหลดข้อสอบ
export default function Loading() {
  return (
    <main aria-busy className="mx-auto max-w-3xl px-4 pb-10 pt-6 sm:px-5">
      <span className="sr-only">กำลังโหลดข้อสอบ…</span>
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-10 w-24 rounded-full" />
      </div>
      <div className="mt-8 space-y-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-line bg-white p-5 shadow-card">
            <Skeleton className="h-5 w-3/4" />
            <div className="mt-4 space-y-2.5">
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton key={j} className="h-10 w-full rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
