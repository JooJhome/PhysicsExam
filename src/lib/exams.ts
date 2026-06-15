import { createClient } from "@/lib/supabase/server";

export type ExamType = "CU-ATS" | "TBAT" | null;
export type ExamKind = "exam" | "practice";

export type ExamListItem = {
  id: string;
  title: string;
  code: string;
  kind: ExamKind;
  subjects: string[]; // ป้ายกำกับ/หมวด หลายอันได้ (เช่น ["CU-ATS","TBAT"], ["ฟิสิกส์ ม.6"])
  status: "draft" | "published" | "archived";
  questionCount: number;
  durationMin: number;
  solutionVisible: boolean;
  assignedCount: number;
  submittedCount: number;
  avgScore: number | null; // คะแนนดิบเฉลี่ย (เต็ม = questionCount)
  avgPercent: number | null; // คะแนนเฉลี่ยเป็น %
  createdAt: string;
};

/** วิชาเดิม — derive จาก prefix ของรหัสชุด (ใช้เป็น fallback เมื่อ subject ว่าง) */
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
        "id, title, exam_code, kind, subjects, duration_minutes, total_questions, status, allow_review, created_at"
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
    const avg = sub && sub.count > 0 ? sub.sum / sub.count : null;
    // ใช้ subjects[] ; ถ้าว่าง fallback เป็นวิชาที่เดาจากรหัส (ของชุดเก่า)
    const raw = (e.subjects as string[] | null) ?? [];
    const derived = deriveType(e.exam_code);
    const subjects = raw.length > 0 ? raw : derived ? [derived] : [];
    return {
      id: e.id,
      title: e.title,
      code: e.exam_code,
      kind: (e.kind as ExamKind) ?? "exam",
      subjects,
      status: e.status as "draft" | "published" | "archived",
      questionCount: e.total_questions,
      durationMin: e.duration_minutes,
      solutionVisible: e.allow_review,
      assignedCount: assignedBy.get(e.id) ?? 0,
      submittedCount: sub?.count ?? 0,
      avgScore: avg != null ? Math.round(avg) : null,
      avgPercent: avg != null && e.total_questions > 0 ? Math.round((avg / e.total_questions) * 100) : null,
      createdAt: e.created_at,
    };
  });
}
