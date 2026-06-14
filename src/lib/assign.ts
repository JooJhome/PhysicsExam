import { createClient } from "@/lib/supabase/server";
import { deriveType } from "@/lib/exams";

export type AssignExamStatus = "draft" | "published" | "archived";

export type AssignExam = {
  id: string;
  name: string;
  code: string;
  kind: "exam" | "practice";
  subjects: string[]; // ป้ายกำกับหลายอัน (เหมือนหน้าข้อสอบ)
  status: AssignExamStatus;
  durationMin: number;
  assignedCount: number;
};

export type AssignOverview = {
  totalStudents: number;
  exams: AssignExam[];
};

export async function getAssignExams(): Promise<AssignOverview> {
  const supabase = await createClient();
  const [examsRes, assignRes, studentsRes] = await Promise.all([
    supabase
      .from("exams")
      .select("id, title, exam_code, kind, subjects, status, duration_minutes, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("assignments").select("exam_id"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
  ]);

  const exams = examsRes.data ?? [];
  const assignedBy = new Map<string, number>();
  for (const a of assignRes.data ?? []) {
    assignedBy.set(a.exam_id, (assignedBy.get(a.exam_id) ?? 0) + 1);
  }

  return {
    totalStudents: studentsRes.count ?? 0,
    exams: exams.map((e) => {
      const raw = (e.subjects as string[] | null) ?? [];
      const derived = deriveType(e.exam_code);
      return {
        id: e.id,
        name: e.title,
        code: e.exam_code,
        kind: (e.kind as "exam" | "practice") ?? "exam",
        subjects: raw.length > 0 ? raw : derived ? [derived] : [],
        status: e.status as AssignExamStatus,
        durationMin: e.duration_minutes,
        assignedCount: assignedBy.get(e.id) ?? 0,
      };
    }),
  };
}
