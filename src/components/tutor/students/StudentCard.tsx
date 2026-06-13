"use client";

import { useState } from "react";
import type { StudentListItem } from "@/lib/students";
import ExamMenu, { type MenuItem } from "@/components/tutor/exams/ExamMenu";

export default function StudentCard({
  student,
  selected,
  pending,
  onSelect,
  onReset,
  onRename,
  onDelete,
}: {
  student: StudentListItem;
  selected: boolean;
  pending: boolean;
  onSelect: (checked: boolean) => void;
  onReset: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(student.displayName ?? "");
  const active = student.status === "active";
  const initial = (student.displayName || student.username).charAt(0).toUpperCase();

  function commit() {
    setEditing(false);
    const name = draft.trim();
    if (name !== (student.displayName ?? "")) onRename(name);
  }

  const menuItems: MenuItem[] = [
    { kind: "link", label: "มอบหมายข้อสอบ", href: "/tutor/assign" },
    { kind: "button", label: "รีเซ็ตรหัสผ่าน", onClick: onReset },
    { kind: "link", label: "ดูผลของนักเรียน", href: "/tutor/results" },
    {
      kind: "button",
      label: "แก้ไขชื่อ",
      onClick: () => {
        setDraft(student.displayName ?? "");
        setEditing(true);
      },
    },
    { kind: "button", label: "ลบนักเรียน", onClick: onDelete, danger: true },
  ];

  return (
    <article className="rounded-2xl border border-line bg-white p-4 shadow-card transition-shadow hover:shadow-lift sm:p-5">
      <div className="flex items-start gap-3">
        <label className="flex min-h-[44px] flex-none items-center">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelect(e.target.checked)}
            aria-label={`เลือก ${student.username}`}
            className="h-5 w-5 accent-brand-600"
          />
        </label>

        <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-brand-50 font-display text-sm font-bold uppercase text-brand-700">
          {initial}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-display font-bold text-ink">{student.username}</span>
            {editing ? (
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commit();
                  else if (e.key === "Escape") setEditing(false);
                }}
                placeholder="ชื่อ-สกุล"
                className="w-44 rounded-md border border-brand-300 px-2 py-0.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            ) : student.displayName ? (
              <span className="text-sm text-muted">· {student.displayName}</span>
            ) : (
              <span className="text-sm italic text-hint">· ยังไม่ตั้งชื่อ</span>
            )}
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted">
            <span>
              มอบหมาย <b className="font-display font-bold tabular-nums text-ink-soft">{student.assignedCount}</b>
            </span>
            <span className="text-line">·</span>
            <span>
              ทำเสร็จ <b className="font-display font-bold tabular-nums text-ink-soft">{student.completedCount}</b>
            </span>
            {student.avgScore != null && (
              <>
                <span className="text-line">·</span>
                <span>
                  เฉลี่ย <b className="font-display font-bold tabular-nums text-ink-soft">{student.avgScore}/30</b>
                </span>
              </>
            )}
          </p>
        </div>

        <div className="flex flex-none items-center gap-1">
          <span
            className={`hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold sm:inline-flex ${
              active ? "bg-green-50 text-green-700" : "bg-sand-100 text-muted"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-green-600" : "bg-muted"}`} />
            {active ? `ใช้งาน ${student.lastActiveLabel}` : "ยังไม่เข้าระบบ"}
          </span>
          <ExamMenu items={menuItems} />
        </div>
      </div>

      {/* mobile: pill ใต้ชื่อ */}
      <div className="mt-3 sm:hidden">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
            active ? "bg-green-50 text-green-700" : "bg-sand-100 text-muted"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-green-600" : "bg-muted"}`} />
          {active ? `ใช้งาน ${student.lastActiveLabel}` : "ยังไม่เข้าระบบ"}
        </span>
      </div>
    </article>
  );
}
