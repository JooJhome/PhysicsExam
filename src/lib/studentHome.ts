import { createClient } from "@/lib/supabase/server";

export type ExamStatus = "not_started" | "in_progress" | "submitted";

export type StudentExamCard = {
  examId: string;
  code: string;
  kind: "exam" | "practice";
  title: string;
  questionCount: number;
  durationMin: number;
  untimed: boolean;
  status: ExamStatus;
  // availability (จากการมอบหมาย)
  openAt: string | null;
  deadline: string | null; // close_at
  notYetOpen: boolean; // ก่อน open_at → ยังเริ่มไม่ได้
  closed: boolean; // เลย close_at → หมดสิทธิ์เริ่มใหม่
  urgent: boolean; // deadline ใกล้ (<24 ชม.) — ป้ายแดง
  availabilityLabel: string | null; // ป้ายช่วงเวลา (format ฝั่ง server กัน hydration)
  // in_progress
  remainingMin: number | null; // คำนวณจาก started_at + duration (null = ไม่จับเวลา)
  remainingLabel: string | null; // "เหลือ 34 นาที" / "หมดเวลา — ส่งได้เลย" / "ไม่จับเวลา"
  submittedLabel: string | null; // "ส่งเมื่อ 13 มิ.ย."
  // submitted
  score: number | null;
  total: number | null;
  percent: number | null;
  passed: boolean | null; // exam เท่านั้น (practice = null)
  submittedAt: string | null;
  // review
  canReview: boolean; // กดดูเฉลยได้ตอนนี้
  reviewClosed: boolean; // เฉลยปิด (allow_review=false)
  reviewedAlready: boolean; // ดูเฉลยไปแล้ว (review-once)
};

export type StudentHomeData = {
  todo: StudentExamCard[];
  done: StudentExamCard[];
  // ความคืบหน้า — ฐานเดียวกัน: ชุดสอบ (exam) ที่ได้รับมอบหมาย
  doneCount: number;
  assignedCount: number;
  percent: number;
};

type Row = {
  exam_id: string;
  title: string;
  exam_code: string;
  kind: "exam" | "practice";
  duration_minutes: number;
  total_questions: number;
  passing_score: number | null;
  score: number | null;
  total: number | null;
  submitted_at: string | null;
  started_at: string | null;
  attempt_status: string | null;
  reviewed_at: string | null;
  allow_review: boolean | null;
  untimed: boolean;
  open_at: string | null;
  close_at: string | null;
  answered: number;
};

const DAY_MS = 86_400_000;

function defaultPassing(total: number): number {
  return Math.ceil((total || 30) * 0.5);
}

function fmtThai(iso: string, withTime: boolean): string {
  return new Date(iso).toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    day: "numeric",
    month: "short",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

// ระยะเวลาคร่าวๆ จากตอนนี้ → iso (เช่น "2 ชม.", "35 นาที", "3 วัน")
function relativeUntil(iso: string, now: number): string {
  const diff = new Date(iso).getTime() - now;
  const mins = Math.round(diff / 60_000);
  if (mins < 60) return `${Math.max(1, mins)} นาที`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} ชม.`;
  return `${Math.round(hrs / 24)} วัน`;
}

function normalize(r: Row, now: number): StudentExamCard {
  const isPractice = r.kind === "practice";
  const status: ExamStatus =
    r.attempt_status === "submitted"
      ? "submitted"
      : r.attempt_status === "in_progress"
        ? "in_progress"
        : "not_started";

  const openAt = r.open_at;
  const deadline = r.close_at;
  const notYetOpen = !!openAt && new Date(openAt).getTime() > now;
  const closed = !!deadline && new Date(deadline).getTime() < now;
  const urgent =
    !!deadline &&
    !closed &&
    new Date(deadline).getTime() - now < DAY_MS &&
    status !== "submitted";

  // ป้ายช่วงวัน — โชว์เฉพาะวัน (ไม่โชว์เวลา) + บอกทั้งวันเปิดและวันปิด
  // (ไม่ใช้กับ practice — ทำซ้ำได้ ไม่มีกรอบเวลา)
  let availabilityLabel: string | null = null;
  if (!isPractice && status !== "submitted") {
    const openDay = openAt ? fmtThai(openAt, false) : null;
    const closeDay = deadline ? fmtThai(deadline, false) : null;
    if (closed) availabilityLabel = "ปิดรับแล้ว";
    else if (notYetOpen)
      availabilityLabel = `เปิด ${openDay}${closeDay ? ` · ถึง ${closeDay}` : ""}`;
    else if (openDay && closeDay) availabilityLabel = `ทำได้ ${openDay} – ${closeDay}`;
    else if (closeDay) availabilityLabel = `ทำได้ถึง ${closeDay}`;
    else if (openDay) availabilityLabel = `เปิดตั้งแต่ ${openDay}`;
  }

  // in_progress: เหลือกี่ข้อ (จาก autosave) + เหลือกี่นาที (จาก started_at + duration)
  let remainingMin: number | null = null;
  let remainingLabel: string | null = null;
  if (status === "in_progress") {
    const remainingQ = Math.max(0, (r.total_questions ?? 0) - (r.answered ?? 0));
    const qPart = `เหลือ ${remainingQ} ข้อ`;
    if (r.untimed) {
      remainingLabel = qPart;
    } else if (r.started_at) {
      const end = new Date(r.started_at).getTime() + r.duration_minutes * 60_000;
      remainingMin = Math.max(0, Math.ceil((end - now) / 60_000));
      remainingLabel = remainingMin > 0 ? `${qPart} · ${remainingMin} นาที` : `${qPart} · หมดเวลา`;
    } else {
      remainingLabel = qPart;
    }
  }

  const submittedLabel =
    status === "submitted" && r.submitted_at ? `ส่งเมื่อ ${fmtThai(r.submitted_at, false)}` : null;

  // คะแนน/ผ่าน (submitted)
  const total = r.total ?? r.total_questions;
  const percent =
    status === "submitted" && r.score != null && total
      ? Math.round((r.score / total) * 100)
      : null;
  const passing = r.passing_score ?? defaultPassing(total);
  const passed =
    status === "submitted" && !isPractice && r.score != null ? r.score >= passing : null;

  // เฉลย
  const allowReview = r.allow_review !== false; // default เปิด
  const reviewedAlready = !isPractice && !!r.reviewed_at;
  const canReview =
    status === "submitted" && (isPractice || (allowReview && !reviewedAlready));

  return {
    examId: r.exam_id,
    code: r.exam_code,
    kind: r.kind,
    title: r.title,
    questionCount: r.total_questions,
    durationMin: r.duration_minutes,
    untimed: r.untimed,
    status,
    openAt,
    deadline,
    notYetOpen,
    closed,
    urgent,
    availabilityLabel,
    remainingMin,
    remainingLabel,
    submittedLabel,
    score: status === "submitted" ? r.score : null,
    total: status === "submitted" ? total : null,
    percent,
    passed,
    submittedAt: r.submitted_at,
    canReview,
    reviewClosed: status === "submitted" && !isPractice && !allowReview,
    reviewedAlready,
  };
}

// คะแนนความใกล้ deadline สำหรับเรียง (น้อย = ขึ้นก่อน)
function todoSortKey(c: StudentExamCard): number {
  if (c.status === "in_progress") return -1; // ทำค้าง ขึ้นก่อนสุด
  if (c.deadline && !c.closed) return new Date(c.deadline).getTime();
  if (c.closed) return Number.MAX_SAFE_INTEGER; // ปิดแล้ว ลงล่างสุด
  return Number.MAX_SAFE_INTEGER - 1; // ไม่มี deadline
}

export async function getStudentHome(): Promise<StudentHomeData> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("list_student_exams");
  const now = Date.now();
  const cards = ((data as Row[] | null) ?? []).map((r) => normalize(r, now));

  const todo = cards
    .filter((c) => c.status !== "submitted")
    .sort((a, b) => todoSortKey(a) - todoSortKey(b));
  const done = cards
    .filter((c) => c.status === "submitted")
    .sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""));

  // ความคืบหน้า = เฉพาะชุดสอบ (exam) — แบบฝึกหัดทำซ้ำได้ ไม่นับเป็น "เสร็จ"
  const gradedCards = cards.filter((c) => c.kind === "exam");
  const assignedCount = gradedCards.length;
  const doneCount = gradedCards.filter((c) => c.status === "submitted").length;
  const percent = assignedCount ? Math.round((doneCount / assignedCount) * 100) : 0;

  return { todo, done, doneCount, assignedCount, percent };
}
