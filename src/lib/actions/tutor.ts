"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { transformExam, analyzeExam } from "@/lib/examTransform";
import { usernameToEmail } from "@/lib/constants";

async function assertTutor() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("ไม่ได้เข้าสู่ระบบ");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "tutor") throw new Error("ต้องเป็นติวเตอร์เท่านั้น");
  return { supabase, userId: user.id };
}

export type ActionResult = { ok: boolean; message: string };

export type ValidateResult = {
  ok: boolean;
  filename: string;
  title: string;
  questionCount: number;
  strippedCount: number;
  katexOk: boolean;
  errors: string[];
  warnings: string[];
};

/* ---------------- ข้อสอบ ---------------- */

/** ตรวจไฟล์ก่อนอัปจริง — ไม่บันทึกลง DB ใช้กับแถบสรุปผลในการ์ดอัปโหลด */
export async function validateExamFile(formData: FormData): Promise<ValidateResult> {
  const empty: ValidateResult = {
    ok: false,
    filename: "",
    title: "",
    questionCount: 0,
    strippedCount: 0,
    katexOk: false,
    errors: [],
    warnings: [],
  };
  try {
    await assertTutor();
    const file = formData.get("file") as File | null;
    if (!file || file.size === 0)
      return { ...empty, errors: ["กรุณาเลือกไฟล์ HTML"] };
    const raw = await file.text();
    const a = analyzeExam(raw);
    return {
      ok: a.ok,
      filename: file.name,
      title: a.title,
      questionCount: a.questionCount,
      strippedCount: a.strippedCount,
      katexOk: a.katexOk,
      errors: a.errors,
      warnings: a.warnings,
    };
  } catch (err) {
    return { ...empty, errors: [(err as Error).message] };
  }
}

export async function createExam(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, userId } = await assertTutor();
    const file = formData.get("file") as File | null;
    const examCode = String(formData.get("exam_code") || "").trim();
    const duration = Number(formData.get("duration_minutes") || 30);
    const kind = String(formData.get("kind") || "exam") === "practice" ? "practice" : "exam";
    const subjects = parseLabels(String(formData.get("subjects") || ""));
    if (!file || file.size === 0) return { ok: false, message: "กรุณาเลือกไฟล์ HTML" };
    if (!examCode) return { ok: false, message: "กรุณาใส่รหัสชุด (exam_code)" };

    const rawHtml = await file.text();
    const t = transformExam(rawHtml);

    const { data: exam, error: e1 } = await supabase
      .from("exams")
      .insert({
        title: t.title,
        exam_code: examCode,
        kind,
        subjects,
        duration_minutes: duration,
        total_questions: t.totalQuestions,
        exam_html: t.examHtml,
        review_html: t.reviewHtml,
        status: "draft",
        created_by: userId,
      })
      .select("id")
      .single();
    if (e1) return { ok: false, message: e1.message };

    const { error: e2 } = await supabase
      .from("exam_answer_keys")
      .insert({ exam_id: exam.id, answers: t.answers });
    if (e2) return { ok: false, message: e2.message };

    revalidatePath("/tutor/exams");
    return { ok: true, message: `เพิ่มชุด "${t.title}" (${t.totalQuestions} ข้อ) แล้ว` };
  } catch (err) {
    return { ok: false, message: (err as Error).message };
  }
}

export async function setExamStatus(
  examId: string,
  status: "draft" | "published"
): Promise<ActionResult> {
  const { supabase } = await assertTutor();
  const { error } = await supabase.from("exams").update({ status }).eq("id", examId);
  revalidatePath("/tutor/exams");
  return error ? { ok: false, message: error.message } : { ok: true, message: "อัปเดตแล้ว" };
}

export async function setExamDuration(
  examId: string,
  durationMinutes: number
): Promise<ActionResult> {
  const { supabase } = await assertTutor();
  const duration = Math.round(durationMinutes);
  if (!Number.isFinite(duration) || duration < 1)
    return { ok: false, message: "เวลาต้องเป็นจำนวนนาทีอย่างน้อย 1 นาที" };
  const { error } = await supabase
    .from("exams")
    .update({ duration_minutes: duration })
    .eq("id", examId);
  revalidatePath("/tutor/exams");
  return error
    ? { ok: false, message: error.message }
    : { ok: true, message: `ตั้งเวลาเป็น ${duration} นาทีแล้ว` };
}

/** แปลงสตริง label (คั่นด้วย comma) → array สะอาด: trim, ตัดว่าง, ตัดซ้ำ (case-insensitive), สูงสุด 6 */
function parseLabels(raw: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const part of raw.split(",")) {
    const v = part.trim();
    if (!v) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
    if (out.length >= 6) break;
  }
  return out;
}

export async function setExamSubjects(
  examId: string,
  subjects: string[]
): Promise<ActionResult> {
  const { supabase } = await assertTutor();
  const clean = parseLabels(subjects.join(","));
  const { error } = await supabase.from("exams").update({ subjects: clean }).eq("id", examId);
  revalidatePath("/tutor/exams");
  return error
    ? { ok: false, message: error.message }
    : { ok: true, message: clean.length ? `อัปเดตป้ายเป็น ${clean.join(", ")}` : "ล้างป้ายแล้ว" };
}

export async function renameExam(
  examId: string,
  title: string
): Promise<ActionResult> {
  const { supabase } = await assertTutor();
  const name = title.trim();
  if (name.length < 1) return { ok: false, message: "ชื่อชุดห้ามว่าง" };
  if (name.length > 120) return { ok: false, message: "ชื่อชุดยาวเกินไป (เกิน 120 ตัวอักษร)" };
  const { error } = await supabase.from("exams").update({ title: name }).eq("id", examId);
  revalidatePath("/tutor/exams");
  return error
    ? { ok: false, message: error.message }
    : { ok: true, message: `เปลี่ยนชื่อเป็น "${name}" แล้ว` };
}

export async function setAllowReview(
  examId: string,
  allow: boolean
): Promise<ActionResult> {
  const { supabase } = await assertTutor();
  const { error } = await supabase
    .from("exams")
    .update({ allow_review: allow })
    .eq("id", examId);
  revalidatePath("/tutor/exams");
  return error ? { ok: false, message: error.message } : { ok: true, message: "อัปเดตแล้ว" };
}

export async function deleteExam(examId: string): Promise<ActionResult> {
  const { supabase } = await assertTutor();
  const { error } = await supabase.from("exams").delete().eq("id", examId);
  revalidatePath("/tutor/exams");
  return error ? { ok: false, message: error.message } : { ok: true, message: "ลบแล้ว" };
}

/* ---------------- นักเรียน ---------------- */

export async function createStudent(formData: FormData): Promise<ActionResult> {
  try {
    await assertTutor();
    const username = String(formData.get("username") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");
    const fullName = String(formData.get("full_name") || "").trim();
    if (!username || !password)
      return { ok: false, message: "ต้องมี username และ password" };
    if (password.length < 6)
      return { ok: false, message: "รหัสผ่านอย่างน้อย 6 ตัวอักษร" };
    if (!fullName)
      return { ok: false, message: "ต้องระบุชื่อ-สกุล (ใช้เป็นลายน้ำตอนสอบ)" };

    const res = await createOneStudent(username, password, fullName);
    revalidatePath("/tutor/students");
    return res;
  } catch (err) {
    return { ok: false, message: (err as Error).message };
  }
}

export async function createStudentsBulk(csv: string): Promise<ActionResult> {
  try {
    await assertTutor();
    // รูปแบบบรรทัด: username,password,full_name
    const lines = csv
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"));
    let ok = 0;
    const errors: string[] = [];
    for (const line of lines) {
      const [u, p, ...rest] = line.split(",").map((s) => s.trim());
      const full = rest.join(",").trim();
      if (!u || !p) {
        errors.push(`ข้าม "${line}" (ขาด username/password)`);
        continue;
      }
      if (!full) {
        errors.push(`ข้าม "${line}" (ขาดชื่อ-สกุล)`);
        continue;
      }
      const r = await createOneStudent(u.toLowerCase(), p, full);
      if (r.ok) ok++;
      else errors.push(`${u}: ${r.message}`);
    }
    revalidatePath("/tutor/students");
    return {
      ok: errors.length === 0,
      message: `สร้างสำเร็จ ${ok} คน` + (errors.length ? ` · ปัญหา: ${errors.join("; ")}` : ""),
    };
  } catch (err) {
    return { ok: false, message: (err as Error).message };
  }
}

export type BulkRowResult = { username: string; ok: boolean; error?: string };

/** สร้างหลายบัญชีพร้อมกัน แล้วคืนผลรายแถว (ใช้กับ preview/export credential) */
export async function createStudentsBulkDetailed(
  rows: { username: string; password: string; fullName: string }[]
): Promise<{ ok: boolean; results: BulkRowResult[] }> {
  try {
    await assertTutor();
    const results: BulkRowResult[] = [];
    for (const r of rows) {
      const username = r.username.trim().toLowerCase();
      if (!username || !r.password) {
        results.push({ username: r.username, ok: false, error: "ขาด username/password" });
        continue;
      }
      if (r.password.length < 6) {
        results.push({ username, ok: false, error: "รหัสสั้นกว่า 6 ตัว" });
        continue;
      }
      if (!r.fullName.trim()) {
        results.push({ username, ok: false, error: "ขาดชื่อ-สกุล" });
        continue;
      }
      const res = await createOneStudent(username, r.password, r.fullName.trim());
      results.push({ username, ok: res.ok, error: res.ok ? undefined : res.message });
    }
    revalidatePath("/tutor/students");
    return { ok: results.every((r) => r.ok), results };
  } catch (err) {
    return {
      ok: false,
      results: rows.map((r) => ({ username: r.username, ok: false, error: (err as Error).message })),
    };
  }
}

export async function resetStudentPassword(
  studentId: string,
  newPassword: string
): Promise<ActionResult> {
  try {
    await assertTutor();
    if (newPassword.length < 6)
      return { ok: false, message: "รหัสผ่านอย่างน้อย 6 ตัวอักษร" };
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(studentId, {
      password: newPassword,
    });
    return error ? { ok: false, message: error.message } : { ok: true, message: "รีเซ็ตรหัสแล้ว" };
  } catch (err) {
    return { ok: false, message: (err as Error).message };
  }
}

export async function renameStudent(
  studentId: string,
  fullName: string
): Promise<ActionResult> {
  try {
    await assertTutor();
    const admin = createAdminClient();
    const name = fullName.trim();
    const { error } = await admin
      .from("profiles")
      .update({ full_name: name || null })
      .eq("id", studentId);
    revalidatePath("/tutor/students");
    return error ? { ok: false, message: error.message } : { ok: true, message: "แก้ไขชื่อแล้ว" };
  } catch (err) {
    return { ok: false, message: (err as Error).message };
  }
}

async function createOneStudent(
  username: string,
  password: string,
  fullName: string
): Promise<ActionResult> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: usernameToEmail(username),
    password,
    email_confirm: true,
    user_metadata: { username, full_name: fullName },
  });
  if (error) return { ok: false, message: error.message };

  const { error: pErr } = await admin.from("profiles").insert({
    id: data.user.id,
    role: "student",
    username,
    full_name: fullName.trim() || null, // ไม่ใช้ username เป็นชื่อ (ลายน้ำต้องเป็นชื่อจริง)
  });
  if (pErr) {
    // rollback auth user หาก insert profile ล้มเหลว
    await admin.auth.admin.deleteUser(data.user.id);
    return { ok: false, message: pErr.message };
  }
  return { ok: true, message: `สร้าง ${username} แล้ว` };
}

export async function deleteStudent(studentId: string): Promise<ActionResult> {
  try {
    await assertTutor();
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(studentId); // cascade ลบ profile/attempts
    revalidatePath("/tutor/students");
    return error ? { ok: false, message: error.message } : { ok: true, message: "ลบแล้ว" };
  } catch (err) {
    return { ok: false, message: (err as Error).message };
  }
}

/* ---------------- มอบหมาย ---------------- */

export async function toggleAssignment(
  examId: string,
  studentId: string,
  assign: boolean
): Promise<ActionResult> {
  const { supabase } = await assertTutor();
  if (assign) {
    const { error } = await supabase
      .from("assignments")
      .upsert({ exam_id: examId, student_id: studentId }, { onConflict: "exam_id,student_id" });
    revalidatePath("/tutor/assign");
    return error ? { ok: false, message: error.message } : { ok: true, message: "มอบหมายแล้ว" };
  } else {
    const { error } = await supabase
      .from("assignments")
      .delete()
      .eq("exam_id", examId)
      .eq("student_id", studentId);
    revalidatePath("/tutor/assign");
    return error ? { ok: false, message: error.message } : { ok: true, message: "ยกเลิกแล้ว" };
  }
}

export async function assignExamToAll(examId: string): Promise<ActionResult> {
  const { supabase } = await assertTutor();
  const { data: students } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "student");
  if (!students?.length) return { ok: false, message: "ยังไม่มีนักเรียน" };
  const rows = students.map((s) => ({ exam_id: examId, student_id: s.id }));
  const { error } = await supabase
    .from("assignments")
    .upsert(rows, { onConflict: "exam_id,student_id" });
  revalidatePath("/tutor/assign");
  return error ? { ok: false, message: error.message } : { ok: true, message: `มอบหมายให้ ${rows.length} คน` };
}

export type AttemptState = "none" | "in_progress" | "submitted";
export type AssignWindow = { open: string | null; close: string | null; due: string | null };
export type ExamAssignmentDetail = {
  exam: { id: string; name: string; code: string; status: string; durationMin: number; kind: "exam" | "practice" };
  window: AssignWindow;
  durationOverride: number | null;
  untimed: boolean;
  students: {
    id: string;
    username: string;
    displayName: string | null;
    assigned: boolean;
    attemptState: AttemptState;
  }[];
};

/** รายละเอียดการมอบหมายของชุดหนึ่ง — ใช้เปิด drawer เลือกนักเรียน */
export async function getExamAssignment(examId: string): Promise<ExamAssignmentDetail> {
  const { supabase } = await assertTutor();
  const [examRes, studentsRes, assignRes, attemptRes] = await Promise.all([
    supabase
      .from("exams")
      .select("id, title, exam_code, status, duration_minutes, kind")
      .eq("id", examId)
      .single(),
    supabase.from("profiles").select("id, username, full_name").eq("role", "student").order("username"),
    supabase
      .from("assignments")
      .select("student_id, open_at, close_at, due_at, duration_override_min, untimed")
      .eq("exam_id", examId),
    supabase.from("attempts").select("student_id, status").eq("exam_id", examId),
  ]);

  const exam = examRes.data;
  if (!exam) throw new Error("ไม่พบชุดข้อสอบ");

  const assignRows = assignRes.data ?? [];
  const assignedSet = new Set(assignRows.map((a) => a.student_id));
  const attemptBy = new Map<string, AttemptState>();
  for (const at of attemptRes.data ?? []) {
    attemptBy.set(at.student_id, at.status as AttemptState);
  }

  // window/override ใช้ค่าร่วมของชุด (อ่านจากแถวแรกที่มอบหมายไว้)
  const first = assignRows[0];

  return {
    exam: {
      id: exam.id,
      name: exam.title,
      code: exam.exam_code,
      status: exam.status,
      durationMin: exam.duration_minutes,
      kind: (exam.kind as "exam" | "practice") ?? "exam",
    },
    window: {
      open: first?.open_at ?? null,
      close: first?.close_at ?? null,
      due: first?.due_at ?? null,
    },
    durationOverride: first?.duration_override_min ?? null,
    untimed: first?.untimed ?? false,
    students: (studentsRes.data ?? []).map((s) => ({
      id: s.id,
      username: s.username,
      displayName: s.full_name?.trim() || null,
      assigned: assignedSet.has(s.id),
      attemptState: attemptBy.get(s.id) ?? "none",
    })),
  };
}

export type SaveAssignmentResult = ActionResult & {
  added: number;
  removed: number;
  blocked: number; // submitted ที่ถูกกันไม่ให้ถอน
};

/** บันทึกการมอบหมาย — คำนวณ diff, บล็อกการถอนคนที่ส่งแล้ว, อัปเดต window/override */
export async function saveAssignment(
  examId: string,
  studentIds: string[],
  window: AssignWindow,
  durationOverrideMin: number | null,
  untimed: boolean = false
): Promise<SaveAssignmentResult> {
  try {
    const { supabase } = await assertTutor();
    const [assignRes, attemptRes] = await Promise.all([
      supabase.from("assignments").select("student_id").eq("exam_id", examId),
      supabase.from("attempts").select("student_id, status").eq("exam_id", examId),
    ]);

    const current = new Set((assignRes.data ?? []).map((a) => a.student_id));
    const desired = new Set(studentIds);
    const submitted = new Set(
      (attemptRes.data ?? []).filter((a) => a.status === "submitted").map((a) => a.student_id)
    );

    const toAdd = [...desired].filter((id) => !current.has(id));
    // ถอนเฉพาะคนที่ไม่ได้ส่งแล้ว (submitted = ล็อก กันถอนพลาด)
    const toRemoveAll = [...current].filter((id) => !desired.has(id));
    const toRemove = toRemoveAll.filter((id) => !submitted.has(id));
    const blocked = toRemoveAll.length - toRemove.length;

    const win = {
      open_at: window.open,
      close_at: window.close,
      due_at: window.due,
      duration_override_min: durationOverrideMin,
      untimed,
    };

    // upsert window/override ให้ทุกคนในชุดที่ต้องการ (เพิ่มใหม่ + คงเดิม)
    if (desired.size > 0) {
      const rows = [...desired].map((sid) => ({ exam_id: examId, student_id: sid, ...win }));
      const { error } = await supabase
        .from("assignments")
        .upsert(rows, { onConflict: "exam_id,student_id" });
      if (error) return { ok: false, message: error.message, added: 0, removed: 0, blocked: 0 };
    }

    if (toRemove.length > 0) {
      const { error } = await supabase
        .from("assignments")
        .delete()
        .eq("exam_id", examId)
        .in("student_id", toRemove);
      if (error)
        return { ok: false, message: error.message, added: toAdd.length, removed: 0, blocked };
    }

    revalidatePath("/tutor/assign");
    const msg =
      `เพิ่ม ${toAdd.length} · ถอน ${toRemove.length} คน` +
      (blocked > 0 ? ` · ข้าม ${blocked} คน (ส่งแล้ว)` : "");
    return { ok: true, message: msg, added: toAdd.length, removed: toRemove.length, blocked };
  } catch (err) {
    return { ok: false, message: (err as Error).message, added: 0, removed: 0, blocked: 0 };
  }
}

/* ---------------- รีเซ็ตการทำข้อสอบ ---------------- */

export async function resetAttempt(
  examId: string,
  studentId: string
): Promise<ActionResult> {
  const { supabase, userId } = await assertTutor();

  // เก็บ snapshot ก่อนลบ (audit / กู้คืนเชิงประวัติ)
  const { data: att } = await supabase
    .from("attempts")
    .select("status, score, total, answers, started_at, submitted_at")
    .eq("exam_id", examId)
    .eq("student_id", studentId)
    .maybeSingle();

  if (att) {
    await supabase.from("attempt_resets").insert({
      exam_id: examId,
      student_id: studentId,
      reset_by: userId,
      prev_status: att.status,
      prev_score: att.score,
      prev_total: att.total,
      prev_answers: att.answers,
      prev_started_at: att.started_at,
      prev_submitted_at: att.submitted_at,
    });
  }

  const { error } = await supabase
    .from("attempts")
    .delete()
    .eq("exam_id", examId)
    .eq("student_id", studentId);
  revalidatePath("/tutor/results");
  return error ? { ok: false, message: error.message } : { ok: true, message: "รีเซ็ตแล้ว ให้ทำใหม่ได้" };
}

export async function setPassingScore(
  examId: string,
  passingScore: number | null
): Promise<ActionResult> {
  const { supabase } = await assertTutor();
  const value =
    passingScore == null || !Number.isFinite(passingScore) ? null : Math.max(0, Math.round(passingScore));
  const { error } = await supabase.from("exams").update({ passing_score: value }).eq("id", examId);
  revalidatePath("/tutor/results");
  return error
    ? { ok: false, message: error.message }
    : { ok: true, message: value == null ? "กลับไปใช้เกณฑ์เริ่มต้น" : `ตั้งเกณฑ์ผ่าน ${value} ข้อ` };
}

export type BreakdownItem = {
  n: number; // ข้อที่ (1-based)
  answered: number;
  correct: number;
  pctCorrect: number;
  topWrongChoice: number | null; // ตัวเลือกลวงที่คนเลือกบ่อยสุด
  topWrongCount: number;
};
export type ExamBreakdown = {
  examCode: string;
  submitted: number;
  items: BreakdownItem[];
};

/** วิเคราะห์รายข้อของชุด — รวมคำตอบผู้ส่งทุกคนเทียบเฉลย (ติวเตอร์เท่านั้น) */
export async function getExamBreakdown(examId: string): Promise<ExamBreakdown> {
  const { supabase } = await assertTutor();
  const [examRes, keyRes, attemptRes] = await Promise.all([
    supabase.from("exams").select("exam_code, total_questions").eq("id", examId).single(),
    supabase.from("exam_answer_keys").select("answers").eq("exam_id", examId).single(),
    supabase
      .from("attempts")
      .select("answers")
      .eq("exam_id", examId)
      .eq("status", "submitted"),
  ]);

  const key = (keyRes.data?.answers as number[] | null) ?? [];
  const total = examRes.data?.total_questions ?? key.length;
  const submissions = (attemptRes.data ?? [])
    .map((a) => a.answers as (number | null)[] | null)
    .filter((a): a is (number | null)[] => Array.isArray(a));

  const items: BreakdownItem[] = [];
  for (let i = 0; i < total; i++) {
    let answered = 0;
    let correct = 0;
    const wrongTally = new Map<number, number>();
    for (const ans of submissions) {
      const chosen = ans[i];
      if (chosen == null) continue;
      answered++;
      if (chosen === key[i]) correct++;
      else wrongTally.set(chosen, (wrongTally.get(chosen) ?? 0) + 1);
    }
    let topWrongChoice: number | null = null;
    let topWrongCount = 0;
    for (const [choice, count] of wrongTally) {
      if (count > topWrongCount) {
        topWrongChoice = choice;
        topWrongCount = count;
      }
    }
    items.push({
      n: i + 1,
      answered,
      correct,
      // ตัวหาร = จำนวนคนที่ "ส่ง" ทั้งหมด (เว้นว่าง/ตอบผิด = ไม่ถูก) ไม่ใช่เฉพาะคนที่ตอบข้อนั้น
      pctCorrect: submissions.length ? Math.round((correct / submissions.length) * 100) : 0,
      topWrongChoice,
      topWrongCount,
    });
  }

  // ยากสุด (ตอบถูกน้อยสุด) ขึ้นก่อน
  items.sort((a, b) => a.pctCorrect - b.pctCorrect);

  return {
    examCode: examRes.data?.exam_code ?? "—",
    submitted: submissions.length,
    items,
  };
}

/* ---------- แบบสอบถามหลังสอบ (อ่านฝั่งติวเตอร์ — RLS เปิดให้ tutor) ---------- */

export type SurveyResponse = {
  studentName: string;
  initials: string;
  difficulty: number;
  timeAdequacy: number;
  confidence: number;
  stress: number;
  hardestTopics: string | null;
  comment: string | null;
};

export type ExamSurveys = {
  examCode: string;
  count: number;
  avg: { difficulty: number; timeAdequacy: number; confidence: number; stress: number } | null;
  responses: SurveyResponse[];
};

function surveyInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return ((parts[0][0] ?? "") + (parts[1][0] ?? "")).toUpperCase();
}

/** รวมผลแบบสอบถามของชุดเดียว — ค่าเฉลี่ย 4 ด้าน + รายการตอบรายคน */
export async function getExamSurveys(examId: string): Promise<ExamSurveys> {
  const { supabase } = await assertTutor();
  const [examRes, surveyRes] = await Promise.all([
    supabase.from("exams").select("exam_code").eq("id", examId).single(),
    supabase
      .from("exam_surveys")
      .select("student_id, difficulty, time_adequacy, confidence, stress, hardest_topics, comment, created_at")
      .eq("exam_id", examId)
      .order("created_at", { ascending: false }),
  ]);

  const rows = surveyRes.data ?? [];
  const ids = [...new Set(rows.map((r) => r.student_id))];
  const profRes = ids.length
    ? await supabase.from("profiles").select("id, username, full_name").in("id", ids)
    : { data: [] as { id: string; username: string; full_name: string | null }[] };
  const nameById = new Map(
    (profRes.data ?? []).map((p) => [p.id, p.full_name?.trim() || p.username])
  );

  const responses: SurveyResponse[] = rows.map((r) => {
    const name = nameById.get(r.student_id) ?? "ไม่ทราบชื่อ";
    return {
      studentName: name,
      initials: surveyInitials(name),
      difficulty: r.difficulty,
      timeAdequacy: r.time_adequacy,
      confidence: r.confidence,
      stress: r.stress,
      hardestTopics: r.hardest_topics,
      comment: r.comment,
    };
  });

  const avg =
    rows.length === 0
      ? null
      : {
          difficulty: round1(rows.reduce((s, r) => s + r.difficulty, 0) / rows.length),
          timeAdequacy: round1(rows.reduce((s, r) => s + r.time_adequacy, 0) / rows.length),
          confidence: round1(rows.reduce((s, r) => s + r.confidence, 0) / rows.length),
          stress: round1(rows.reduce((s, r) => s + r.stress, 0) / rows.length),
        };

  return { examCode: examRes.data?.exam_code ?? "—", count: rows.length, avg, responses };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
