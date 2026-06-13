#!/usr/bin/env node
/**
 * seed.mjs — เตรียมระบบครั้งแรก (ใช้ service-role key)
 *   1) สร้างบัญชี tutor
 *   2) แปลง + อัปโหลดข้อสอบทุกไฟล์ใน exams/*.html (status = published)
 *   3) สร้างนักเรียนจาก scripts/students.csv  (ถ้ามี — รูปแบบ: username,password,ชื่อ)
 *
 * รัน:
 *   node --env-file=.env.local scripts/seed.mjs --tutor-user=tutor --tutor-pass=ChangeMe123
 *
 * ต้องมีใน .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, (NEXT_PUBLIC_STUDENT_EMAIL_DOMAIN)
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, basename } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { transformExam } from "../src/lib/examTransform.ts";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)=(.*)$/);
    return m ? [m[1], m[2]] : [a.replace(/^--/, ""), true];
  })
);

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DOMAIN = process.env.NEXT_PUBLIC_STUDENT_EMAIL_DOMAIN || "students.bsiink.local";
if (!URL || !KEY) {
  console.error("✗ ต้องมี NEXT_PUBLIC_SUPABASE_URL และ SUPABASE_SERVICE_ROLE_KEY (ใช้ --env-file=.env.local)");
  process.exit(1);
}
const db = createClient(URL, KEY, { auth: { persistSession: false } });
const emailOf = (u) => `${String(u).trim().toLowerCase()}@${DOMAIN}`;

async function ensureUser(username, password, fullName, role) {
  const email = emailOf(username);
  let { data, error } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username, full_name: fullName },
  });
  if (error) {
    if (/registered|exists/i.test(error.message)) {
      console.log(`  • ${username} มีอยู่แล้ว — ข้าม`);
      return null;
    }
    throw error;
  }
  const { error: pErr } = await db
    .from("profiles")
    .upsert({ id: data.user.id, role, username, full_name: fullName || username });
  if (pErr) throw pErr;
  return data.user.id;
}

async function main() {
  // 1) tutor
  const tUser = args["tutor-user"] || "tutor";
  const tPass = args["tutor-pass"];
  if (!tPass) {
    console.error("✗ ต้องระบุ --tutor-pass=... (รหัสผ่าน tutor)");
    process.exit(1);
  }
  console.log(`สร้าง tutor: ${tUser}`);
  await ensureUser(tUser, tPass, "Tutor", "tutor");

  // 2) exams
  const dir = "exams";
  const files = readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".html"));
  console.log(`\nอัปโหลดข้อสอบ ${files.length} ชุด`);
  for (const f of files) {
    const examCode = basename(f, ".html");
    const raw = readFileSync(join(dir, f), "utf8");
    let t;
    try {
      t = transformExam(raw);
    } catch (e) {
      console.log(`  ✗ ${examCode}: ${e.message}`);
      continue;
    }
    const { data: exam, error } = await db
      .from("exams")
      .upsert(
        {
          title: t.title,
          exam_code: examCode,
          total_questions: t.totalQuestions,
          exam_html: t.examHtml,
          review_html: t.reviewHtml,
          status: "published",
        },
        { onConflict: "exam_code" }
      )
      .select("id")
      .single();
    if (error) {
      console.log(`  ✗ ${examCode}: ${error.message}`);
      continue;
    }
    const { error: kErr } = await db
      .from("exam_answer_keys")
      .upsert({ exam_id: exam.id, answers: t.answers });
    if (kErr) console.log(`  ✗ ${examCode} (เฉลย): ${kErr.message}`);
    else console.log(`  ✓ ${examCode} (${t.totalQuestions} ข้อ)`);
  }

  // 3) students (ถ้ามี scripts/students.csv)
  const csvPath = join("scripts", "students.csv");
  if (existsSync(csvPath)) {
    const lines = readFileSync(csvPath, "utf8")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"));
    console.log(`\nสร้างนักเรียน ${lines.length} คน`);
    for (const line of lines) {
      const [u, p, ...rest] = line.split(",").map((s) => s.trim());
      if (!u || !p) continue;
      try {
        await ensureUser(u, p, rest.join(",").trim(), "student");
        console.log(`  ✓ ${u}`);
      } catch (e) {
        console.log(`  ✗ ${u}: ${e.message}`);
      }
    }
  } else {
    console.log("\n(ไม่พบ scripts/students.csv — ข้ามการสร้างนักเรียน)");
  }

  console.log("\n✓ เสร็จสิ้น");
}

main().catch((e) => {
  console.error("✗ ผิดพลาด:", e.message);
  process.exit(1);
});
