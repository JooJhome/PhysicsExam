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
      <p className="mt-6 rounded-lg bg-white px-4 py-6 text-center text-sm text-gray-400 ring-1 ring-gray-200">
        ต้องมีนักเรียนและข้อสอบอย่างน้อยอย่างละ 1 ก่อน
      </p>
    );
  }

  return (
    <div className="mt-4 overflow-auto rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
      <table className="text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="sticky left-0 z-10 bg-white px-4 py-2 text-left text-gray-600">
              นักเรียน
            </th>
            {exams.map((e) => (
              <th key={e.id} className="px-3 py-2 text-center align-bottom">
                <div className="whitespace-nowrap text-xs font-medium text-gray-700">
                  {e.exam_code}
                </div>
                {e.status !== "published" && (
                  <div className="text-[10px] text-amber-600">(ร่าง)</div>
                )}
                <button
                  onClick={() => allForExam(e.id)}
                  className="mt-1 text-[10px] text-blue-600 hover:underline"
                >
                  ทั้งหมด
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {students.map((s) => (
            <tr key={s.id}>
              <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-4 py-2 text-gray-900">
                {s.full_name || s.username}
                <span className="ml-1 text-xs text-gray-400">{s.username}</span>
              </td>
              {exams.map((e) => (
                <td key={e.id} className="px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={set.has(key(e.id, s.id))}
                    onChange={() => toggle(e.id, s.id)}
                    className="h-4 w-4 cursor-pointer"
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
