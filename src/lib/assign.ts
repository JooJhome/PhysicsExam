import { createClient } from "@/lib/supabase/server";
import { deriveType, type ExamType } from "@/lib/exams";

export type AssignExamStatus = "draft" | "published" | "archived";

export type AssignExam = {
  id: string;
  name: string;
  code: string;
  type: ExamType;
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
      .select("id, title, exam_code, status, duration_minutes, created_at")
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
    exams: exams.map((e) => ({
      id: e.id,
      name: e.title,
      code: e.exam_code,
      type: deriveType(e.exam_code),
      status: e.status as AssignExamStatus,
      durationMin: e.duration_minutes,
      assignedCount: assignedBy.get(e.id) ?? 0,
    })),
  };
}
