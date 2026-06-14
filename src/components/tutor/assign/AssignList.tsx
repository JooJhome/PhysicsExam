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

type Lifecycle = "active" | "archived";

const LIFECYCLE_CHIPS: { key: Lifecycle; label: string }[] = [
  { key: "active", label: "กำลังใช้" },
  { key: "archived", label: "คลัง" },
];

function chipClass(active: boolean) {
  return `min-h-[40px] flex-none rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors ${
    active
      ? "border-brand-600 bg-brand-600 text-white"
      : "border-line bg-white text-ink-soft hover:border-brand-200 hover:text-brand-700"
  }`;
}

export default function AssignList({ data }: { data: AssignOverview }) {
  const router = useRouter();
  const [lifecycle, setLifecycle] = useState<Lifecycle>("active");
  const [subject, setSubject] = useState(""); // "" = ทุกป้าย
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState<ExamAssignmentDetail | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; undo: UndoSnapshot } | null>(null);
  const [, startTransition] = useTransition();

  // ป้ายทั้งหมด (union ของทุกชุด) — dynamic เหมือนหน้าข้อสอบ
  const subjects = useMemo(
    () => [...new Set(data.exams.flatMap((e) => e.subjects))].sort((a, b) => a.localeCompare(b, "th")),
    [data.exams]
  );

  const exams = useMemo(() => {
    const term = q.trim().toLowerCase();
    return data.exams.filter((e) => {
      const archived = e.status === "archived";
      if (lifecycle === "archived" ? !archived : archived) return false;
      if (subject && !e.subjects.includes(subject)) return false; // membership
      if (term && !`${e.name} ${e.code}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [data.exams, lifecycle, subject, q]);

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
      await saveAssignment(u.examId, u.studentIds, u.window, u.durationOverride, u.untimed);
      router.refresh();
    });
  }

  return (
    <div className="mt-6 space-y-4">
      {/* toolbar: search (flex-1) */}
      <div className="relative">
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
          onChange={(e) => setQ(e.target.value)}
          placeholder="ค้นหาชื่อชุดหรือรหัส"
          aria-label="ค้นหาชุดสอบ"
          className="w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-4 text-base transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
      </div>

      {/* filter chips — สถานะ (lifecycle) + ป้ายกำกับ dynamic (เหมือนหน้าข้อสอบ) */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">
        {LIFECYCLE_CHIPS.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setLifecycle(c.key)}
            aria-pressed={lifecycle === c.key}
            className={chipClass(lifecycle === c.key)}
          >
            {c.label}
          </button>
        ))}

        {subjects.length > 0 && (
          <span className="mx-1 hidden w-px self-stretch bg-line sm:block" />
        )}
        {subjects.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSubject(subject === s ? "" : s)}
            aria-pressed={subject === s}
            className={chipClass(subject === s)}
          >
            {s}
          </button>
        ))}
      </div>

      {/* list */}
      <div className="space-y-3">
        {exams.map((e, i) => (
          <div
            key={e.id}
            style={{ animationDelay: `${Math.min(i * 60, 300)}ms` }}
            className={`motion-safe:animate-rise-in ${loadingId === e.id ? "opacity-60" : ""}`}
          >
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
