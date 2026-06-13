/**
 * Decor — ลูกเล่นวาดมือแบบ EduLearn (SVG ล้วน, ไม่มี state)
 * ใช้ currentColor เป็นค่าเริ่มต้น เพื่อคุมสีผ่าน text-* ของ Tailwind ได้
 * ทุกชิ้น aria-hidden — เป็นการตกแต่งล้วน
 *
 * หมายเหตุดีไซน์: ห้ามใช้บนหน้าทำข้อสอบ (โหมดสงบ) — ใช้เฉพาะหน้า low-stakes
 */

type P = { className?: string };

/** เส้นใต้วาดมือ — วางใต้คำสำคัญในหัวข้อ */
export function Underline({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 120 12" fill="none" aria-hidden>
      <path
        d="M3 8C28 3 92 3 117 6"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** เส้นหยึกหยัก — ตัวคั่น/ลูกเล่นเล็ก */
export function Squiggle({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 110 20" fill="none" aria-hidden>
      <path
        d="M2 14C12 4 22 4 32 12S52 20 62 10 82 2 92 9s14 8 16 5"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** ดาวประกายสี่แฉก */
export function Sparkle({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 1.5c.6 5 .9 5.3 5.9 5.9-5 .6-5.3.9-5.9 5.9-.6-5-.9-5.3-5.9-5.9 5-.6 5.3-.9 5.9-5.9Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** ลูกศรเฉียงขึ้นขวา (สำหรับลิงก์/การ์ด) */
export function ArrowUpRight({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 17 17 7M9 7h8v8"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** doodle สไตล์ชอล์ก สำหรับวางบนพื้นเทียลเข้ม (ใช้ currentColor = สีขาวจางๆ) */
export function ChalkDoodles({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" aria-hidden>
      <circle cx="162" cy="38" r="16" stroke="currentColor" strokeWidth="2" />
      <path
        d="M18 152c20-15 42-15 62 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M150 150l8-8M158 150l-8-8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M28 40h28M42 26v28"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** โลโก้ wordmark — B ในกล่องเทียล + ชื่อ + จุดอำพัน. onDark = ใช้บนพื้นเข้ม */
export function Wordmark({
  className,
  onDark = false,
}: P & { onDark?: boolean }) {
  return (
    <span className={`flex items-center gap-2.5 ${className ?? ""}`}>
      <span
        className={`grid h-9 w-9 place-items-center rounded-xl font-display text-lg font-extrabold ${
          onDark ? "bg-white/15 text-white" : "bg-brand-600 text-white"
        }`}
      >
        B
      </span>
      <span
        className={`font-display text-lg font-extrabold tracking-tight ${
          onDark ? "text-white" : "text-ink"
        }`}
      >
        BSIINK<span className="text-accent-400">.</span>
      </span>
    </span>
  );
}
