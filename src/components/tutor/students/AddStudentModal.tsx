"use client";

import { useEffect, useRef } from "react";
import AddStudentCard from "./AddStudentCard";

export default function AddStudentModal({
  open,
  onClose,
  existingUsernames,
}: {
  open: boolean;
  onClose: () => void;
  existingUsernames: string[];
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // sync prop → <dialog>
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    el.addEventListener("cancel", onCancel);
    return () => el.removeEventListener("cancel", onCancel);
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="add-student-title"
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      className="m-0 h-dvh max-h-none w-full max-w-none bg-white p-0 text-ink backdrop:bg-ink/40 backdrop:backdrop-blur-[2px] open:animate-dialog-in sm:m-auto sm:h-auto sm:max-h-[90vh] sm:w-[calc(100vw-2rem)] sm:max-w-2xl sm:rounded-3xl sm:shadow-lift"
    >
      <div className="flex h-full flex-col">
        {/* header */}
        <div className="flex items-start justify-between gap-3 border-b border-line p-5">
          <div>
            <h2 id="add-student-title" className="font-display text-lg font-bold text-ink">
              เพิ่มนักเรียน
            </h2>
            <p className="mt-1 text-sm text-muted">
              เพิ่มทีละคน หรือวาง/อัปโหลด CSV — รหัสแสดงครั้งเดียวให้คัดลอกส่งต่อ
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="grid h-10 w-10 flex-none place-items-center rounded-lg text-muted transition-colors hover:bg-canvas hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* body (scroll) */}
        <div className="flex-1 overflow-y-auto p-5">
          <AddStudentCard existingUsernames={existingUsernames} variant="bare" />
        </div>
      </div>
    </dialog>
  );
}
