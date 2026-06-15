"use client";

/** ปุ่มสั่งพิมพ์ (→ บันทึก PDF ได้จาก dialog พิมพ์ของเบราว์เซอร์) — ซ่อนตอนพิมพ์เอง */
export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-700 print:hidden"
    >
      🖨 พิมพ์ / บันทึก PDF
    </button>
  );
}
