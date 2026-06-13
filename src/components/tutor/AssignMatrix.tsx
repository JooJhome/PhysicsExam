"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleAssignment, assignExamToAll } from "@/lib/actions/tutor";

interface Student {
  id: string;
  username: string;
  full_name: string | null;
}
interface Exam {
  id: string;
  title: string;
  exam_code: string;
  status: string;
}
interface Assignment {
  exam_id: string;
  student_id: string;
}

export default function AssignMatrix({
  students,
  exams,
  assignments,
}: {
  students: Student[];
  exams: Exam[];
  assignments: Assignment[];
}) {
  const router = useRouter();
  const [set, setSet] = useState<Set<string>>(
    new Set(assignments.map((a) => `${a.exam_id}:${a.student_id}`))
  );
  const [, startTransition] = useTransition();

  function key(examId: string, studentId: string) {
    return `${examId}:${studentId}`;
  }

  function toggle(examId: string, studentId: string) {
    const k = key(examId, studentId);
    const assign = !set.has(k);
    setSet((prev) => {
      const next = new Set(prev);
      if (assign) next.add(k);
      else next.delete(k);
      return next;
    });
    startTransition(async () => {
      await toggleAssignment(examId, studentId, assign);
    });
  }

  function allForExam(examId: string) {
    setSet((prev) => {
      const next = new Set(prev);
      students.forEach((s) => next.add(key(examId, s.id)));
      return next;
    });
    startTransition(async () => {
      await assignExamToAll(examId);
      router.refresh();
    });
  }

  if (students.length === 0 || exams.length === 0) {
    return (
      <div className="mt-8 rounded-3xl border border-dashed border-line bg-white/60 px-6 py-14 text-center">
        <p className="text-2xl">🗂️</p>
        <p className="mt-2 font-semibold text-ink">ยังมอบหมายไม่ได้</p>
        <p className="mt-1 text-sm text-muted">
          ต้องมีนักเรียนและข้อสอบอย่างน้อยอย่างละ 1 ชุดก่อน
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 overflow-auto rounded-3xl border border-line bg-white shadow-card">
      <table className="text-left">
        <thead>
          <tr className="border-b border-line bg-brand-50/70">
            <th className="sticky left-0 z-10 bg-brand-50 px-5 py-4 text-sm font-semibold text-brand-800">
              นักเรียน
            </th>
            {exams.map((e) => (
              <th key={e.id} className="px-4 py-3 text-center align-bottom">
                <div className="whitespace-nowrap font-display text-xs font-bold text-brand-800">
                  {e.exam_code}
                </div>
                {e.status !== "published" && (
                  <div className="mt-0.5 text-[11px] font-semibold text-accent-700">
                    (ร่าง)
                  </div>
                )}
                <button
                  onClick={() => allForExam(e.id)}
                  className="mt-1.5 rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-brand-700 ring-1 ring-brand-200 transition-colors hover:bg-brand-600 hover:text-white hover:ring-brand-600"
                >
                  ทั้งหมด
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {students.map((s) => (
            <tr key={s.id} className="transition-colors hover:bg-canvas/70">
              <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-5 py-3.5">
                <span className="font-display font-semibold text-ink">
                  {s.username}
                </span>
                {s.full_name && (
                  <span className="ml-2 text-sm text-muted">{s.full_name}</span>
                )}
              </td>
              {exams.map((e) => (
                <td key={e.id} className="px-4 py-3.5 text-center">
                  <input
                    type="checkbox"
                    checked={set.has(key(e.id, s.id))}
                    onChange={() => toggle(e.id, s.id)}
                    className="h-5 w-5 cursor-pointer accent-brand-600"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
