"use client";

export type StudentSortKey = "recent" | "name" | "assigned" | "avg";

export const STUDENT_SORT_OPTIONS: { key: StudentSortKey; label: string }[] = [
  { key: "recent", label: "ใช้งานล่าสุด" },
  { key: "name", label: "ชื่อ A–Z" },
  { key: "assigned", label: "มอบหมายมากสุด" },
  { key: "avg", label: "คะแนนเฉลี่ย" },
];

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

export default function StudentsToolbar({
  q,
  sort,
  onSearch,
  onSort,
  onAdd,
}: {
  q: string;
  sort: StudentSortKey;
  onSearch: (q: string) => void;
  onSort: (s: StudentSortKey) => void;
  onAdd: () => void;
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
          value={q}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="ค้นหาชื่อ / username"
          aria-label="ค้นหานักเรียน"
          className="w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-4 text-base transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
      </div>

      <div className="flex items-center gap-2">
        {/* sort */}
        <label className="relative flex-1 sm:flex-none">
          <span className="sr-only">เรียงลำดับ</span>
          <select
            value={sort}
            onChange={(e) => onSort(e.target.value as StudentSortKey)}
            className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-line bg-white pl-3.5 pr-9 text-sm font-semibold text-ink-soft transition-colors hover:border-brand-200 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 sm:w-auto"
          >
            {STUDENT_SORT_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>
                เรียง: {o.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">
            <Icon d="M6 9l6 6 6-6" className="h-4 w-4" />
          </span>
        </label>

        {/* add */}
        <button
          type="button"
          onClick={onAdd}
          className="flex h-11 flex-none items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-700"
        >
          <Icon d="M12 5v14M5 12h14" />
          <span className="hidden sm:inline">เพิ่มนักเรียน</span>
          <span className="sm:hidden">เพิ่ม</span>
        </button>
      </div>
    </div>
  );
}
