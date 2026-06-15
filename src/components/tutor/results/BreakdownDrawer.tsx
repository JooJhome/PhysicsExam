"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getExamBreakdown, updateAnswerKey, type ExamBreakdown } from "@/lib/actions/tutor";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function BreakdownDrawer({
  examId,
  examCode,
  onClose,
}: {
  examId: string;
  examCode: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [data, setData] = useState<ExamBreakdown | null>(null);
  // เฉลยที่แก้ (คีย์ = เลขข้อ 1-based) — null = ยังไม่ได้ตั้ง
  const [edit, setEdit] = useState<Record<number, number | null>>({});
  const [orig, setOrig] = useState<Record<number, number | null>>({});
  const [confirm, setConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getExamBreakdown(examId).then((d) => {
      if (!alive) return;
      setData(d);
      const k: Record<number, number | null> = {};
      for (const it of d.items) k[it.n] = it.key;
      setEdit(k);
      setOrig({ ...k });
    });
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      alive = false;
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [examId, onClose]);

  const changedCount = useMemo(
    () => Object.keys(edit).filter((n) => edit[+n] !== orig[+n]).length,
    [edit, orig]
  );

  function doSave() {
    if (!data) return;
    // ประกอบ array เฉลยตามลำดับข้อ 1..N
    const maxN = Math.max(...data.items.map((it) => it.n));
    const answers: number[] = [];
    for (let n = 1; n <= maxN; n++) answers.push(edit[n] ?? 0);
    setSaving(true);
    updateAnswerKey(examId, answers).then((r) => {
      setSaving(false);
      setConfirm(false);
      setMsg(r.message);
      if (r.ok) {
        setOrig({ ...edit });
        router.refresh();
        // โหลด breakdown ใหม่ให้ % อัปเดตตามเฉลยใหม่
        getExamBreakdown(examId).then((d) => setData(d));
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-ink/40 animate-fade-in" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`วิเคราะห์รายข้อ ${examCode}`}
        className="absolute inset-x-0 bottom-0 flex max-h-[92vh] flex-col rounded-t-3xl bg-white shadow-lift animate-dialog-in sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:w-[56%] sm:max-w-xl sm:rounded-none"
      >
        <div className="flex items-center gap-3 border-b border-line px-5 py-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-bold text-ink">วิเคราะห์รายข้อ · แก้เฉลย</h2>
            <p className="text-sm text-muted">
              {examCode}
              {data && <> · จากผู้ส่ง {data.submitted} คน · เรียงข้อยากสุดก่อน</>}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="grid h-9 w-9 flex-none place-items-center rounded-lg text-muted transition-colors hover:bg-canvas hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          {!data ? (
            <p className="py-10 text-center text-sm text-muted">กำลังวิเคราะห์…</p>
          ) : (
            <>
              <p className="mb-3 rounded-xl bg-sand-100 px-3 py-2 text-xs text-ink-soft">
                ถ้าเฉลยข้อไหนผิด แตะตัวเลือกที่ถูกต้องเพื่อแก้ แล้วกด “บันทึก + คิดคะแนนใหม่” ด้านล่าง —
                ระบบจะคิดคะแนนของคนที่ส่งแล้วใหม่ทั้งหมด
              </p>
              <ul className="space-y-2.5">
                {data.items.map((it) => {
                  const tone =
                    it.pctCorrect >= 70 ? "bg-green-500" : it.pctCorrect >= 40 ? "bg-accent-400" : "bg-red-500";
                  const cur = edit[it.n];
                  const changed = cur !== orig[it.n];
                  return (
                    <li
                      key={it.n}
                      className={`rounded-xl border p-3 ${changed ? "border-accent-300 bg-accent-50/40" : "border-line"}`}
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-display font-bold text-ink">ข้อ {it.n}</span>
                        <span className="font-display font-bold tabular-nums text-ink-soft">
                          {it.pctCorrect}% ถูก
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-sand-100">
                        <div className={`h-full rounded-full ${tone}`} style={{ width: `${it.pctCorrect}%` }} />
                      </div>

                      {/* เลือกเฉลย */}
                      <div className="mt-2.5 flex items-center gap-2">
                        <span className="text-xs font-semibold text-muted">เฉลย:</span>
                        <div className="flex gap-1">
                          {Array.from({ length: data.choices }, (_, k) => k + 1).map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setEdit((s) => ({ ...s, [it.n]: c }))}
                              aria-pressed={cur === c}
                              className={`h-8 w-8 rounded-lg text-sm font-bold tabular-nums ring-1 transition-colors ${
                                cur === c
                                  ? "bg-brand-600 text-white ring-brand-600"
                                  : "bg-white text-ink-soft ring-line hover:bg-canvas"
                              }`}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      </div>

                      <p className="mt-2 text-xs text-muted">
                        ตอบถูก {it.correct}/{data.submitted} คน
                        {data.submitted - it.answered > 0 && <> · ไม่ตอบ {data.submitted - it.answered} คน</>}
                        {it.topWrongChoice != null && (
                          <>
                            {" "}
                            · มักตอบ <b className="text-red-600">{it.topWrongChoice}</b> ({it.topWrongCount} คน)
                          </>
                        )}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>

        {/* footer: บันทึกเฉลย */}
        <div className="border-t border-line bg-white px-5 py-3 sm:px-6">
          {msg && <p className="mb-2 text-sm font-medium text-green-700">{msg}</p>}
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted">
              {changedCount > 0 ? (
                <>แก้เฉลย <b className="text-accent-700">{changedCount}</b> ข้อ (ยังไม่บันทึก)</>
              ) : (
                "ยังไม่ได้แก้เฉลย"
              )}
            </p>
            <button
              type="button"
              onClick={() => setConfirm(true)}
              disabled={changedCount === 0 || saving}
              className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-50"
            >
              บันทึก + คิดคะแนนใหม่
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirm}
        title="คิดคะแนนใหม่ทั้งชุด?"
        body={
          <p>
            จะแก้เฉลย <b className="text-ink">{changedCount}</b> ข้อ แล้ว
            <b className="text-ink">คิดคะแนนของคนที่ส่งแล้วทุกคนใหม่</b>ตามเฉลยใหม่ทันที —
            คะแนนเดิมจะถูกแทนที่ (ย้อนกลับได้ด้วยการแก้เฉลยกลับ)
          </p>
        }
        confirmLabel="คิดคะแนนใหม่"
        cancelLabel="ยกเลิก"
        tone="brand"
        busy={saving}
        onConfirm={doSave}
        onCancel={() => setConfirm(false)}
      />
    </div>
  );
}
