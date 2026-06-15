import { createClient } from "@/lib/supabase/server";
import { deriveType, type ExamType } from "@/lib/exams";

/** เกณฑ์ผ่านกลาง = 50% (คงที่; แก้ต่อชุดได้ผ่าน exams.passing_score) */
export const DEFAULT_PASS_PERCENT = 0.5;
export function defaultPassingFor(total: number): number {
  return Math.ceil((total || 30) * DEFAULT_PASS_PERCENT);
}
/** เฉลี่ยต่ำกว่านี้ = ผิดปกติ (ต่ำกว่าการเดาสุ่ม 20% ของ MCQ 5 ตัวเลือก) */
const ANOMALY_PERCENT = 15;

export type SubmissionRow = {
  attemptId: string;
  studentId: string;
  studentName: string;
  initials: string;
  examId: string;
  examCode: string;
  examTitle: string;
  status: "submitted" | "in_progress";
  score: number | null;
  total: number;
  percent: number | null;
  submittedAt: string | null;
  startedAt: string;
  effectivePassing: number;
  passed: boolean | null;
};

export type ExamSummary = {
  examId: string;
  examCode: string;
  examTitle: string;
  type: ExamType;
  total: number;
  avg: number | null;
  avgPercent: number | null;
  distribution: number[]; // 10 ช่วงละ 10%: 0-10,10-20,…,90-100 %
  submitted: number;
  assigned: number;
  passRate: number | null;
  anomalyFlag: boolean;
  passingScore: number;
  isDefault: boolean;
};

export type StudentSummary = {
  studentId: string;
  username: string;
  displayName: string | null;
  initials: string;
  assignedCount: number;
  examsTaken: number;
  avgPercent: number | null;
  trend: "up" | "down" | "flat" | null;
  lastActiveAt: string | null;
};

export type ResultsData = {
  tiles: { submitted: number; inProgress: number; notStarted: number; avgPercent: number | null };
  submissions: SubmissionRow[];
  exams: ExamSummary[];
  students: StudentSummary[];
  groups: { id: string; name: string }[];
  studentGroups: Record<string, string[]>; // studentId → groupId[]
};

function initialsOf(name: string): string {
  return (name.trim().charAt(0) || "?").toUpperCase();
}

export async function getResults(): Promise<ResultsData> {
  const supabase = await createClient();
  const [examsRes, studentsRes, assignRes, attemptRes, groupsRes, membersRes] = await Promise.all([
    supabase
      .from("exams")
      .select("id, title, exam_code, kind, total_questions, passing_score, status"),
    supabase.from("profiles").select("id, username, full_name").eq("role", "student"),
    supabase.from("assignments").select("exam_id, student_id"),
    supabase
      .from("attempts")
      .select("id, exam_id, student_id, status, score, total, started_at, submitted_at")
      .order("submitted_at", { ascending: false, nullsFirst: false })
      .order("started_at", { ascending: false }),
    supabase.from("groups").select("id, name").order("name"),
    supabase.from("group_members").select("group_id, student_id"),
  ]);

  const studentGroups: Record<string, string[]> = {};
  for (const m of membersRes.data ?? []) {
    (studentGroups[m.student_id] ??= []).push(m.group_id);
  }
  const groupCatalog = (groupsRes.data ?? []).map((g) => ({ id: g.id, name: g.name }));

  const students = studentsRes.data ?? [];
  // ผลสอบ = สถิติ graded เท่านั้น → ตัดแบบฝึกหัด (kind='practice') ออกทั้งหมด
  const exams = (examsRes.data ?? []).filter((e) => e.kind !== "practice");
  const gradedIds = new Set(exams.map((e) => e.id));
  const assignments = (assignRes.data ?? []).filter((a) => gradedIds.has(a.exam_id));
  const attempts = (attemptRes.data ?? []).filter((a) => gradedIds.has(a.exam_id));

  const examById = new Map(exams.map((e) => [e.id, e]));
  const studentById = new Map(students.map((s) => [s.id, s]));
  const nameOf = (id: string) => {
    const s = studentById.get(id);
    return s?.full_name?.trim() || s?.username || "ไม่ทราบชื่อ";
  };
  const effPassing = (examId: string) => {
    const e = examById.get(examId);
    const total = e?.total_questions ?? 30;
    return e?.passing_score ?? defaultPassingFor(total);
  };

  // ---------- submissions ----------
  const submissions: SubmissionRow[] = attempts
    .filter((a) => a.status === "submitted" || a.status === "in_progress")
    .map((a) => {
      const e = examById.get(a.exam_id);
      const total = a.total ?? e?.total_questions ?? 30;
      const name = nameOf(a.student_id);
      const percent =
        a.status === "submitted" && a.score != null && total ? Math.round((a.score / total) * 100) : null;
      const pass = effPassing(a.exam_id);
      return {
        attemptId: a.id,
        studentId: a.student_id,
        studentName: name,
        initials: initialsOf(name),
        examId: a.exam_id,
        examCode: e?.exam_code ?? "—",
        examTitle: e?.title ?? "—",
        status: a.status as "submitted" | "in_progress",
        score: a.status === "submitted" ? a.score : null,
        total,
        percent,
        submittedAt: a.submitted_at,
        startedAt: a.started_at,
        effectivePassing: pass,
        passed: a.status === "submitted" && a.score != null ? a.score >= pass : null,
      };
    });

  // ---------- tiles ----------
  const submittedAttempts = attempts.filter((a) => a.status === "submitted" && a.score != null);
  const inProgress = attempts.filter((a) => a.status === "in_progress").length;
  const attemptKey = new Set(attempts.map((a) => `${a.exam_id}|${a.student_id}`));
  const notStarted = assignments.filter((a) => !attemptKey.has(`${a.exam_id}|${a.student_id}`)).length;
  const avgPercentAll =
    submittedAttempts.length > 0
      ? Math.round(
          (submittedAttempts.reduce((s, a) => s + (a.score ?? 0) / (a.total || 30), 0) /
            submittedAttempts.length) *
            100
        )
      : null;

  // ---------- exam summaries ----------
  const assignedBy = new Map<string, number>();
  for (const a of assignments) assignedBy.set(a.exam_id, (assignedBy.get(a.exam_id) ?? 0) + 1);

  const examSummaries: ExamSummary[] = exams
    .map((e) => {
      const subs = submittedAttempts.filter((a) => a.exam_id === e.id);
      const total = e.total_questions ?? 30;
      const dist = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // 10 ช่วงละ 10%
      let sumPct = 0;
      let passCount = 0;
      const pass = e.passing_score ?? defaultPassingFor(total);
      for (const a of subs) {
        const pct = ((a.score ?? 0) / (a.total || total)) * 100;
        sumPct += pct;
        const bucket = Math.min(9, Math.floor(pct / 10));
        dist[bucket]++;
        if ((a.score ?? 0) >= pass) passCount++;
      }
      const avgPercent = subs.length ? Math.round(sumPct / subs.length) : null;
      return {
        examId: e.id,
        examCode: e.exam_code,
        examTitle: e.title,
        type: deriveType(e.exam_code),
        total,
        avg: subs.length ? Math.round((sumPct / subs.length / 100) * total) : null,
        avgPercent,
        distribution: dist,
        submitted: subs.length,
        assigned: assignedBy.get(e.id) ?? 0,
        passRate: subs.length ? Math.round((passCount / subs.length) * 100) : null,
        anomalyFlag: subs.length >= 2 && avgPercent != null && avgPercent < ANOMALY_PERCENT,
        passingScore: pass,
        isDefault: e.passing_score == null,
      };
    })
    .filter((s) => s.submitted > 0 || s.assigned > 0);

  // ---------- student summaries ----------
  // มอบหมายต่อคน (เฉพาะ graded — assignments ถูกกรอง practice ออกแล้ว)
  const assignedByStudent = new Map<string, number>();
  for (const a of assignments)
    assignedByStudent.set(a.student_id, (assignedByStudent.get(a.student_id) ?? 0) + 1);

  const studentSummaries: StudentSummary[] = students
    .map((s) => {
      const subs = submittedAttempts
        .filter((a) => a.student_id === s.id)
        .sort((a, b) => (a.submitted_at ?? "").localeCompare(b.submitted_at ?? ""));
      const name = s.full_name?.trim() || s.username;
      const pcts = subs.map((a) => ((a.score ?? 0) / (a.total || 30)) * 100);
      const avgPercent = pcts.length ? Math.round(pcts.reduce((x, y) => x + y, 0) / pcts.length) : null;
      let trend: StudentSummary["trend"] = null;
      if (pcts.length >= 2) {
        const diff = pcts[pcts.length - 1] - pcts[pcts.length - 2];
        trend = diff > 3 ? "up" : diff < -3 ? "down" : "flat";
      }
      const lastActiveAt = subs.length ? subs[subs.length - 1].submitted_at : null;
      return {
        studentId: s.id,
        username: s.username,
        displayName: s.full_name?.trim() || null,
        initials: initialsOf(name),
        assignedCount: assignedByStudent.get(s.id) ?? 0,
        examsTaken: subs.length,
        avgPercent,
        trend,
        lastActiveAt,
      };
    })
    .filter((s) => s.examsTaken > 0);

  return {
    tiles: { submitted: submittedAttempts.length, inProgress, notStarted, avgPercent: avgPercentAll },
    submissions,
    exams: examSummaries,
    students: studentSummaries,
    groups: groupCatalog,
    studentGroups,
  };
}
