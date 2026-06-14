"use client";

import { useState } from "react";
import Link from "next/link";
import type { ExamListItem } from "@/lib/exams";
import ExamMenu, { type MenuItem } from "./ExamMenu";

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function AssignIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1H9z" />
      <path d="m9.5 13 1.5 1.5 3.5-3.5" />
    </svg>
  );
}

export default function ExamCard({
  exam,
  pending,
  onToggleStatus,
  onToggleReview,
  onSaveDuration,
  onSaveTitle,
  onDelete,
}: {
  exam: ExamListItem;
  pending: boolean;
  onToggleStatus: () => void;
  onToggleReview: (checked: boolean) => void;
  onSaveDuration: (mins: number) => void;
  onSaveTitle: (title: string) => void;
  onDelete: () => void;
}) {
  const [editingDuration, setEditingDuration] = useState(false);
  const [draft, setDraft] = useState(String(exam.durationMin));
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(exam.title);
  const published = exam.status === "published";
  const previewHref = `/tutor/exams/preview/${exam.id}`;

  function commitDuration() {
    const mins = Math.round(Number(draft));
    setEditingDuration(false);
    if (Number.isFinite(mins) && mins >= 1 && mins !== exam.durationMin) onSaveDuration(mins);
    else setDraft(String(exam.durationMin));
  }

  function commitTitle() {
    const name = titleDraft.trim();
    setEditingTitle(false);
    if (name && name !== exam.title) onSaveTitle(name);
    else setTitleDraft(exam.title);
  }

  const menuItems: MenuItem[] = [
    { kind: "link", label: "ดูตัวอย่างฉบับนักเรียน", href: previewHref, newTab: true },
    { kind: "link", label: "มอบหมาย", href: "/tutor/assign" },
    { kind: "link", label: "ดูผลของชุดนี้", href: "/tutor/results" },
    {
      kind: "button",
      label: "แก้ชื่อชุด",
      onClick: () => {
        setTitleDraft(exam.title);
        setEditingTitle(true);
      },
    },
    {
      kind: "button",
      label: "แก้เวลาสอบ",
      onClick: () => {
        setDraft(String(exam.durationMin));
        setEditingDuration(true);
      },
    },
    { kind: "soon", label: "คัดลอกชุด" },
    { kind: "button", label: "ลบชุดนี้", onClick: onDelete, danger: true },
  ];

  const iconBtn =
    "grid h-9 w-9 place-items-center rounded-lg text-ink-soft transition-colors hover:bg-brand-50 hover:text-brand-700";

  return (
    <article className="rounded-2xl border border-line bg-white p-4 shadow-card transition-shadow hover:shadow-lift">
      <div className="flex items-start gap-3">
        {/* ── ซ้าย: ชื่อ+chips / meta ── */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {editingTitle ? (
              <input
                autoFocus
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitTitle();
                  else if (e.key === "Escape") {
                    setTitleDraft(exam.title);
                    setEditingTitle(false);
                  }
                }}
                aria-label="แก้ชื่อชุด"
                className="min-w-0 flex-1 rounded-md border border-brand-300 bg-white px-2 py-0.5 font-display text-base font-bold text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            ) : (
              <h3 className="font-display text-base font-bold leading-snug text-ink">
                {exam.title}
              </h3>
            )}
            <span className="rounded-full bg-brand-50 px-2 py-0.5 font-display text-xs font-bold text-brand-700">
              {exam.code}
            </span>
            {exam.type && (
              <span className="rounded-full bg-canvas px-2 py-0.5 text-xs font-semibold text-ink-soft ring-1 ring-line">
                {exam.type}
              </span>
            )}
          </div>

          <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted">
            <Meta value={exam.questionCount} unit="ข้อ" />
            <Sep />
            {editingDuration ? (
              <input
                autoFocus
                type="number"
                min={1}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commitDuration}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitDuration();
                  else if (e.key === "Escape") {
                    setDraft(String(exam.durationMin));
                    setEditingDuration(false);
                  }
                }}
                className="w-16 rounded-md border border-brand-300 bg-white px-1.5 py-0.5 text-center font-display font-bold tabular-nums text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            ) : (
              <Meta value={exam.durationMin} unit="นาที" />
            )}
            <Sep />
            {exam.assignedCount === 0 ? (
              <span>ยังไม่ได้มอบหมาย</span>
            ) : (
              <>
                <span>
                  มอบหมาย <b className="font-display font-bold tabular-nums text-ink-soft">{exam.assignedCount}</b>
                </span>
                <Sep />
                <span>
                  ส่งแล้ว <b className="font-display font-bold tabular-nums text-ink-soft">{exam.submittedCount}</b>
                </span>
                {exam.avgScore != null && (
                  <>
                    <Sep />
                    <span>
                      เฉลี่ย{" "}
                      <b className="font-display font-bold tabular-nums text-ink-soft">
                        {exam.avgScore}/{exam.questionCount}
                      </b>
                    </span>
                  </>
                )}
              </>
            )}
          </p>
        </div>

        {/* ── ขวา: สถานะ · เฉลย · actions · ⋯ ── */}
        <div className="flex flex-none items-center gap-1">
          <button
            type="button"
            onClick={onToggleStatus}
            disabled={pending}
            title="คลิกเพื่อสลับสถานะเผยแพร่"
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 transition-shadow hover:ring-2 disabled:opacity-60 ${
              published ? "bg-green-50 text-green-700 ring-green-200" : "bg-sand-100 text-muted ring-line"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${published ? "bg-green-600" : "bg-muted"}`} />
            {published ? "เผยแพร่" : "ฉบับร่าง"}
          </button>

          {/* switch ให้ดูเฉลย (ย่อ) */}
          <span className="ml-1 flex items-center gap-1.5">
            <span className="hidden text-xs font-medium text-muted lg:inline">เฉลย</span>
            <button
              type="button"
              role="switch"
              aria-checked={exam.solutionVisible}
              aria-label="ให้นักเรียนดูเฉลย"
              title="ให้นักเรียนดูเฉลย"
              disabled={pending}
              onClick={() => onToggleReview(!exam.solutionVisible)}
              className={`inline-flex h-6 w-11 flex-none items-center rounded-full px-0.5 transition-colors disabled:opacity-60 ${
                exam.solutionVisible ? "bg-brand-600" : "bg-sand-300"
              }`}
            >
              <span
                className={`h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  exam.solutionVisible ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </span>

          {/* draft: ปุ่มเผยแพร่ (ทุกขนาด) · published: ไอคอน preview/assign (เดสก์ท็อป) */}
          {!published ? (
            <button
              type="button"
              onClick={onToggleStatus}
              disabled={pending}
              className="ml-1 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-bold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
            >
              เผยแพร่
            </button>
          ) : (
            <span className="ml-1 hidden items-center gap-0.5 sm:flex">
              <Link href={previewHref} target="_blank" title="ดูตัวอย่าง" aria-label="ดูตัวอย่าง" className={iconBtn}>
                <EyeIcon className="h-[18px] w-[18px]" />
              </Link>
              <Link href="/tutor/assign" title="มอบหมาย" aria-label="มอบหมาย" className={iconBtn}>
                <AssignIcon className="h-[18px] w-[18px]" />
              </Link>
            </span>
          )}

          <ExamMenu items={menuItems} />
        </div>
      </div>
    </article>
  );
}

function Meta({ value, unit }: { value: number; unit: string }) {
  return (
    <span>
      <b className="font-display font-bold tabular-nums text-ink-soft">{value}</b> {unit}
    </span>
  );
}
function Sep() {
  return <span className="text-line">·</span>;
}
