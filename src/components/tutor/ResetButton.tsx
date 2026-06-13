"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { resetAttempt } from "@/lib/actions/tutor";

export default function ResetButton({
  examId,
  studentId,
}: {
  examId: string;
  studentId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => {
        if (!confirm("รีเซ็ตการทำข้อสอบนี้? นักเรียนจะทำใหม่ได้")) return;
        startTransition(async () => {
          await resetAttempt(examId, studentId);
          router.refresh();
        });
      }}
      className="text-xs text-red-600 hover:underline disabled:opacity-50"
    >
      รีเซ็ต
    </button>
  );
}
