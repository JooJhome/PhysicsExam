"use client";

import { useMemo, useState } from "react";
import type { StudentExamCard } from "@/lib/studentHome";
import ExamCard from "./ExamCard";
import NextExamCard from "./NextExamCard";

// แนะนำ = ลำดับจาก server (ต้องทำ: ใกล้ deadline ก่อน / ทำเสร็จ: ส่งล่าสุดก่อน)
// ชื่อ   = เรียงตามชื่อชุด A–Z (numeric: true → "Set 2" มาก่อน "Set 10")
type SortMode = "smart" | "name";

function sortByName(a: StudentExamCard, b: StudentExamCard): number {
  return a.title.localeCompare(b.title, "th", { numeric: true });
}

/**
 * กลุ่มการ์ดข้อสอบในหน้านักเรียน (ต้องทำ / ทำเสร็จ) พร้อมปุ่มสลับการเรียงลำดับ
 * รับลิสต์ที่ server เรียงมาแล้ว แล้วเรียงใหม่ฝั่ง client ทันที (ไม่ต้องโหลดซ้ำ)
 */
export default function SortableExamGroup({
  title,
  exams,
  muted = false,
  nextExamId = null,
}: {
  title: string;
  exams: StudentExamCard[];
  muted?: boolean;
  nextExamId?: string | null; // ชุดที่ไฮไลต์เป็นการ์ดเด่นบนสุด (ไม่นับใน grid/การเรียง)
}) {
  const [sort, setSort] = useState<SortMode>("smart");

  // ดึงชุดถัดไปออกมาเป็นการ์ดเด่น — ที่เหลือเข้า grid ที่เรียงได้
  const nextExam = nextExamId ? exams.find((e) => e.examId === nextExamId) ?? null : null;
  const rest = useMemo(
    () => exams.filter((e) => e.examId !== nextExam?.examId),
    [exams, nextExam]
  );
  const list = useMemo(
    () => (sort === "name" ? [...rest].sort(sortByName) : rest),
    [rest, sort]
  );

  return (
    <section className="mt-9">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex items-baseline gap-2">
          <h2
            className={`font-display text-xl font-extrabold ${
              muted ? "text-muted" : "text-ink"
            }`}
          >
            {title}
          </h2>
          <span className="text-sm text-muted">· {exams.length} ชุด</span>
        </div>

        {/* โชว์ตัวเรียงเฉพาะเมื่อ grid มีมากกว่า 1 ชุด (การ์ดเด่นไม่นับ) */}
        {rest.length > 1 && (
          <SortToggle title={title} value={sort} onChange={setSort} />
        )}
      </div>

      {nextExam && (
        <div className="mt-4">
          <NextExamCard exam={nextExam} />
        </div>
      )}

      {list.length > 0 && (
        <ul className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((e) => (
            <ExamCard key={e.examId} exam={e} />
          ))}
        </ul>
      )}
    </section>
  );
}

function SortToggle({
  title,
  value,
  onChange,
}: {
  title: string;
  value: SortMode;
  onChange: (v: SortMode) => void;
}) {
  return (
    <div
      className="flex flex-none rounded-xl border border-line bg-white p-0.5"
      role="group"
      aria-label={`เรียงลำดับ${title}`}
    >
      <ToggleButton active={value === "smart"} onClick={() => onChange("smart")}>
        แนะนำ
      </ToggleButton>
      <ToggleButton active={value === "name"} onClick={() => onChange("name")}>
        ชื่อ A–Z
      </ToggleButton>
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-[0.6rem] px-3 py-1.5 text-xs font-bold transition-colors ${
        active ? "bg-brand-600 text-white" : "text-muted hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
