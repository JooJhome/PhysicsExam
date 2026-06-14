"use client";

import { SORT_OPTIONS, type SortKey, type ViewMode } from "./useExamList";
import type { Filters } from "./FilterBar";

function Icon({ d, className }: { d: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className ?? "h-[18px] w-[18px]"}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={d} />
    </svg>
  );
}

export default function ExamsToolbar({
  filters,
  sort,
  view,
  onSearch,
  onSort,
  onView,
  onUpload,
}: {
  filters: Filters;
  sort: SortKey;
  view: ViewMode;
  onSearch: (q: string) => void;
  onSort: (s: SortKey) => void;
  onView: (v: ViewMode) => void;
  onUpload: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* search */}
      <div className="relative flex-1">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </span>
        <input
          type="search"
          inputMode="search"
          value={filters.q}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="ค้นหาชื่อชุดหรือรหัส"
          aria-label="ค้นหาชุดข้อสอบ"
          className="w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-4 text-base transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
      </div>

      <div className="flex items-center gap-2">
        {/* sort */}
        <label className="relative flex-1 sm:flex-none">
          <span className="sr-only">เรียงลำดับ</span>
          <select
            value={sort}
            onChange={(e) => onSort(e.target.value as SortKey)}
            className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-line bg-white pl-3.5 pr-9 text-sm font-semibold text-ink-soft transition-colors hover:border-brand-200 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 sm:w-auto"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>
                เรียง: {o.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">
            <Icon d="M6 9l6 6 6-6" className="h-4 w-4" />
          </span>
        </label>

        {/* view toggle (table = เร็วๆนี้) */}
        <div className="flex flex-none rounded-xl border border-line bg-white p-0.5" role="group" aria-label="มุมมอง">
          <button
            type="button"
            onClick={() => onView("card")}
            aria-pressed={view === "card"}
            aria-label="มุมมองการ์ด"
            className={`grid h-10 w-10 place-items-center rounded-[0.6rem] transition-colors ${
              view === "card" ? "bg-brand-600 text-white" : "text-muted hover:text-ink"
            }`}
          >
            <Icon d="M4 5h6v6H4zM14 5h6v6h-6zM4 14h6v5H4zM14 14h6v5h-6z" />
          </button>
          <button
            type="button"
            disabled
            title="มุมมองตาราง — เร็วๆนี้"
            aria-label="มุมมองตาราง (เร็วๆนี้)"
            className="grid h-10 w-10 cursor-not-allowed place-items-center rounded-[0.6rem] text-muted/40"
          >
            <Icon d="M3 5h18M3 10h18M3 15h18M3 20h18" />
          </button>
        </div>

        {/* upload */}
        <button
          type="button"
          onClick={onUpload}
          className="flex h-11 flex-none items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-700"
        >
          <Icon d="M12 16V4M8 8l4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
          <span className="hidden sm:inline">อัปโหลดชุดใหม่</span>
          <span className="sm:hidden">อัปโหลด</span>
        </button>
      </div>
    </div>
  );
}
