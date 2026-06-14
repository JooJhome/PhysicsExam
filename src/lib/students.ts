import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type StudentListItem = {
  id: string;
  username: string;
  displayName: string | null;
  status: "active" | "never";
  lastActiveAt: string | null; // ISO — last_sign_in_at จาก Auth
  lastActiveLabel: string; // relative ไทย (คำนวณฝั่งเซิร์ฟเวอร์ กัน hydration mismatch)
  assignedCount: number;
  completedCount: number;
  avgPercent: number | null; // คะแนนเฉลี่ยเป็น % (รองรับข้อสอบที่คะแนนเต็มต่างกัน)
};

const DAY = 86_400_000;
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

export async function getTutorStudents(): Promise<StudentListItem[]> {
  const supabase = await createClient();
  const admin = createAdminClient();

  const [profilesRes, assignRes, attemptRes, examsRes, usersRes] = await Promise.all([
    supabase.from("profiles").select("id, username, full_name").eq("role", "student"),
    supabase.from("assignments").select("student_id, exam_id"),
    supabase.from("attempts").select("student_id, exam_id, status, score, total"),
    supabase.from("exams").select("id, kind"),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);

  const now = Date.now();
  const profiles = profilesRes.data ?? [];
  // สถิติของนักเรียน = งาน graded เท่านั้น → ตัดแบบฝึกหัดออกจาก มอบหมาย/ทำเสร็จ/เฉลี่ย
  const practiceIds = new Set(
    (examsRes.data ?? []).filter((e) => e.kind === "practice").map((e) => e.id)
  );
  const assignments = (assignRes.data ?? []).filter((a) => !practiceIds.has(a.exam_id));
  const attempts = (attemptRes.data ?? []).filter((a) => !practiceIds.has(a.exam_id));

  const lastSignInById = new Map<string, string | null>();
  for (const u of usersRes.data?.users ?? []) {
    lastSignInById.set(u.id, u.last_sign_in_at ?? null);
  }

  const assignedBy = new Map<string, number>();
  for (const a of assignments) {
    assignedBy.set(a.student_id, (assignedBy.get(a.student_id) ?? 0) + 1);
  }

  // นับ "ทำเสร็จ" และเก็บผลรวมเป็น % (เฉลี่ยข้ามชุดที่คะแนนเต็มต่างกันได้)
  const completedBy = new Map<string, { count: number; pctSum: number; pctCount: number }>();
  for (const at of attempts) {
    if (at.status !== "submitted" || at.score == null) continue;
    const cur = completedBy.get(at.student_id) ?? { count: 0, pctSum: 0, pctCount: 0 };
    cur.count += 1;
    if (at.total && at.total > 0) {
      cur.pctSum += (at.score / at.total) * 100;
      cur.pctCount += 1;
    }
    completedBy.set(at.student_id, cur);
  }

  return profiles
    .map((p) => {
      const done = completedBy.get(p.id);
      const lastActiveAt = lastSignInById.get(p.id) ?? null;
      return {
        id: p.id,
        username: p.username,
        displayName: p.full_name?.trim() || null,
        status: (lastActiveAt ? "active" : "never") as "active" | "never",
        lastActiveAt,
        lastActiveLabel: relativeThai(lastActiveAt, now),
        assignedCount: assignedBy.get(p.id) ?? 0,
        completedCount: done?.count ?? 0,
        avgPercent: done && done.pctCount > 0 ? Math.round(done.pctSum / done.pctCount) : null,
      };
    })
    .sort((a, b) => a.username.localeCompare(b.username));
}
