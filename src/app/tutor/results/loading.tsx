import { Skeleton, ListSkeleton } from "@/components/Skeleton";

// header ของผลสอบมีปุ่มดาวน์โหลด CSV ฝั่งขวา + กราฟ/ตารางด้านล่าง
export default function Loading() {
  return (
    <main aria-busy className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-5">
      <span className="sr-only">กำลังโหลด…</span>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-5 w-80 max-w-[85%]" />
        </div>
        <Skeleton className="h-11 w-40" />
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <ListSkeleton rows={6} />
    </main>
  );
}
