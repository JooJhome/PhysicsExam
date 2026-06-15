import { Skeleton } from "@/components/Skeleton";

// หน้าเฉลย/ผลสอบ: แถบบน + การ์ดคะแนน + เนื้อเฉลย
export default function Loading() {
  return (
    <>
      <div className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-x-6 px-4 py-3 sm:px-5">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="ml-auto h-8 w-24" />
        </div>
      </div>
      <main aria-busy className="mx-auto max-w-3xl px-4 pb-10 pt-6 sm:px-5">
        <span className="sr-only">กำลังโหลด…</span>
        <Skeleton className="h-40 rounded-3xl" />
        <div className="mt-8 space-y-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      </main>
    </>
  );
}
