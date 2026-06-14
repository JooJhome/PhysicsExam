"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  setExamStatus,
  setExamDuration,
  setAllowReview,
  deleteExam,
} from "@/lib/actions/tutor";
import type { ExamListItem } from "@/lib/exams";
import ConfirmDialog from "@/components/ConfirmDialog";
import FilterBar from "@/components/tutor/exams/FilterBar";
import ExamsToolbar from "@/components/tutor/exams/ExamsToolbar";
import UploadModal from "@/components/tutor/exams/UploadModal";
import ExamCard from "@/components/tutor/exams/ExamCard";
import ExamTableView from "@/components/tutor/exams/ExamTableView";
import { useExamList } from "@/components/tutor/exams/useExamList";

export default function ExamManager({ exams }: { exams: ExamListItem[] }) {
  const router = useRouter();
  const { list, filters, sort, view, hasFilter, setFilters, setSort, setView, clearFilters } =
    useExamList(exams);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const [toDelete, setToDelete] = useState<ExamListItem | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  function act(fn: () => Promise<{ ok: boolean; message: string }>) {
    startTransition(async () => {
      const r = await fn();
      setMsg({ ok: r.ok, text: r.message });
      router.refresh();
    });
  }

  const published = exams.filter((e) => e.status === "published").length;

  return (
    <div className="mt-6 space-y-4">
      <ExamsToolbar
        filters={filters}
        sort={sort}
        view={view}
        onSearch={(q) => setFilters({ ...filters, q })}
        onSort={setSort}
        onView={setView}
        onUpload={() => setUploadOpen(true)}
      />

      <FilterBar filters={filters} onChange={setFilters} />

      {msg && (
        <p
          className={`rounded-xl px-4 py-3 text-sm font-medium ring-1 ${
            msg.ok ? "bg-green-50 text-green-700 ring-green-200" : "bg-red-50 text-red-700 ring-red-100"
          }`}
        >
          {msg.text}
        </p>
      )}

      <h2 className="text-sm font-medium text-muted">
        ชุดข้อสอบทั้งหมด{" "}
        <span className="font-display font-bold tabular-nums text-ink-soft">{exams.length}</span> ชุด ·{" "}
        <span className="font-display font-bold tabular-nums text-ink-soft">{published}</span> เผยแพร่
      </h2>

      {list.length > 0 && view === "table" ? (
        <ExamTableView
          exams={list}
          pending={pending}
          sort={sort}
          onSort={setSort}
          onToggleStatus={(e) =>
            act(() => setExamStatus(e.id, e.status === "published" ? "draft" : "published"))
          }
          onToggleReview={(e, checked) => act(() => setAllowReview(e.id, checked))}
          onDelete={(e) => setToDelete(e)}
        />
      ) : (
        <div className="space-y-3">
          {list.map((e) => (
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

          {list.length === 0 && (
            <div className="rounded-2xl border border-line bg-white px-5 py-14 text-center shadow-card">
            <p className="text-2xl">{exams.length === 0 ? "📄" : "🔍"}</p>
            <p className="mt-2 font-semibold text-ink">
              {exams.length === 0 ? "ยังไม่มีชุดข้อสอบ" : "ไม่พบชุดที่ตรงกับตัวกรอง"}
            </p>
            <p className="mt-1 text-sm text-muted">
              {exams.length === 0
                ? "กด “อัปโหลดชุดใหม่” เพื่อเริ่ม"
                : "ลองล้างตัวกรองหรือค้นด้วยคำอื่น"}
            </p>
            {exams.length === 0 ? (
              <button
                type="button"
                onClick={() => setUploadOpen(true)}
                className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-700"
              >
                อัปโหลดชุดใหม่
              </button>
            ) : (
              hasFilter && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 rounded-lg border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
                >
                  ล้างตัวกรอง
                </button>
              )
            )}
          </div>
        )}
        </div>
      )}

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={(m) => setMsg(m)}
      />

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
