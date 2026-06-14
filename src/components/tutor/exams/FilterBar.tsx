"use client";

export type StatusFilter = "all" | "published" | "draft";
export type TypeFilter = "all" | "CU-ATS" | "TBAT";

export type Filters = { status: StatusFilter; type: TypeFilter; q: string };

const STATUS_CHIPS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "ทั้งหมด" },
  { key: "published", label: "เผยแพร่แล้ว" },
  { key: "draft", label: "ฉบับร่าง" },
];
const TYPE_CHIPS: { key: TypeFilter; label: string }[] = [
  { key: "CU-ATS", label: "CU-ATS" },
  { key: "TBAT", label: "TBAT" },
];

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export default function FilterBar({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (next: Filters) => void;
}) {
  function chipClass(active: boolean) {
    return `flex-none rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors min-h-[40px] ${
      active
        ? "border-brand-600 bg-brand-600 text-white"
        : "border-line bg-white text-ink-soft hover:border-brand-200 hover:text-brand-700"
    }`;
  }

  return (
    <div className="space-y-3">
      {/* search — เต็มกว้างบนมือถือ */}
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">
          <SearchIcon />
        </span>
        <input
          type="search"
          inputMode="search"
          value={filters.q}
          onChange={(e) => onChange({ ...filters, q: e.target.value })}
          placeholder="ค้นหาชื่อชุดหรือรหัส"
          aria-label="ค้นหาชุดข้อสอบ"
          className="w-full rounded-xl border border-line bg-white py-3 pl-10 pr-4 text-base transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
      </div>

      {/* chips — เลื่อนแนวนอนบนมือถือ, wrap บนจอใหญ่ */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">
        {STATUS_CHIPS.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => onChange({ ...filters, status: c.key })}
            aria-pressed={filters.status === c.key}
            className={chipClass(filters.status === c.key)}
          >
            {c.label}
          </button>
        ))}
        <span className="mx-1 hidden w-px self-stretch bg-line sm:block" />
        {TYPE_CHIPS.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() =>
              onChange({ ...filters, type: filters.type === c.key ? "all" : c.key })
            }
            aria-pressed={filters.type === c.key}
            className={chipClass(filters.type === c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}
