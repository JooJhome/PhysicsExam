"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  saveAssignment,
  type ExamAssignmentDetail,
  type SaveAssignmentResult,
} from "@/lib/actions/tutor";
import ConfirmDialog from "@/components/ConfirmDialog";

export type UndoSnapshot = {
  examId: string;
  studentIds: string[];
  window: { open: string | null; close: string | null; due: string | null };
  durationOverride: number | null;
};

function isoToLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}
function localToIso(s: string): string | null {
  return s ? new Date(s).toISOString() : null;
}

export default function AssignDrawer({
  detail,
  onClose,
  onSaved,
}: {
  detail: ExamAssignmentDetail;
  onClose: () => void;
  onSaved: (result: SaveAssignmentResult, undo: UndoSnapshot) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const assignedSet = useMemo(
    () => new Set(detail.students.filter((s) => s.assigned).map((s) => s.id)),
    [detail]
  );

  const [selected, setSelected] = useState<Set<string>>(() => new Set(assignedSet));
  const [q, setQ] = useState("");
  const [freeFirst, setFreeFirst] = useState(false);
  const [open, setOpen] = useState(isoToLocal(detail.window.open));
  const [close, setClose] = useState(isoToLocal(detail.window.close));
  const [due, setDue] = useState(isoToLocal(detail.window.due));
  const [duration, setDuration] = useState(String(detail.durationOverride ?? detail.exam.durationMin));
  const [saving, setSaving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<number | null>(null);

  useEffect(() => {
    panelRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  function toggle(id: string, locked: boolean) {
    if (locked) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let list = detail.students;
    if (term) list = list.filter((s) => `${s.username} ${s.displayName ?? ""}`.toLowerCase().includes(term));
    if (freeFirst) {
      list = [...list].sort((a, b) => {
        const af = !a.assigned && a.attemptState === "none" ? 0 : 1;
        const bf = !b.assigned && b.attemptState === "none" ? 0 : 1;
        return af - bf;
      });
    }
    return list;
  }, [detail.students, q, freeFirst]);

  const toAdd = [...selected].filter((id) => !assignedSet.has(id)).length;
  const toRemoveIds = [...assignedSet].filter((id) => !selected.has(id));
  const inProgressRemovals = detail.students.filter(
    (s) => toRemoveIds.includes(s.id) && s.attemptState === "in_progress"
  ).length;
  const dirty = toAdd > 0 || toRemoveIds.length > 0 || hasWindowChange();

  function currentOverride(): number | null {
    const n = Math.round(Number(duration));
    return Number.isFinite(n) && n >= 1 && n !== detail.exam.durationMin ? n : null;
  }
  function hasWindowChange() {
    return (
      localToIso(open) !== detail.window.open ||
      localToIso(close) !== detail.window.close ||
      localToIso(due) !== detail.window.due ||
      currentOverride() !== (detail.durationOverride ?? null)
    );
  }

  function selectAll() {
    setSelected(new Set(detail.students.map((s) => s.id)));
  }
  function selectUnassigned() {
    setSelected((prev) => {
      const next = new Set(prev);
      detail.students.forEach((s) => {
        if (!s.assigned) next.add(s.id);
      });
      return next;
    });
  }
  function clearAll() {
    // คงคนที่ส่งแล้วไว้ (ล็อก ถอนไม่ได้)
    setSelected(new Set(detail.students.filter((s) => s.attemptState === "submitted").map((s) => s.id)));
  }

  async function doSave() {
    setSaving(true);
    // override = เก็บเฉพาะเมื่อต่างจากค่าเริ่มต้นของชุด ; เท่ากับ default → null (ไม่ override)
    const overrideVal = currentOverride();
    const result = await saveAssignment(
      detail.exam.id,
      [...selected],
      { open: localToIso(open), close: localToIso(close), due: localToIso(due) },
      overrideVal
    );
    const undo: UndoSnapshot = {
      examId: detail.exam.id,
      studentIds: [...assignedSet],
      window: detail.window,
      durationOverride: detail.durationOverride,
    };
    setSaving(false);
    onSaved(result, undo);
    onClose();
  }

  function onSaveClick() {
    if (inProgressRemovals > 0) setConfirmRemove(inProgressRemovals);
    else doSave();
  }

  const field =
    "w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";
  const chip =
    "flex-none rounded-full border border-line bg-white px-3 py-2 text-sm font-semibold text-ink-soft transition-colors hover:border-brand-200 hover:text-brand-700 min-h-[40px]";

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-ink/40 animate-fade-in" onClick={onClose} />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`มอบหมาย ${detail.exam.name}`}
        className="absolute inset-x-0 bottom-0 flex max-h-[92vh] flex-col rounded-t-3xl bg-white shadow-lift outline-none animate-dialog-in sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:w-[62%] sm:max-w-2xl sm:rounded-none"
      >
        {/* header */}
        <div className="flex items-start gap-3 border-b border-line px-5 py-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-lg font-bold text-ink">
              มอบหมาย: {detail.exam.name}
            </h2>
            <p className="truncate text-sm text-muted">{detail.exam.code}</p>
          </div>
          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
            เผยแพร่แล้ว
          </span>
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

        {/* body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          {/* ช่วงเวลา */}
          <div className="rounded-2xl border border-line bg-canvas/50 p-4">
            <p className="mb-2 text-sm font-semibold text-ink">ช่วงเวลาทำข้อสอบ</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="text-xs font-medium text-muted">
                เปิดให้ทำ
                <input type="datetime-local" value={open} onChange={(e) => setOpen(e.target.value)} className={`mt-1 ${field}`} />
              </label>
              <label className="text-xs font-medium text-muted">
                ปิด
                <input type="datetime-local" value={close} onChange={(e) => setClose(e.target.value)} className={`mt-1 ${field}`} />
              </label>
              <label className="text-xs font-medium text-muted">
                เวลาสอบ (นาที)
                <input
                  type="number"
                  min={1}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className={`mt-1 ${field} font-display font-bold tabular-nums`}
                />
              </label>
            </div>
            <label className="mt-3 block text-xs font-medium text-muted">
              กำหนดส่ง (ถ้ามี)
              <input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} className={`mt-1 ${field} sm:max-w-xs`} />
            </label>
          </div>

          {/* search */}
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นนักเรียน"
            aria-label="ค้นนักเรียน"
            className="mt-4 w-full rounded-xl border border-line bg-white px-4 py-3 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />

          {/* helpers */}
          <div className="mt-3 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            <button type="button" onClick={selectAll} className={chip}>เลือกทั้งหมด</button>
            <button type="button" onClick={selectUnassigned} className={chip}>ที่ยังไม่ถูกมอบ</button>
            <button type="button" onClick={clearAll} className={chip}>ล้าง</button>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">
              เลือกแล้ว {selected.size}/{detail.students.length} คน
            </p>
            <label className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 text-xs text-muted">
              <input type="checkbox" checked={freeFirst} onChange={(e) => setFreeFirst(e.target.checked)} className="h-4 w-4 accent-brand-600" />
              เรียงคนที่ยังว่างขึ้นก่อน
            </label>
          </div>

          {/* รายนักเรียน */}
          <ul className="mt-2 divide-y divide-line">
            {filtered.map((s) => {
              const locked = s.attemptState === "submitted";
              const checked = selected.has(s.id);
              const willRemove = s.assigned && !checked;
              const willAdd = !s.assigned && checked;
              return (
                <li key={s.id} className="flex items-center gap-3 py-2.5">
                  <label className="flex min-h-[44px] flex-none items-center">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={locked}
                      onChange={() => toggle(s.id, locked)}
                      aria-label={`เลือก ${s.username}`}
                      className="h-5 w-5 accent-brand-600 disabled:opacity-50"
                    />
                  </label>
                  <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-brand-50 font-display text-sm font-bold uppercase text-brand-700">
                    {(s.displayName || s.username).charAt(0)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="font-display font-semibold text-ink">{s.username}</span>
                    {s.displayName ? (
                      <span className="text-sm text-muted"> · {s.displayName}</span>
                    ) : (
                      <span className="text-sm italic text-hint"> · ยังไม่ตั้งชื่อ</span>
                    )}
                  </div>
                  <StatusPill locked={locked} state={s.attemptState} willAdd={willAdd} willRemove={willRemove} checked={checked} />
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="py-8 text-center text-sm text-muted">ไม่พบนักเรียน</li>
            )}
          </ul>
        </div>

        {/* footer sticky */}
        <div className="sticky bottom-0 border-t border-line bg-white px-5 py-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted">
              จะเพิ่ม <b className="text-brand-700">{toAdd}</b> · ถอน{" "}
              <b className={toRemoveIds.length ? "text-red-600" : "text-ink-soft"}>{toRemoveIds.length}</b> คน
            </p>
            <div className="ml-auto flex gap-2">
              <button type="button" onClick={onClose} className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:bg-canvas">
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={onSaveClick}
                disabled={!dirty || saving}
                className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-50"
              >
                {saving ? "กำลังบันทึก…" : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmRemove !== null}
        title="ถอนคนที่กำลังทำข้อสอบ?"
        body={
          <p>
            มี <b>{confirmRemove}</b> คนที่กำลังทำข้อสอบอยู่และจะถูกถอนสิทธิ์ —
            เขาจะเข้าทำต่อไม่ได้ (ผลที่ทำค้างไว้ยังอยู่) ยืนยันหรือไม่?
          </p>
        }
        confirmLabel="ยืนยันถอน"
        cancelLabel="ยกเลิก"
        tone="danger"
        busy={saving}
        onConfirm={() => {
          setConfirmRemove(null);
          doSave();
        }}
        onCancel={() => setConfirmRemove(null)}
      />
    </div>
  );
}

function StatusPill({
  locked,
  state,
  willAdd,
  willRemove,
  checked,
}: {
  locked: boolean;
  state: "none" | "in_progress" | "submitted";
  willAdd: boolean;
  willRemove: boolean;
  checked: boolean;
}) {
  let label = "ว่าง";
  let cls = "bg-sand-100 text-muted";
  if (locked) {
    label = "ส่งแล้ว";
    cls = "bg-sand-100 text-muted";
  } else if (state === "in_progress") {
    label = "ทำอยู่";
    cls = "bg-accent-50 text-accent-700";
  } else if (willRemove) {
    label = "จะถอน";
    cls = "bg-red-50 text-red-600";
  } else if (willAdd) {
    label = "จะมอบ";
    cls = "bg-brand-50 text-brand-700";
  } else if (checked) {
    label = "มอบแล้ว";
    cls = "bg-green-50 text-green-700";
  }
  return <span className={`flex-none rounded-full px-2.5 py-1 text-xs font-bold ${cls}`}>{label}</span>;
}
