/**
 * ลายน้ำชื่อนักเรียนทับเนื้อหา (กันแคป/ไฟล์หลุด) — ใช้ทั้งตอนทำข้อสอบและตอนดูเฉลย
 * วางใน container ที่เป็น relative แล้วลายน้ำจะคลุมเต็มพื้นที่ (absolute inset-0)
 */
export default function Watermark({ name }: { name: string }) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='180'><text x='0' y='100' transform='rotate(-28 160 90)' font-family='sans-serif' font-size='20' fill='%23000'>${name}</text></svg>`;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-[0.07]"
      style={{
        backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`,
        backgroundRepeat: "repeat",
      }}
    />
  );
}
