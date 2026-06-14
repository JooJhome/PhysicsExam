"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * รีเฟรชข้อมูลเมื่อหน้าถูกเรียกคืนจาก bfcache (กดย้อนกลับบน Safari/iPad ฯลฯ)
 * กันสถานะค้าง เช่น ปุ่ม "เริ่มทำ" ที่ควรเป็น "ทำต่อ" หลังเริ่มทำข้อสอบไปแล้ว
 */
export default function RefreshOnShow() {
  const router = useRouter();
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) router.refresh();
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, [router]);
  return null;
}
