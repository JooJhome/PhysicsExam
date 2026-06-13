// อัปข้อสอบทุกไฟล์ใน exams/*.html → DB (Supabase)
//   - แปลงด้วย transformExam (ตัวเดียวกับแอป): ฉบับสอบ (ไม่มีเฉลย) + ฉบับเฉลย + answer key
//   - upsert ลงตาราง exams (ตาม exam_code) + exam_answer_keys
//   ใช้: node scripts/seed-exams.mjs [--draft]   (ดีฟอลต์ publish เลย)
import { readFileSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { getAdminEnv } from "./_env.mjs";
import { transformExam } from "../src/lib/examTransform.ts";

const status = process.argv.includes("--draft") ? "draft" : "published";
const { url, key, root } = getAdminEnv();
const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// "CU-ATS_Physics_Mock_Aug2026_Interactive.html" -> "CU-ATS_Aug2026"
function toExamCode(file) {
  return basename(file, ".html")
    .replace(/_Physics_Mock/i, "")
    .replace(/_Interactive$/i, "")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

const examsDir = join(root, "exams");
const files = readdirSync(examsDir)
  .filter((f) => f.toLowerCase().endsWith(".html"))
  .sort();

if (files.length === 0) {
  console.error("ไม่พบไฟล์ .html ใน exams/");
  process.exit(1);
}

console.log(`พบข้อสอบ ${files.length} ไฟล์ — status = ${status}\n`);

let ok = 0;
for (const file of files) {
  const code = toExamCode(file);
  try {
    const raw = readFileSync(join(examsDir, file), "utf8");
    const r = transformExam(raw);

    const { data: exam, error: eErr } = await admin
      .from("exams")
      .upsert(
        {
          title: r.title,
          exam_code: code,
          total_questions: r.totalQuestions,
          exam_html: r.examHtml,
          review_html: r.reviewHtml,
          status,
        },
        { onConflict: "exam_code" }
      )
      .select("id")
      .single();
    if (eErr) throw eErr;

    const { error: kErr } = await admin
      .from("exam_answer_keys")
      .upsert({ exam_id: exam.id, answers: r.answers }, { onConflict: "exam_id" });
    if (kErr) throw kErr;

    ok++;
    console.log(`✅ ${code}  (${r.totalQuestions} ข้อ)  "${r.title}"`);
  } catch (err) {
    console.error(`❌ ${file}: ${err.message}`);
  }
}

console.log(`\nเสร็จ — สำเร็จ ${ok}/${files.length} ชุด`);
