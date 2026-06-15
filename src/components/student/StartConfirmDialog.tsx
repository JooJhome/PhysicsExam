"use client";

import ConfirmDialog from "@/components/ConfirmDialog";

/**
 * ยืนยันก่อนเริ่มทำจริง — กันกดพลาดในบริบทสอบ (เวลาเดินทันที + ทำได้ครั้งเดียว)
 * "ทำต่อ" ไม่ใช้ dialog นี้ (เข้าต่อได้เลย เวลาเดินอยู่แล้ว)
 */
export default function StartConfirmDialog({
  open,
  examName,
  durationMin,
  untimed,
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  examName: string;
  durationMin: number;
  untimed: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <ConfirmDialog
      open={open}
      title={`พร้อมเริ่ม ${examName}?`}
      body={
        <div className="space-y-2">
          <p>
            {untimed ? (
              <>ชุดนี้ <b className="text-ink">ไม่จับเวลา</b> — แต่ทำได้ <b className="text-ink">ครั้งเดียว</b></>
            ) : (
              <>
                เวลา <b className="text-ink">{durationMin} นาที</b> จะเริ่มเดิน
                <b className="text-ink">ทันที</b> และทำได้ <b className="text-ink">ครั้งเดียว</b>
              </>
            )}
          </p>
          <p className="text-hint">อย่าลืมกดส่งคำตอบเมื่อทำเสร็จ พร้อมแล้วค่อยเริ่มนะ</p>
        </div>
      }
      confirmLabel="เริ่มเลย"
      cancelLabel="ยังก่อน"
      tone="brand"
      busy={busy}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
