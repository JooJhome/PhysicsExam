import { createClient } from "@/lib/supabase/server";
import { defaultPassingFor } from "@/lib/results";

export type ReportRow = {
  examCode: string;
  examTitle: string;
  score: number;
  total: number;
  percent: number;
  passed: boolean;
  submittedAt: string | null;
  dateLabel: string;
};

export type StudentReport = {
  name: string;
  username: string;
  examsTaken: number;
  passedCount: number;
  avgPercent: number | null;
  trend: "up" | "down" | "flat" | null;
  rows: ReportRow[]; // เรียงใหม่→เก่า (ตาราง)
  trendPoints: { pct: number; passed: boolean; code: string }[]; // เก่า→ใหม่ (กราฟ)
  generatedAt: string;
} | null;

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("th-TH", {
    timeZone: "Asia/Bangkok",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export async function getStudentReport(studentId: string): Promise<StudentReport> {
  const supabase = await createClient();
  const [profileRes, examsRes, attemptsRes] = await Promise.all([
    supabase.from("profiles").select("username, full_name, role").eq("id", studentId).single(),
    supabase.from("exams").select("id, exam_code, title, kind, total_questions, passing_score"),
    supabase
      .from("attempts")
      .select("exam_id, status, score, total, submitted_at")
      .eq("student_id", studentId)
      .eq("status", "submitted"),
  ]);

  const profile = profileRes.data;
  if (!profile || profile.role !== "student") return null;

  // เฉพาะชุดสอบ (graded) — ตัดแบบฝึกหัด
  const examById = new Map(
    (examsRes.data ?? []).filter((e) => e.kind !== "practice").map((e) => [e.id, e])
  );

  const subs = (attemptsRes.data ?? [])
    .filter((a) => examById.has(a.exam_id) && a.score != null)
    .map((a) => {
      const e = examById.get(a.exam_id)!;
      const total = a.total ?? e.total_questions ?? 30;
      const percent = total ? Math.round(((a.score ?? 0) / total) * 100) : 0;
      const pass = e.passing_score ?? defaultPassingFor(total);
      return {
        examCode: e.exam_code,
        examTitle: e.title,
        score: a.score ?? 0,
        total,
        percent,
        passed: (a.score ?? 0) >= pass,
        submittedAt: a.submitted_at,
        dateLabel: fmtDate(a.submitted_at),
      };
    });

  const byTimeAsc = [...subs].sort((a, b) =>
    (a.submittedAt ?? "").localeCompare(b.submittedAt ?? "")
  );
  const pcts = byTimeAsc.map((s) => s.percent);
  const avgPercent = pcts.length
    ? Math.round(pcts.reduce((x, y) => x + y, 0) / pcts.length)
    : null;
  let trend: "up" | "down" | "flat" | null = null;
  if (pcts.length >= 2) {
    const d = pcts[pcts.length - 1] - pcts[pcts.length - 2];
    trend = d > 3 ? "up" : d < -3 ? "down" : "flat";
  }

  return {
    name: profile.full_name?.trim() || profile.username,
    username: profile.username,
    examsTaken: subs.length,
    passedCount: subs.filter((s) => s.passed).length,
    avgPercent,
    trend,
    rows: [...subs].sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? "")),
    trendPoints: byTimeAsc.map((s) => ({ pct: s.percent, passed: s.passed, code: s.examCode })),
    generatedAt: new Date().toLocaleString("th-TH", {
      timeZone: "Asia/Bangkok",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}
