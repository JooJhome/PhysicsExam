import Link from "next/link";
import type { ActionItem, ActivityRow } from "@/lib/overview";
import CopyButton from "./CopyButton";

/* ---------------- ไอคอน (Lucide-style outline) ---------------- */

type IconProps = { className?: string };
const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function FileIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...stroke}>
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
    </svg>
  );
}
export function UsersIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...stroke}>
      <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
      <path d="M3 21v-1a6 6 0 0 1 12 0v1M16 3.5a4 4 0 0 1 0 7.5M21 21v-1a6 6 0 0 0-4-5.6" />
    </svg>
  );
}
export function ClockIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...stroke}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
export function ChartIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...stroke}>
      <path d="M3 3v18h18" />
      <path d="M7 14l3-3 3 3 5-6" />
    </svg>
  );
}
export function AlertIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...stroke}>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}
export function CheckIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...stroke}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
export function PulseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...stroke}>
      <path d="M3 12h4l2 6 4-12 2 6h6" />
    </svg>
  );
}
export function PlusIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...stroke}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
export function SendIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...stroke}>
      <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}

/* ---------------- D. การ์ดเมตริก ---------------- */

export function MetricCard({
  icon,
  label,
  value,
  context,
  accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  context: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-card ${
        accent ? "border-accent-200 bg-accent-50/60" : "border-line bg-white"
      }`}
    >
      <div
        className={`flex items-center gap-2 text-[13px] font-medium ${
          accent ? "text-accent-700" : "text-muted"
        }`}
      >
        <span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>
        {label}
      </div>
      <p
        className={`mt-2 font-display text-3xl font-extrabold leading-none tabular-nums ${
          accent ? "text-accent-700" : "text-ink"
        }`}
      >
        {value}
      </p>
      <p className={`mt-2 text-xs ${accent ? "text-accent-700/80" : "text-muted"}`}>
        {context}
      </p>
    </div>
  );
}

/* ---------------- E1. ต้องจัดการ ---------------- */

export function ActionItems({ items }: { items: ActionItem[] }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-6 shadow-card">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
        <AlertIcon className="h-5 w-5 text-accent-500" />
        ต้องจัดการ
      </h2>

      {items.length === 0 ? (
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-brand-50/60 px-4 py-5 text-brand-700">
          <CheckIcon className="h-5 w-5 flex-none" />
          <p className="text-sm font-semibold">เคลียร์หมดแล้ว — ไม่มีอะไรต้องจัดการ</p>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {items.map((it) => (
            <li key={it.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-accent-50 text-accent-600">
                <AlertIcon className="h-4 w-4" />
              </span>
              <p className="min-w-0 flex-1 text-sm text-ink-soft">{it.text}</p>
              {it.copyText && <CopyButton text={it.copyText} />}
              {it.cta && (
                <Link
                  href={it.cta.href}
                  className="flex-none rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-bold text-brand-700 transition-colors hover:bg-brand-50"
                >
                  {it.cta.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ---------------- E2. ความเคลื่อนไหวล่าสุด ---------------- */

function ScoreChip({ row }: { row: ActivityRow }) {
  if (row.status !== "submitted" || row.score == null) {
    return (
      <span className="flex-none rounded-full bg-sand-100 px-2.5 py-1 text-xs font-bold text-muted">
        รอทำ
      </span>
    );
  }
  const tone = row.passed
    ? "bg-brand-50 text-brand-700"
    : "bg-accent-50 text-accent-700";
  const pct = row.total ? Math.round((row.score / row.total) * 100) : null;
  return (
    <span className={`flex-none rounded-full px-2.5 py-1 font-display text-xs font-bold tabular-nums ${tone}`}>
      {pct != null ? `${pct}%` : `${row.score}/${row.total}`}
    </span>
  );
}

export function ActivityFeed({ rows }: { rows: ActivityRow[] }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-6 shadow-card">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
        <PulseIcon className="h-5 w-5 text-brand-500" />
        ความเคลื่อนไหวล่าสุด
      </h2>

      {rows.length === 0 ? (
        <p className="mt-4 rounded-xl bg-canvas px-4 py-6 text-center text-sm text-muted">
          ยังไม่มีนักเรียนส่งคำตอบ
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-brand-50 font-display text-xs font-bold uppercase text-brand-700">
                {r.initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">{r.name}</p>
                <p className="truncate text-xs text-muted">
                  {r.examLabel}
                  {r.relativeTime && <> · {r.relativeTime}</>}
                </p>
              </div>
              <ScoreChip row={r} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ---------------- E3. การกระทำหลัก ---------------- */

export function PrimaryActions() {
  return (
    <section className="rounded-2xl border border-line bg-white p-6 shadow-card">
      <h2 className="font-display text-lg font-bold text-ink">การกระทำหลัก</h2>
      <div className="mt-4 space-y-2.5">
        <Link
          href="/tutor/exams"
          className="flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-700"
        >
          <FileIcon className="h-4 w-4" />
          อัปโหลดข้อสอบ
        </Link>
        <Link
          href="/tutor/students"
          className="flex items-center justify-center gap-2 rounded-xl border border-brand-200 px-4 py-3 text-sm font-bold text-brand-700 transition-colors hover:bg-brand-50"
        >
          <PlusIcon className="h-4 w-4" />
          เพิ่มนักเรียน
        </Link>
        <Link
          href="/tutor/assign"
          className="flex items-center justify-center gap-2 rounded-xl border border-brand-200 px-4 py-3 text-sm font-bold text-brand-700 transition-colors hover:bg-brand-50"
        >
          <SendIcon className="h-4 w-4" />
          มอบหมายชุดสอบ
        </Link>
      </div>
    </section>
  );
}

/* ---------------- E4. อัตราการทำเสร็จ ---------------- */

export function CompletionCard({
  rate,
  done,
  total,
}: {
  rate: number;
  done: number;
  total: number;
}) {
  return (
    <section className="rounded-2xl bg-brand-700 p-6 text-white shadow-card">
      <p className="text-sm font-medium text-white/80">อัตราการทำเสร็จ</p>
      <p className="mt-1 font-display text-4xl font-extrabold tabular-nums">{rate}%</p>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
        <div
          className="h-full rounded-full bg-white transition-all"
          style={{ width: `${rate}%` }}
        />
      </div>
      <p className="mt-3 text-sm text-white/75">
        <span className="font-display font-bold tabular-nums text-white">{done}</span> จาก{" "}
        <span className="font-display font-bold tabular-nums text-white">{total}</span> ที่มอบหมาย
      </p>
    </section>
  );
}
