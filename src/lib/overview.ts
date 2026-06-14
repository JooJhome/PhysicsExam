import { createClient } from "@/lib/supabase/server";

/** ภาพรวมสำหรับหน้า /tutor — ดึง+คำนวณฝั่งเซิร์ฟเวอร์ก้อนเดียว */
export type Overview = {
  exams: { total: number; published: number; draft: number };
  students: { total: number; activeThisWeek: number };
  today: { submitted: number; inProgress: number };
  completion: { done: number; total: number; rate: number };
  setup: { done: number; steps: SetupStep[] };
  actionItems: ActionItem[];
  activity: ActivityRow[];
};

export type SetupStep = { key: string; label: string; done: boolean };
export type ActionItem = {
  id: string;
  text: string;
  cta?: { label: string; href: string };
};
export type ActivityRow = {
  id: string;
  name: string;
  initials: string;
  examLabel: string;
  relativeTime: string;
  score: number | null;
  total: number | null;
  passed: boolean | null;
  status: "submitted" | "in_progress" | "expired";
};

const DAY = 86_400_000;
const PASS_RATIO = 0.7; // ≥70% = ผ่านเกณฑ์ (chip เขียว)

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0].slice(0, 2);
  return (parts[0][0] ?? "") + (parts[1][0] ?? "");
}

function relativeThai(iso: string | null, now: number): string {
  if (!iso) return "";
  const diff = now - new Date(iso).getTime();
  if (diff < 60_000) return "เมื่อกี้";
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  const hrs = Math.floor(diff / 3_600_000);
  if (hrs < 24) return `${hrs} ชม.ที่แล้ว`;
  const days = Math.floor(diff / DAY);
  if (days === 1) return "เมื่อวาน";
  return `${days} วันก่อน`;
}

export async function getTutorOverview(): Promise<Overview> {
  const supabase = await createClient();
  const now = Date.now();
  const weekAgo = new Date(now - 7 * DAY).toISOString();

  const [examsRes, studentsRes, assignmentsRes, attemptsRes] = await Promise.all([
    supabase.from("exams").select("id, title, exam_code, status, total_questions, created_at"),
    supabase.from("profiles").select("id, full_name, username").eq("role", "student"),
    supabase.from("assignments").select("id, exam_id, student_id, created_at"),
    supabase
      .from("attempts")
      .select("id, exam_id, student_id, status, started_at, submitted_at, score, total")
      .order("submitted_at", { ascending: false, nullsFirst: false })
      .order("started_at", { ascending: false }),
  ]);

  const exams = examsRes.data ?? [];
  const students = studentsRes.data ?? [];
  const assignments = assignmentsRes.data ?? [];
  const attempts = attemptsRes.data ?? [];

  // ----- lookup maps -----
  const examById = new Map(exams.map((e) => [e.id, e]));
  const studentById = new Map(students.map((s) => [s.id, s]));
  const nameOf = (id: string) => {
    const s = studentById.get(id);
    return s?.full_name?.trim() || s?.username || "ไม่ทราบชื่อ";
  };
  const key = (examId: string, studentId: string) => `${examId}|${studentId}`;

  const submittedKeys = new Set(
    attempts.filter((a) => a.status === "submitted").map((a) => key(a.exam_id, a.student_id))
  );
  const anyAttemptKeys = new Set(attempts.map((a) => key(a.exam_id, a.student_id)));

  // ----- exams -----
  const published = exams.filter((e) => e.status === "published").length;
  const draft = exams.length - published;

  // ----- students active this week -----
  const activeIds = new Set(
    attempts.filter((a) => a.started_at && a.started_at >= weekAgo).map((a) => a.student_id)
  );

  // ----- completion (อัตราการทำเสร็จของงานที่มอบหมาย) -----
  const pending = assignments.filter((a) => !submittedKeys.has(key(a.exam_id, a.student_id))).length;
  const totalAssign = assignments.length;
  const done = totalAssign - pending;
  const rate = totalAssign > 0 ? Math.round((done / totalAssign) * 100) : 0;

  // ----- สัญญาณ "วันนี้" (ไม่บวมตามจำนวนมอบหมาย ใช้ดูความเคลื่อนไหวสด ๆ) -----
  // ขอบเขตวันตามเวลาไทย (UTC+7) ไม่ผูกกับ timezone ของเซิร์ฟเวอร์
  const BKK = 7 * 3_600_000;
  const startTodayIso = new Date(Math.floor((now + BKK) / DAY) * DAY - BKK).toISOString();
  const submittedToday = attempts.filter(
    (a) => a.status === "submitted" && a.submitted_at && a.submitted_at >= startTodayIso
  ).length;
  const inProgressNow = attempts.filter((a) => a.status === "in_progress").length;

  // ใช้สำหรับ setup step "รับผลสอบ"
  const submitted = attempts.filter((a) => a.status === "submitted" && a.score != null);

  // ----- setup steps -----
  const steps: SetupStep[] = [
    { key: "publish", label: "เผยแพร่ข้อสอบ", done: published > 0 },
    { key: "students", label: "เพิ่มนักเรียน", done: students.length > 0 },
    { key: "assign", label: "มอบหมายชุดสอบ", done: assignments.length > 0 },
    { key: "results", label: "รับผลสอบ", done: submitted.length > 0 },
  ];
  const setupDone = steps.filter((s) => s.done).length;

  // ----- action items -----
  const actionItems: ActionItem[] = [];
  if (draft > 0) {
    actionItems.push({
      id: "drafts",
      text: `${draft} ชุด ยังไม่เผยแพร่ — นักเรียนยังเข้าทำไม่ได้`,
      cta: { label: "เผยแพร่", href: "/tutor/exams" },
    });
  }
  // นักเรียนที่ถูกมอบหมายแต่ยังไม่เปิดลิงก์เลย → เก็บ assignment ที่เก่าสุดต่อคน
  const notOpenedByStudent = new Map<string, string>(); // studentId -> oldest created_at
  for (const a of assignments) {
    if (anyAttemptKeys.has(key(a.exam_id, a.student_id))) continue;
    const prev = notOpenedByStudent.get(a.student_id);
    if (!prev || a.created_at < prev) notOpenedByStudent.set(a.student_id, a.created_at);
  }
  [...notOpenedByStudent.entries()]
    .sort((a, b) => a[1].localeCompare(b[1]))
    .slice(0, 3)
    .forEach(([studentId, created]) => {
      const days = Math.max(0, Math.floor((now - new Date(created).getTime()) / DAY));
      const when = days === 0 ? "วันนี้" : `${days} วันก่อน`;
      actionItems.push({
        id: `notopened-${studentId}`,
        text: `${nameOf(studentId)} ยังไม่เปิดลิงก์ (มอบหมาย ${when})`,
        cta: { label: "ดูการมอบหมาย", href: "/tutor/assign" },
      });
    });

  // ----- activity feed (5 ล่าสุด, ข้าม attempt ที่ค้างไว้นาน ๆ ก็ยังแสดง) -----
  const activity: ActivityRow[] = attempts.slice(0, 5).map((a) => {
    const exam = examById.get(a.exam_id);
    const name = nameOf(a.student_id);
    const ratio = a.score != null && a.total ? a.score / a.total : null;
    return {
      id: a.id,
      name,
      initials: initialsOf(name),
      examLabel: exam?.exam_code || exam?.title || "—",
      relativeTime: relativeThai(a.submitted_at ?? a.started_at, now),
      score: a.status === "submitted" ? a.score : null,
      total: a.status === "submitted" ? a.total : null,
      passed: ratio == null ? null : ratio >= PASS_RATIO,
      status: a.status as ActivityRow["status"],
    };
  });

  return {
    exams: { total: exams.length, published, draft },
    students: { total: students.length, activeThisWeek: activeIds.size },
    today: { submitted: submittedToday, inProgress: inProgressNow },
    completion: { done, total: totalAssign, rate },
    setup: { done: setupDone, steps },
    actionItems,
    activity,
  };
}
