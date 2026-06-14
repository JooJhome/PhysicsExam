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
    /* chips — เลื่อนแนวนอนบนมือถือ, wrap บนจอใหญ่ */
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
  );
}
