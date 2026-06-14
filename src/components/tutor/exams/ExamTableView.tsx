"use client";

import { useState } from "react";
import Link from "next/link";
import type { ExamListItem } from "@/lib/exams";
import ExamMenu, { type MenuItem } from "./ExamMenu";
import type { SortKey } from "./useExamList";

export default function ExamTableView({
  exams,
  pending,
  sort,
  onSort,
  onToggleStatus,
  onToggleReview,
  onSaveTitle,
  onEditLabels,
  onDelete,
}: {
  exams: ExamListItem[];
  pending: boolean;
  sort: SortKey;
  onSort: (s: SortKey) => void;
  onToggleStatus: (e: ExamListItem) => void;
  onToggleReview: (e: ExamListItem, checked: boolean) => void;
  onSaveTitle: (e: ExamListItem, title: string) => void;
  onEditLabels: (e: ExamListItem) => void;
  onDelete: (e: ExamListItem) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState("");

  function commitTitle(e: ExamListItem) {
    const name = titleDraft.trim();
    setEditingId(null);
    if (name && name !== e.title) onSaveTitle(e, name);
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-card">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-line bg-brand-50/70 text-brand-800">
            <SortTh label="ชุด" k="name" sort={sort} onSort={onSort} />
            <th className="px-4 py-3 font-semibold">ประเภท</th>
            <SortTh label="มอบ/ส่ง" k="submitted" sort={sort} onSort={onSort} />
            <SortTh label="เฉลี่ย" k="avg" sort={sort} onSort={onSort} />
            <th className="px-4 py-3 text-center font-semibold">เฉลย</th>
            <th className="px-4 py-3 font-semibold">สถานะ</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {exams.map((e) => {
            const published = e.status === "published";
            const previewHref = `/tutor/exams/preview/${e.id}`;
            const menuItems: MenuItem[] = [
              { kind: "link", label: "ดูตัวอย่างฉบับนักเรียน", href: previewHref, newTab: true },
              { kind: "link", label: "มอบหมาย", href: "/tutor/assign" },
              { kind: "link", label: "ดูผลของชุดนี้", href: "/tutor/results" },
              {
                kind: "button",
                label: "แก้ชื่อชุด",
                onClick: () => {
                  setTitleDraft(e.title);
                  setEditingId(e.id);
                },
              },
              { kind: "button", label: "แก้ป้ายกำกับ", onClick: () => onEditLabels(e) },
              { kind: "soon", label: "คัดลอกชุด" },
              { kind: "button", label: "ลบชุดนี้", onClick: () => onDelete(e), danger: true },
            ];
            return (
              <tr key={e.id} className="transition-colors hover:bg-canvas/70">
                <td className="px-4 py-3">
                  {editingId === e.id ? (
                    <input
                      autoFocus
                      value={titleDraft}
                      onChange={(ev) => setTitleDraft(ev.target.value)}
                      onBlur={() => commitTitle(e)}
                      onKeyDown={(ev) => {
                        if (ev.key === "Enter") commitTitle(e);
                        else if (ev.key === "Escape") setEditingId(null);
                      }}
                      aria-label="แก้ชื่อชุด"
                      className="w-full rounded-md border border-brand-300 bg-white px-2 py-1 font-semibold text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                    />
                  ) : (
                    <p className="font-semibold text-ink">{e.title}</p>
                  )}
                  <span className="font-display text-xs text-muted">{e.code}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-1">
                    {e.kind === "practice" && (
                      <span className="rounded-full bg-accent-50 px-2 py-0.5 text-xs font-bold text-accent-700 ring-1 ring-accent-100">
                        แบบฝึกหัด
                      </span>
                    )}
                    {e.subjects.map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-canvas px-2 py-0.5 text-xs font-semibold text-ink-soft ring-1 ring-line"
                      >
                        {s}
                      </span>
                    ))}
                    {e.subjects.length === 0 && e.kind !== "practice" && (
                      <span className="text-muted">—</span>
                    )}
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-soft">
                  <span className="font-display font-bold tabular-nums text-ink">{e.assignedCount}</span>
                  {" / "}
                  <span className="font-display font-bold tabular-nums text-ink">{e.submittedCount}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  {e.avgPercent != null ? (
                    <span className="font-display font-bold tabular-nums text-ink">
                      {e.avgPercent}
                      <span className="text-muted">%</span>
                    </span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={e.solutionVisible}
                    aria-label={`ให้นักเรียนดูเฉลย — ${e.title}`}
                    title="ให้นักเรียนดูเฉลย"
                    disabled={pending}
                    onClick={() => onToggleReview(e, !e.solutionVisible)}
                    className={`inline-flex h-6 w-11 items-center rounded-full px-0.5 align-middle transition-colors disabled:opacity-60 ${
                      e.solutionVisible ? "bg-brand-600" : "bg-sand-300"
                    }`}
                  >
                    <span
                      className={`h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                        e.solutionVisible ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onToggleStatus(e)}
                    disabled={pending}
                    title="คลิกเพื่อสลับสถานะเผยแพร่"
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 transition-shadow hover:ring-2 disabled:opacity-60 ${
                      published ? "bg-green-50 text-green-700 ring-green-200" : "bg-sand-100 text-muted ring-line"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${published ? "bg-green-600" : "bg-muted"}`} />
                    {published ? "เผยแพร่" : "ฉบับร่าง"}
                  </button>
                </td>
                <td className="px-2 py-3">
                  <div className="flex items-center justify-end gap-0.5">
                    <Link
                      href={previewHref}
                      target="_blank"
                      title="ดูตัวอย่าง"
                      aria-label={`ดูตัวอย่าง ${e.title}`}
                      className="grid h-9 w-9 place-items-center rounded-lg text-ink-soft transition-colors hover:bg-brand-50 hover:text-brand-700"
                    >
                      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </Link>
                    <ExamMenu items={menuItems} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SortTh({
  label,
  k,
  sort,
  onSort,
}: {
  label: string;
  k: SortKey;
  sort: SortKey;
  onSort: (s: SortKey) => void;
}) {
  const active = sort === k;
  return (
    <th className="px-4 py-3 font-semibold">
      <button
        type="button"
        onClick={() => onSort(k)}
        className={`inline-flex items-center gap-1 transition-colors hover:text-brand-600 ${
          active ? "text-brand-700" : ""
        }`}
        aria-label={`เรียงตาม ${label}`}
      >
        {label}
        <span className={active ? "opacity-100" : "opacity-30"} aria-hidden>
          ▾
        </span>
      </button>
    </th>
  );
}
