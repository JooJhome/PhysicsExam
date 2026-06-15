// Skeleton placeholders สำหรับ loading.tsx — โชว์ทันทีตอน navigate ระหว่างรอ Server Component
// หมายเหตุ: reduced-motion ถูกปิด animation ให้ทั้งระบบแล้วใน globals.css (pulse จะนิ่งเองอัตโนมัติ)

/** บล็อกเทาเต้นจังหวะ — หน่วยพื้นฐานของทุก skeleton */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`rounded-lg bg-sand-200/70 motion-safe:animate-pulse ${className}`}
    />
  );
}

/** หัวหน้ามาตรฐานฝั่ง tutor: h1 + คำโปรย */
export function PageHeaderSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-9 w-64 max-w-[70%]" />
      <Skeleton className="h-5 w-80 max-w-[85%]" />
    </div>
  );
}

/** การ์ดเปล่ามาตรฐาน — หัว + ตัวเลข + บรรทัดรอง */
export function CardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-2xl border border-line bg-white p-5 shadow-card ${className}`}>
      <Skeleton className="h-4 w-20" />
      <Skeleton className="mt-4 h-8 w-24" />
      <Skeleton className="mt-2 h-3.5 w-full" />
    </div>
  );
}

/** แถบเครื่องมือ (ค้นหา/ปุ่ม) ด้านบน list/table */
export function ToolbarSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Skeleton className="h-11 flex-1 min-w-[200px]" />
      <Skeleton className="h-11 w-32" />
    </div>
  );
}

/** รายการแถว n แถว — ใช้กับตาราง/ลิสต์นักเรียน, ข้อสอบ, มอบหมาย ฯลฯ */
export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="mt-4 space-y-2.5">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-2xl border border-line bg-white px-4 py-4 shadow-card"
        >
          <Skeleton className="h-10 w-10 flex-none rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3.5 w-1/2" />
          </div>
          <Skeleton className="hidden h-8 w-24 sm:block" />
        </div>
      ))}
    </div>
  );
}
