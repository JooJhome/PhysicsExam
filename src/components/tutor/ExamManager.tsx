"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  setExamStatus,
  setExamDuration,
  setAllowReview,
  deleteExam,
} from "@/lib/actions/tutor";
import type { ExamListItem } from "@/lib/exams";
import ConfirmDialog from "@/components/ConfirmDialog";
import UploadCard from "@/components/tutor/exams/UploadCard";
import FilterBar, {
  type Filters,
  type StatusFilter,
  type TypeFilter,
} from "@/components/tutor/exams/FilterBar";
import ExamCard from "@/components/tutor/exams/ExamCard";

function parseFilters(sp: URLSearchParams): Filters {
  const status = sp.get("status");
  const type = sp.get("type");
  return {
    status: status === "published" || status === "draft" ? (status as StatusFilter) : "all",
    type: type === "CU-ATS" || type === "TBAT" ? (type as TypeFilter) : "all",
    q: sp.get("q") ?? "",
  };
}

export default function ExamManager({ exams }: { exams: ExamListItem[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const [toDelete, setToDelete] = useState<ExamListItem | null>(null);

  const filters = useMemo(
    () => parseFilters(new URLSearchParams(searchParams.toString())),
    [searchParams]
  );

  function setFilters(next: Filters) {
    const sp = new URLSearchParams();
    if (next.status !== "all") sp.set("status", next.status);
    if (next.type !== "all") sp.set("type", next.type);
    if (next.q.trim()) sp.set("q", next.q.trim());
    const qs = sp.toString();
    router.replace(qs ? `/tutor/exams?${qs}` : "/tutor/exams", { scroll: false });
  }

  function act(fn: () => Promise<{ ok: boolean; message: string }>) {
    startTransition(async () => {
      const r = await fn();
      setMsg({ ok: r.ok, text: r.message });
      router.refresh();
    });
  }

  const published = exams.filter((e) => e.status === "published").length;

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return exams.filter((e) => {
      if (filters.status !== "all" && e.status !== filters.status) return false;
      if (filters.type !== "all" && e.type !== filters.type) return false;
      if (q && !`${e.title} ${e.code}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [exams, filters]);

  const hasFilter = filters.status !== "all" || filters.type !== "all" || filters.q.trim() !== "";

  return (
    <div className="mt-8 space-y-6">
      <UploadCard />

      {msg && (
        <p
          className={`rounded-xl px-4 py-3 text-sm font-medium ring-1 ${
            msg.ok ? "bg-green-50 text-green-700 ring-green-200" : "bg-red-50 text-red-700 ring-red-100"
          }`}
        >
          {msg.text}
        </p>
      )}

      <div>
        {/* หัว + นับ + search */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between">
          <h2 className="font-display text-xl font-bold text-ink">
            ชุดข้อสอบทั้งหมด{" "}
            <span className="text-sm font-medium text-muted">
              {exams.length} ชุด · {published} เผยแพร่
            </span>
          </h2>
        </div>

        <FilterBar filters={filters} onChange={setFilters} />

        <div className="mt-4 space-y-3">
          {filtered.map((e) => (
            <ExamCard
              key={e.id}
              exam={e}
              pending={pending}
              onToggleStatus={() =>
                act(() => setExamStatus(e.id, e.status === "published" ? "draft" : "published"))
              }
              onToggleReview={(checked) => act(() => setAllowReview(e.id, checked))}
              onSaveDuration={(mins) => act(() => setExamDuration(e.id, mins))}
              onDelete={() => setToDelete(e)}
            />
          ))}

          {filtered.length === 0 && (
            <div className="rounded-2xl border border-line bg-white px-5 py-14 text-center shadow-card">
              <p className="text-2xl">{exams.length === 0 ? "📄" : "🔍"}</p>
              <p className="mt-2 font-semibold text-ink">
                {exams.length === 0 ? "ยังไม่มีชุดข้อสอบ" : "ไม่พบชุดที่ตรงกับตัวกรอง"}
              </p>
              <p className="mt-1 text-sm text-muted">
                {exams.length === 0 ? "อัปโหลดไฟล์ HTML ด้านบนเพื่อเริ่ม" : "ลองล้างตัวกรองหรือค้นด้วยคำอื่น"}
              </p>
              {exams.length > 0 && hasFilter && (
                <button
                  type="button"
                  onClick={() => setFilters({ status: "all", type: "all", q: "" })}
                  className="mt-4 rounded-lg border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
                >
                  ล้างตัวกรอง
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={toDelete !== null}
        title="ลบชุดข้อสอบ?"
        body={
          <p>
            ลบชุด <span className="font-semibold text-ink">“{toDelete?.title}”</span>{" "}
            พร้อมเฉลยและผลสอบที่เกี่ยวข้อง
            {toDelete && toDelete.submittedCount > 0 && (
              <>
                {" "}
                (มีผลส่งแล้ว <b>{toDelete.submittedCount}</b> รายการ)
              </>
            )}{" "}
            — ย้อนกลับไม่ได้
          </p>
        }
        confirmLabel="ลบชุดนี้"
        cancelLabel="ยกเลิก"
        tone="danger"
        busy={pending}
        onConfirm={() => {
          const id = toDelete?.id;
          setToDelete(null);
          if (id) act(() => deleteExam(id));
        }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
