"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ConfirmDialog from "@/components/ConfirmDialog";

/**
 * ปุ่มออกจากหน้าเฉลย — เรียก close_review เพื่อปิดการดูถาวร (ดูได้ครั้งเดียว)
 * เมื่อกดแล้วจะกลับมาดูเฉลยชุดนี้ไม่ได้อีก → ยืนยันด้วย ConfirmDialog แบรนด์
 */
export default function ReviewExitButton({ examId }: { examId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function exit() {
    setBusy(true);
    const supabase = createClient();
    await supabase.rpc("close_review", { p_exam_id: examId });
    router.replace("/student");
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
