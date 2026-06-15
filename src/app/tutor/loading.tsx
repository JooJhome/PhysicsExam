import { Skeleton, PageHeaderSkeleton, CardSkeleton } from "@/components/Skeleton";

// โครง dashboard: เมตริก 4 ใบ + สองคอลัมน์ (ตรงกับ tutor/page.tsx)
export default function Loading() {
  return (
    <main aria-busy className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-5">
      <span className="sr-only">กำลังโหลด…</span>
      <Skeleton className="h-12 w-full rounded-2xl" />
      <div className="mt-6">
        <PageHeaderSkeleton />
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.7fr_1fr]">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </main>
  );
}
