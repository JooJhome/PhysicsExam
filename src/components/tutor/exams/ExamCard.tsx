"use client";

import { useState } from "react";
import Link from "next/link";
import type { ExamListItem } from "@/lib/exams";
import ExamMenu, { type MenuItem } from "./ExamMenu";

export default function ExamCard({
  exam,
  pending,
  onToggleStatus,
  onToggleReview,
  onSaveDuration,
  onDelete,
}: {
  exam: ExamListItem;
  pending: boolean;
  onToggleStatus: () => void;
  onToggleReview: (checked: boolean) => void;
  onSaveDuration: (mins: number) => void;
  onDelete: () => void;
}) {
  const [editingDuration, setEditingDuration] = useState(false);
  const [draft, setDraft] = useState(String(exam.durationMin));
  const published = exam.status === "published";
  const previewHref = `/tutor/exams/preview/${exam.id}`;

  function commitDuration() {
    const mins = Math.round(Number(draft));
    setEditingDuration(false);
    if (Number.isFinite(mins) && mins >= 1 && mins !== exam.durationMin) onSaveDuration(mins);
    else setDraft(String(exam.durationMin));
  }

  const menuItems: MenuItem[] = [
    { kind: "link", label: "ดูตัวอย่างฉบับนักเรียน", href: previewHref, newTab: true },
    { kind: "link", label: "มอบหมาย", href: "/tutor/assign" },
    { kind: "link", label: "ดูผลของชุดนี้", href: "/tutor/results" },
    {
      kind: "button",
      label: "แก้เวลาสอบ",
      onClick: () => {
        setDraft(String(exam.durationMin));
        setEditingDuration(true);
      },
    },
    { kind: "button", label: "ลบชุดนี้", onClick: onDelete, danger: true },
  ];

  return (
    <article className="rounded-2xl border border-line bg-white p-4 shadow-card transition-shadow hover:shadow-lift">
      {/* บรรทัดบน: ชื่อ+chips | สถานะ + ⋯ */}
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="font-display text-base font-bold leading-snug text-ink">
              {exam.title}
            </h3>
            <span className="rounded-full bg-brand-50 px-2 py-0.5 font-display text-xs font-bold text-brand-700">
              {exam.code}
            </span>
            {exam.type && (
              <span className="rounded-full bg-canvas px-2 py-0.5 text-xs font-semibold text-ink-soft ring-1 ring-line">
                {exam.type}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-none items-center gap-1">
          <button
            type="button"
            onClick={onToggleStatus}
            disabled={pending}
            title="คลิกเพื่อสลับสถานะเผยแพร่"
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 transition-shadow hover:ring-2 disabled:opacity-60 ${
              published
                ? "bg-green-50 text-green-700 ring-green-200"
                : "bg-sand-100 text-muted ring-line"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${published ? "bg-green-600" : "bg-muted"}`} />
            {published ? "เผยแพร่แล้ว" : "ฉบับร่าง"}
          </button>
          <ExamMenu items={menuItems} />
        </div>
      </div>

      {/* meta */}
      <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted">
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

      {/* บรรทัดล่าง — ไม่มี divider, กระชับ */}
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2.5 text-sm text-ink-soft">
          <button
            type="button"
            role="switch"
            aria-checked={exam.solutionVisible}
            aria-label="ให้นักเรียนดูเฉลย"
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
          ให้นักเรียนดูเฉลย
        </label>

        {/* desktop/tablet: ลิงก์ action ; mobile: ซ่อน (อยู่ในเมนู ⋯) */}
        <div className="ml-auto hidden items-center gap-2 sm:flex">
          <Link
            href={previewHref}
            target="_blank"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
          >
            ดูตัวอย่าง
          </Link>
          {published ? (
            <Link
              href="/tutor/assign"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
            >
              มอบหมาย
            </Link>
          ) : (
            <button
              type="button"
              onClick={onToggleStatus}
              disabled={pending}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
            >
              เผยแพร่
            </button>
          )}
        </div>

        {/* mobile: ปุ่มเผยแพร่ยังโชว์ (action สำคัญของ draft) */}
        {!published && (
          <button
            type="button"
            onClick={onToggleStatus}
            disabled={pending}
            className="ml-auto rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-700 disabled:opacity-60 sm:hidden"
          >
            เผยแพร่
          </button>
        )}
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
