"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ConfirmDialog from "@/components/ConfirmDialog";

/**
 * ปุ่มออกจากหน้าเฉลย — เรียก close_review เพื่อปิดการดูถาวร (ดูได้ครั้งเดียว)
 * เมื่อกดแล้วจะกลับมาดูเฉลยชุดนี้ไม่ได้อีก → ยืนยันด้วย ConfirmDialog แบรนด์
 */
export default function ReviewExitButton({
  examId,
  isPractice = false,
}: {
  examId: string;
  isPractice?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function exit() {
    setBusy(true);
    const supabase = createClient();
    // แบบฝึกหัด: ไม่ปิดการดู (ดูซ้ำได้) — ออกเฉย ๆ
    if (!isPractice) await supabase.rpc("close_review", { p_exam_id: examId });
    router.replace("/student");
  }

  // แบบฝึกหัด: ออกได้เลย ไม่ต้องยืนยัน (ไม่ใช่การกระทำที่ย้อนไม่ได้)
  if (isPractice) {
    return (
      <button
        onClick={exit}
        disabled={busy}
        className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
      >
        {busy ? "กำลังออก…" : "กลับหน้ารวม"}
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setConfirming(true)}
        disabled={busy}
        className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
      >
        {busy ? "กำลังออก…" : "ออก (ดูเฉลยได้ครั้งเดียว)"}
      </button>

      <ConfirmDialog
        open={confirming}
        title="ออกจากหน้าเฉลย?"
        body={
          <p>
            เมื่อกดออก จะ
            <span className="font-medium text-ink">
              กลับมาดูเฉลยชุดนี้ไม่ได้อีก
            </span>{" "}
            (ดูได้ครั้งเดียว)
          </p>
        }
        confirmLabel="ออก"
        cancelLabel="ดูเฉลยต่อ"
        tone="danger"
        busy={busy}
        onConfirm={exit}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
