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
    if (!file || file.size === 0) return { ok: false, message: "กรุณาเลือกไฟล์ HTML" };
    if (!examCode) return { ok: false, message: "กรุณาใส่รหัสชุด (exam_code)" };

    const rawHtml = await file.text();
    const t = transformExam(rawHtml);

    const { data: exam, error: e1 } = await supabase
      .from("exams")
      .insert({
        title: t.title,
        exam_code: examCode,
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
    full_name: fullName || username,
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

/* ---------------- รีเซ็ตการทำข้อสอบ ---------------- */

export async function resetAttempt(
  examId: string,
  studentId: string
): Promise<ActionResult> {
  const { supabase } = await assertTutor();
  const { error } = await supabase
    .from("attempts")
    .delete()
    .eq("exam_id", examId)
    .eq("student_id", studentId);
  revalidatePath("/tutor/results");
  return error ? { ok: false, message: error.message } : { ok: true, message: "รีเซ็ตแล้ว ให้ทำใหม่ได้" };
}
