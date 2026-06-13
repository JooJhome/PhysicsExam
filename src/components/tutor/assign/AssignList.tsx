"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AssignExam, AssignOverview } from "@/lib/assign";
import {
  getExamAssignment,
  saveAssignment,
  type ExamAssignmentDetail,
  type SaveAssignmentResult,
} from "@/lib/actions/tutor";
import ExamAssignRow from "./ExamAssignRow";
import AssignDrawer, { type UndoSnapshot } from "./AssignDrawer";

type Filter = "active" | "CU-ATS" | "TBAT" | "archived";

const CHIPS: { key: Filter; label: string }[] = [
  { key: "active", label: "กำลังใช้" },
  { key: "CU-ATS", label: "CU-ATS" },
  { key: "TBAT", label: "TBAT" },
  { key: "archived", label: "คลัง" },
];

export default function AssignList({ data }: { data: AssignOverview }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("active");
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState<ExamAssignmentDetail | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; undo: UndoSnapshot } | null>(null);
  const [, startTransition] = useTransition();

  const exams = useMemo(() => {
    const term = q.trim().toLowerCase();
    return data.exams.filter((e) => {
      if (filter === "archived") {
        if (e.status !== "archived") return false;
      } else if (e.status === "archived") {
        return false; // ตัวกรองอื่นไม่รวมคลัง
      }
      if (filter === "CU-ATS" && e.type !== "CU-ATS") return false;
      if (filter === "TBAT" && e.type !== "TBAT") return false;
      if (term && !`${e.name} ${e.code}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [data.exams, filter, q]);

  async function openDrawer(exam: AssignExam) {
    setLoadingId(exam.id);
    const d = await getExamAssignment(exam.id);
    setLoadingId(null);
    setDetail(d);
  }

  function onSaved(result: SaveAssignmentResult, undo: UndoSnapshot) {
    router.refresh();
    if (result.ok && (result.added > 0 || result.removed > 0)) {
      setToast({ text: result.message, undo });
      setTimeout(() => setToast(null), 9000);
    }
  }

  function doUndo() {
    if (!toast) return;
    const u = toast.undo;
    setToast(null);
    startTransition(async () => {
      await saveAssignment(u.examId, u.studentIds, u.window, u.durationOverride);
      router.refresh();
    });
  }

  return (
    <div className="mt-8">
      {/* chips + search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">
          {CHIPS.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setFilter(c.key)}
              aria-pressed={filter === c.key}
              className={`min-h-[40px] flex-none rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                filter === c.key
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-line bg-white text-ink-soft hover:border-brand-200 hover:text-brand-700"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ค้นหาชุด"
          aria-label="ค้นหาชุดสอบ"
          className="w-full rounded-xl border border-line bg-white px-4 py-3 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 sm:w-64"
        />
      </div>

      {/* list */}
      <div className="mt-5 space-y-3">
        {exams.map((e) => (
          <div key={e.id} className={loadingId === e.id ? "opacity-60" : ""}>
            <ExamAssignRow exam={e} totalStudents={data.totalStudents} onOpen={() => openDrawer(e)} />
          </div>
        ))}
        {exams.length === 0 && (
          <div className="rounded-2xl border border-line bg-white px-5 py-14 text-center shadow-card">
            <p className="text-2xl">🗂️</p>
            <p className="mt-2 font-semibold text-ink">
              {data.exams.length === 0 ? "ยังไม่มีชุดข้อสอบ" : "ไม่พบชุดในตัวกรองนี้"}
            </p>
            <p className="mt-1 text-sm text-muted">
              {data.totalStudents === 0
                ? "เพิ่มนักเรียนก่อนจึงจะมอบหมายได้"
                : "ลองเปลี่ยนตัวกรองหรือค้นด้วยคำอื่น"}
            </p>
          </div>
        )}
      </div>

      {detail && (
        <AssignDrawer detail={detail} onClose={() => setDetail(null)} onSaved={onSaved} />
      )}

      {/* toast + undo */}
      {toast && (
        <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
          <div className="flex items-center gap-3 rounded-2xl border border-line bg-ink px-4 py-3 text-white shadow-lift">
            <span className="text-sm">{toast.text}</span>
            <button
              type="button"
              onClick={doUndo}
              className="rounded-lg px-2 py-1 text-sm font-bold text-accent-200 transition-colors hover:bg-white/10"
            >
              เลิกทำ
            </button>
            <button
              type="button"
              onClick={() => setToast(null)}
              aria-label="ปิด"
              className="text-white/60 transition-colors hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
