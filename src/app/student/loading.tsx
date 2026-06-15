import { Skeleton } from "@/components/Skeleton";

// หน้าแรกนักเรียน (redesign): แถบบน + ทักทาย + ProgressRing + กลุ่มการ์ดชุด
export default function Loading() {
  return (
    <>
      <div className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-x-6 px-4 py-3 sm:px-5">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="ml-auto h-8 w-24" />
        </div>
      </div>
      <main aria-busy className="mx-auto max-w-5xl px-4 pb-12 pt-6 sm:px-5">
        <span className="sr-only">กำลังโหลด…</span>
        <section className="grid items-start gap-5 md:grid-cols-[1.5fr_1fr]">
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-5 w-full max-w-md" />
          </div>
          <Skeleton className="h-28 rounded-3xl" />
        </section>
        <section className="mt-9">
          <Skeleton className="h-7 w-40" />
          <ul className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i}>
                <Skeleton className="h-56 rounded-[14px]" />
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
