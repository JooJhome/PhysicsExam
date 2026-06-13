"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resetAttempt } from "@/lib/actions/tutor";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function ResetButton({
  examId,
  studentId,
}: {
  examId: string;
  studentId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <button
        disabled={pending}
        onClick={() => setConfirming(true)}
        className="text-xs font-medium text-red-600 transition-colors hover:text-red-700 hover:underline disabled:opacity-50"
      >
        รีเซ็ต
      </button>

      <ConfirmDialog
        open={confirming}
        title="รีเซ็ตการทำข้อสอบ?"
        body="นักเรียนจะสามารถทำชุดนี้ใหม่ได้อีกครั้ง (ผลเดิมจะถูกลบ)"
        confirmLabel="รีเซ็ต"
        cancelLabel="ยกเลิก"
        tone="danger"
        busy={pending}
        onConfirm={() => {
          setConfirming(false);
          startTransition(async () => {
            await resetAttempt(examId, studentId);
            router.refresh();
          });
        }}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
