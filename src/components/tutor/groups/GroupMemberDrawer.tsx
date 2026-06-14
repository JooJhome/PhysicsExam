"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GroupListItem, GroupMemberLite } from "@/lib/groups";

export default function GroupMemberDrawer({
  group,
  students,
  onClose,
  onSave,
  busy,
}: {
  group: GroupListItem;
  students: GroupMemberLite[];
  onClose: () => void;
  onSave: (studentIds: string[]) => void;
  busy: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const initial = useMemo(() => new Set(group.members.map((m) => m.id)), [group]);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(initial));
  const [q, setQ] = useState("");

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

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return students;
    return students.filter((s) =>
      `${s.username} ${s.displayName ?? ""}`.toLowerCase().includes(term)
    );
  }, [students, q]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const dirty =
    selected.size !== initial.size || [...selected].some((id) => !initial.has(id));

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
        aria-label={`จัดสมาชิก ${group.name}`}
        className="absolute inset-x-0 bottom-0 flex max-h-[92vh] flex-col rounded-t-3xl bg-white shadow-lift outline-none animate-dialog-in sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:w-[62%] sm:max-w-2xl sm:rounded-none"
      >
        <div className="flex items-start gap-3 border-b border-line px-5 py-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-lg font-bold text-ink">
              จัดสมาชิก: {group.name}
            </h2>
            <p className="truncate text-sm text-muted">นักเรียนทั้งหมด {students.length} คน</p>
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
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นนักเรียน"
            aria-label="ค้นนักเรียน"
            className="w-full rounded-xl border border-line bg-white px-4 py-3 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />

          <div className="mt-3 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            <button type="button" onClick={() => setSelected(new Set(students.map((s) => s.id)))} className={chip}>
              เลือกทั้งหมด
            </button>
            <button type="button" onClick={() => setSelected(new Set())} className={chip}>
              ล้าง
            </button>
          </div>

          <p className="mt-3 text-sm font-semibold text-ink">
            เลือกแล้ว {selected.size}/{students.length} คน
          </p>

          <ul className="mt-2 divide-y divide-line">
            {filtered.map((s) => {
              const checked = selected.has(s.id);
              return (
                <li key={s.id} className="flex items-center gap-3 py-2.5">
                  <label className="flex min-h-[44px] flex-none items-center">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(s.id)}
                      aria-label={`เลือก ${s.username}`}
                      className="h-5 w-5 accent-brand-600"
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
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="py-8 text-center text-sm text-muted">ไม่พบนักเรียน</li>
            )}
          </ul>
        </div>

        <div className="sticky bottom-0 border-t border-line bg-white px-5 py-3 sm:px-6">
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:bg-canvas"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={() => onSave([...selected])}
              disabled={!dirty || busy}
              className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-50"
            >
              {busy ? "กำลังบันทึก…" : "บันทึก"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
