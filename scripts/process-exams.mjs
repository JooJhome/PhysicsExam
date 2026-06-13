#!/usr/bin/env node
/**
 * process-exams.mjs — dry-run: แปลงข้อสอบทุกไฟล์ใน exams/ → dist/ เพื่อตรวจดูด้วยตา
 * ไม่ยุ่งกับ Supabase  (ตรวจฉบับสอบ/เฉลยก่อนอัปโหลดจริง)
 *
 * รัน:  node scripts/process-exams.mjs
 * ออก: dist/exam/<code>.html, dist/review/<code>.html, dist/answers.json (เฉลย — เป็นความลับ)
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { join, basename } from "node:path";
import { transformExam } from "../src/lib/examTransform.ts";

mkdirSync("dist/exam", { recursive: true });
mkdirSync("dist/review", { recursive: true });

const files = readdirSync("exams").filter((f) => f.toLowerCase().endsWith(".html"));
const answers = {};
for (const f of files) {
  const code = basename(f, ".html");
  const raw = readFileSync(join("exams", f), "utf8");
  try {
    const t = transformExam(raw);
    writeFileSync(join("dist/exam", `${code}.html`), t.examHtml);
    writeFileSync(join("dist/review", `${code}.html`), t.reviewHtml);
    answers[code] = t.answers;
    console.log(`✓ ${code}  (${t.totalQuestions} ข้อ)`);
  } catch (e) {
    console.log(`✗ ${code}: ${e.message}`);
  }
}
writeFileSync("dist/answers.json", JSON.stringify(answers, null, 2));
console.log(`\n✓ เขียน dist/ (${Object.keys(answers).length} ชุด) — dist/ อยู่ใน .gitignore`);
