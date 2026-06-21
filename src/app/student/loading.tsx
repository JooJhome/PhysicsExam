import { Skeleton } from "@/components/Skeleton";

// หน้าแรกนักเรียน (Progress-forward): แถบบน + ทักทาย + การ์ดความคืบหน้า + การ์ดเด่น + กลุ่มการ์ดชุด
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
        {/* ทักทาย */}
        <section className="space-y-4">
          <Skeleton className="h-10 w-3/4 max-w-sm" />
          <Skeleton className="h-5 w-full max-w-md" />
        </section>
        {/* การ์ดความคืบหน้า (เต็มกว้าง) */}
        <Skeleton className="mt-6 h-28 rounded-3xl" />
        {/* ต้องทำ: หัว + การ์ดเด่น + grid */}
        <section className="mt-9">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="mt-4 h-24 rounded-3xl" />
          <ul className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i}>
                <Skeleton className="h-48 rounded-[14px]" />
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
