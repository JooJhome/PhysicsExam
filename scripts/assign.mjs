// มอบหมายชุดสอบให้นักเรียน ผ่าน service-role
//   node scripts/assign.mjs <exam_code> <username> [<username> ...]
//   node scripts/assign.mjs <exam_code> --all       (assign ให้นักเรียนทุกคน)
import { createClient } from "@supabase/supabase-js";
import { getAdminEnv } from "./_env.mjs";

const { url, key } = getAdminEnv();
const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const [examCode, ...who] = process.argv.slice(2);
if (!examCode || who.length === 0) {
  console.error("ใช้: node scripts/assign.mjs <exam_code> <username...|--all>");
  process.exit(1);
}

const { data: exam, error: eErr } = await admin
  .from("exams")
  .select("id,title")
  .eq("exam_code", examCode)
  .single();
if (eErr || !exam) {
  console.error(`ไม่พบชุดสอบ exam_code = ${examCode}`);
  process.exit(1);
}

let students;
if (who[0] === "--all") {
  const { data, error } = await admin
    .from("profiles")
    .select("id,username")
    .eq("role", "student");
  if (error) throw error;
  students = data;
} else {
  const { data, error } = await admin
    .from("profiles")
    .select("id,username")
    .eq("role", "student")
    .in("username", who);
  if (error) throw error;
  students = data;
  const found = new Set(students.map((s) => s.username));
  who.filter((u) => !found.has(u)).forEach((u) => console.error(`⚠️ ไม่พบนักเรียน: ${u}`));
}

if (students.length === 0) {
  console.error("ไม่มีนักเรียนให้ assign");
  process.exit(1);
}

const rows = students.map((s) => ({ exam_id: exam.id, student_id: s.id }));
const { error: aErr } = await admin
  .from("assignments")
  .upsert(rows, { onConflict: "exam_id,student_id", ignoreDuplicates: true });
if (aErr) throw aErr;

console.log(`✅ assign "${exam.title}" (${examCode}) ให้ ${students.length} คน:`);
students.forEach((s) => console.log(`   - ${s.username}`));
