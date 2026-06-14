import { createClient } from "@/lib/supabase/server";

export type ExamType = "CU-ATS" | "TBAT" | null;

export type ExamListItem = {
  id: string;
  title: string;
  code: string;
  type: ExamType;
  status: "draft" | "published";
  questionCount: number;
  durationMin: number;
  solutionVisible: boolean;
  assignedCount: number;
  submittedCount: number;
  avgScore: number | null;
  createdAt: string;
};

/** ประเภทชุด — derive จาก prefix ของรหัสชุด (DB ไม่มีคอลัมน์ type) */
export function deriveType(code: string): ExamType {
  const c = code.toUpperCase().replace(/[\s_]/g, "");
  if (c.startsWith("CUATS")) return "CU-ATS";
  if (c.startsWith("TBAT")) return "TBAT";
  return null;
}

export async function getTutorExams(): Promise<ExamListItem[]> {
  const supabase = await createClient();

  const [examsRes, assignRes, attemptRes] = await Promise.all([
    supabase
      .from("exams")
      .select(
        "id, title, exam_code, duration_minutes, total_questions, status, allow_review, created_at"
      )
      .order("created_at", { ascending: false }),
    supabase.from("assignments").select("exam_id"),
    supabase.from("attempts").select("exam_id, status, score"),
  ]);

  const exams = examsRes.data ?? [];
  const assignments = assignRes.data ?? [];
  const attempts = attemptRes.data ?? [];

  const assignedBy = new Map<string, number>();
  for (const a of assignments) {
    assignedBy.set(a.exam_id, (assignedBy.get(a.exam_id) ?? 0) + 1);
  }

  const submittedBy = new Map<string, { count: number; sum: number }>();
  for (const at of attempts) {
    if (at.status !== "submitted" || at.score == null) continue;
    const cur = submittedBy.get(at.exam_id) ?? { count: 0, sum: 0 };
    cur.count += 1;
    cur.sum += at.score;
    submittedBy.set(at.exam_id, cur);
  }

  return exams.map((e) => {
    const sub = submittedBy.get(e.id);
    return {
      id: e.id,
      title: e.title,
      code: e.exam_code,
      type: deriveType(e.exam_code),
      status: e.status as "draft" | "published",
      questionCount: e.total_questions,
      durationMin: e.duration_minutes,
      solutionVisible: e.allow_review,
      assignedCount: assignedBy.get(e.id) ?? 0,
      submittedCount: sub?.count ?? 0,
      avgScore: sub && sub.count > 0 ? Math.round(sub.sum / sub.count) : null,
      createdAt: e.created_at,
    };
  });
}
