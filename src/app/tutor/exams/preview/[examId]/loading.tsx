import { Skeleton } from "@/components/Skeleton";

// พรีวิวชุดข้อสอบฝั่งติวเตอร์
export default function Loading() {
  return (
    <main aria-busy className="mx-auto max-w-3xl px-4 pb-10 pt-6 sm:px-5">
      <span className="sr-only">กำลังโหลด…</span>
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-10 w-24 rounded-full" />
      </div>
      <div className="mt-8 space-y-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    </main>
  );
}
