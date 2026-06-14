// ============================================================
// seed-mock.mjs — เตรียม mock data ครบทุก scenario สำหรับทดสอบมุม "ติวเตอร์"
// สร้างนักเรียน 3 คน + assignment/attempt/survey/reset หลายสถานะ
// ใช้ service-role (ข้าม RLS) — idempotent: ล้างข้อมูลของ 3 คนนี้ก่อนสร้างใหม่
//   รัน: node scripts/seed-mock.mjs
//   ล้างทิ้ง: node scripts/seed-mock.mjs --clean
// ============================================================
import { createClient } from "@supabase/supabase-js";
import { getAdminEnv, usernameToEmail } from "./_env.mjs";

const { url, key, domain } = getAdminEnv();
const db = createClient(url, key, { auth: { persistSession: false } });
const CLEAN_ONLY = process.argv.includes("--clean");

const PASS = "Mock1234!";
const STUDENTS = [
  { username: "mock_arnon", fullName: "อานนท์ ตั้งใจเรียน (Mock A · เก่ง)" },
  { username: "mock_bee",   fullName: "บีรญา กลางคืบ (Mock B · ต้องช่วย)" },
  { username: "mock_chai",  fullName: "ชัยวัฒน์ เพิ่งเข้า (Mock C · มาใหม่)" },
  { username: "mock_ploy",  fullName: "พลอย ปริ่มเกณฑ์ (Mock D · borderline)" },
  { username: "mock_nat",   fullName: "ณัฐ ขาดสอบ (Mock E · no-show)" },
  { username: "mock_fah",   fullName: "ฟ้า สม่ำเสมอ (Mock F · กลางคงที่)" },
  { username: "mock_guy",   fullName: "กาย คะแนนแกว่ง (Mock G · volatile)" },
  { username: "mock_hong",  fullName: "หงส์ สายฝึก (Mock H · practice)" },
];

// exam_code ที่ใช้ในแต่ละ scenario
const EXAMS = {
  S1: "CU-ATS_Aug2026", // Set 1 — timed ปกติ, ตั้งเกณฑ์ผ่าน 18
  S2: "CU-ATS_Oct2026", // Set 2 — timed, duration override 45 นาที
  S3: "TBAT_Dec2026",   // Set 3 — timed, เกณฑ์ผ่าน 20, มีประวัติ reset
  S4: "CU-ATS_Feb2027", // Set 4 — ไม่จับเวลา (untimed)
  S5: "CU-ATS_Apr2027", // Set 5 — ตั้งเวลาเปิดสอบล่วงหน้า (window)
};
const PRACTICE_SRC = "CU-ATS_Jun2027"; // คัดลอกมาทำชุดแบบฝึกหัด
const PRACTICE_CODE = "PRACTICE_MOCK_01";

const MIN = 60_000, HOUR = 60 * MIN, DAY = 24 * HOUR;
const now = Date.now();
const iso = (ms) => new Date(ms).toISOString();

// แต่ละชุดมี "ข้อยาก" คงที่ → ทำให้หน้าวิเคราะห์รายข้อเห็น gradient
const HARD = [29, 28, 27, 26, 24, 18, 14, 9, 5];

/** สร้าง array คำตอบจากเฉลย ให้ได้คะแนนตามเป้า (ข้อยากจะผิดก่อน, nulls = ทำไม่ทันท้ายชุด) */
function buildAnswers(answerKey, target, opts = {}) {
  const N = answerKey.length;
  const nulls = opts.nulls || 0;
  const answered = N - nulls;
  const wrongNeeded = Math.max(0, answered - target);
  const wrong = new Set();
  for (const h of HARD) if (h < answered && wrong.size < wrongNeeded) wrong.add(h);
  for (let i = answered - 1; i >= 0 && wrong.size < wrongNeeded; i--) wrong.add(i);
  const out = [];
  for (let i = 0; i < N; i++) {
    if (i >= answered) out.push(null);
    else if (wrong.has(i)) out.push((answerKey[i] % 5) + 1); // distractor != เฉลย
    else out.push(answerKey[i]);
  }
  return out;
}

async function findUserByEmail(email) {
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) return hit;
    if (data.users.length < 200) break;
  }
  return null;
}

async function upsertStudent({ username, fullName }) {
  const email = usernameToEmail(username, domain);
  const existing = await findUserByEmail(email);
  let id;
  if (existing) {
    id = existing.id;
    await db.auth.admin.updateUserById(id, { password: PASS, email_confirm: true });
  } else {
    const { data, error } = await db.auth.admin.createUser({
      email, password: PASS, email_confirm: true,
      user_metadata: { username, full_name: fullName },
    });
    if (error) throw error;
    id = data.user.id;
  }
  await db.from("profiles").upsert(
    { id, role: "student", username, full_name: fullName },
    { onConflict: "id" }
  );
  return id;
}

async function getExamMap() {
  const codes = [...Object.values(EXAMS), PRACTICE_SRC, PRACTICE_CODE];
  const { data } = await db.from("exams").select("id, exam_code, total_questions").in("exam_code", codes);
  const m = {};
  for (const e of data ?? []) m[e.exam_code] = e;
  return m;
}

async function getKeys(examIds) {
  const { data } = await db.from("exam_answer_keys").select("exam_id, answers").in("exam_id", examIds);
  const m = {};
  for (const k of data ?? []) m[k.exam_id] = k.answers;
  return m;
}

/** สร้างชุดแบบฝึกหัด (practice) โดยคัดลอก html/เฉลยจากชุดจริง — idempotent */
async function ensurePracticeExam(examMap) {
  if (examMap[PRACTICE_CODE]) return examMap[PRACTICE_CODE];
  const src = examMap[PRACTICE_SRC];
  if (!src) throw new Error(`ไม่พบชุดต้นฉบับ ${PRACTICE_SRC}`);
  const { data: full } = await db
    .from("exams").select("exam_html, review_html, total_questions").eq("id", src.id).single();
  const { data: srcKey } = await db
    .from("exam_answer_keys").select("answers").eq("exam_id", src.id).single();
  const { data: exam, error } = await db.from("exams").upsert({
    title: "แบบฝึกหัด: กลศาสตร์ (Mock Practice)",
    exam_code: PRACTICE_CODE,
    kind: "practice",
    subject: "ฟิสิกส์ ม.6 (ฝึก)",
    duration_minutes: 60,
    total_questions: full.total_questions,
    exam_html: full.exam_html,
    review_html: full.review_html,
    status: "published",
  }, { onConflict: "exam_code" }).select("id, exam_code, total_questions").single();
  if (error) throw error;
  await db.from("exam_answer_keys").upsert({ exam_id: exam.id, answers: srcKey.answers }, { onConflict: "exam_id" });
  console.log(`  ✓ สร้างชุดแบบฝึกหัด ${PRACTICE_CODE}`);
  return exam;
}

async function cleanFor(studentIds) {
  for (const t of ["exam_surveys", "attempt_resets", "attempts", "assignments"]) {
    await db.from(t).delete().in("student_id", studentIds);
  }
}

async function main() {
  console.log("เชื่อม DB:", url);

  // 1) นักเรียน
  console.log("\n[1] นักเรียน");
  const ids = {};
  for (const s of STUDENTS) {
    ids[s.username] = await upsertStudent(s);
    console.log(`  ✓ ${s.username}  (${ids[s.username]})`);
  }
  const [A, B, C] = [ids.mock_arnon, ids.mock_bee, ids.mock_chai];
  const [D, E2, F, G, H] = [ids.mock_ploy, ids.mock_nat, ids.mock_fah, ids.mock_guy, ids.mock_hong];

  // ล้างข้อมูลเดิมของนักเรียน mock ทุกคน (idempotent)
  const allIds = Object.values(ids);
  await cleanFor(allIds);
  if (CLEAN_ONLY) { console.log(`\n✓ ล้างข้อมูล mock ของ ${allIds.length} คนแล้ว (--clean)`); return; }

  // tutor สำหรับ reset_by
  const { data: tutor } = await db.from("profiles").select("id").eq("role", "tutor").limit(1).single();

  // 2) exams + practice + keys
  let examMap = await getExamMap();
  const practice = await ensurePracticeExam(examMap);
  examMap[PRACTICE_CODE] = practice;
  const E = Object.fromEntries(Object.entries(EXAMS).map(([k, code]) => [k, examMap[code]]));
  const keyMap = await getKeys([...Object.values(E), practice].map((e) => e.id));

  // 3) เกณฑ์ผ่าน (ทดสอบ pass/fail ในหน้าผลสอบ)
  console.log("\n[2] เกณฑ์ผ่าน");
  await db.from("exams").update({ passing_score: 18 }).eq("id", E.S1.id);
  await db.from("exams").update({ passing_score: 20 }).eq("id", E.S3.id);
  console.log("  ✓ S1 ผ่าน≥18, S3 ผ่าน≥20 (ชุดอื่นใช้ค่าเริ่มต้น 50%)");

  // helper สร้าง assignment
  const assign = (examId, studentId, extra = {}) =>
    db.from("assignments").upsert(
      { exam_id: examId, student_id: studentId, ...extra },
      { onConflict: "exam_id,student_id" }
    );

  // helper สร้าง attempt (submitted/in_progress/expired)
  async function attempt(examId, studentId, opts) {
    const total = examMap[Object.keys(examMap).find((c) => examMap[c].id === examId)]?.total_questions ?? 30;
    const row = {
      exam_id: examId, student_id: studentId,
      status: opts.status, started_at: iso(opts.startedAt), total,
    };
    if (opts.status === "submitted") {
      const answers = buildAnswers(keyMap[examId], opts.score, { nulls: opts.nulls || 0 });
      row.submitted_at = iso(opts.submittedAt);
      row.answers = answers;
      row.score = opts.score;
      if (opts.reviewedAt) row.reviewed_at = iso(opts.reviewedAt);
    } else if (opts.status === "expired") {
      row.answers = opts.partial ? buildAnswers(keyMap[examId], opts.score || 0, { nulls: opts.nulls || 20 }) : null;
    }
    const { data, error } = await db.from("attempts").insert(row).select("id").single();
    if (error) throw error;
    return data.id;
  }

  // helper survey
  const survey = (attemptId, examId, studentId, s) =>
    db.from("exam_surveys").upsert({
      attempt_id: attemptId, exam_id: examId, student_id: studentId,
      difficulty: s.diff, time_adequacy: s.time, confidence: s.conf, stress: s.stress,
      hardest_topics: s.topics ?? null, comment: s.comment ?? null,
    }, { onConflict: "attempt_id" });

  console.log("\n[3] scenario");

  // ---------- S1 (เกณฑ์ผ่าน 18, timed) ----------
  await assign(E.S1.id, A); await assign(E.S1.id, B); await assign(E.S1.id, C);
  {
    const at = await attempt(E.S1.id, A, { status: "submitted", score: 27, startedAt: now - 3 * DAY, submittedAt: now - 3 * DAY + 52 * MIN, reviewedAt: now - 3 * DAY + 80 * MIN });
    await survey(at, E.S1.id, A, { diff: 2, time: 4, conf: 5, stress: 1, topics: "ไม่มี ทำได้หมด", comment: "ข้อสอบกำลังดี อยากได้แนวยากขึ้นอีกนิดครับ" });
  }
  {
    const at = await attempt(E.S1.id, B, { status: "submitted", score: 12, startedAt: now - 3 * DAY, submittedAt: now - 3 * DAY + 58 * MIN });
    await survey(at, E.S1.id, B, { diff: 5, time: 2, conf: 2, stress: 5, topics: "ไฟฟ้า, คลื่นนิ่ง", comment: "ทำไม่ทัน ข้อไฟฟ้ายากมากค่ะ อยากให้ติวเพิ่ม" });
  }
  // C: assigned เฉยๆ (ยังไม่เริ่ม)
  console.log("  ✓ S1: A 27/30✅ · B 12/30❌ · C ยังไม่เริ่ม");

  // ---------- S2 (duration override 45 นาที) ----------
  await assign(E.S2.id, A, { duration_override_min: 45 });
  await assign(E.S2.id, B, { duration_override_min: 45 });
  await assign(E.S2.id, C, { duration_override_min: 45 });
  {
    const at = await attempt(E.S2.id, A, { status: "submitted", score: 25, startedAt: now - 2 * DAY, submittedAt: now - 2 * DAY + 40 * MIN, reviewedAt: now - 2 * DAY + 70 * MIN });
    await survey(at, E.S2.id, A, { diff: 3, time: 3, conf: 4, stress: 2, topics: "โมเมนตัม", comment: "เวลา 45 นาทีค่อนข้างกระชับดีครับ" });
  }
  {
    const at = await attempt(E.S2.id, B, { status: "submitted", score: 14, startedAt: now - 2 * DAY, submittedAt: now - 2 * DAY + 45 * MIN });
    await survey(at, E.S2.id, B, { diff: 4, time: 2, conf: 2, stress: 4, topics: "งานและพลังงาน", comment: "ยังงงสูตรพลังงานอยู่ค่ะ" });
  }
  // C: หมดเวลา (expired) — ทำค้างไว้แล้วเลยเวลา
  await attempt(E.S2.id, C, { status: "expired", startedAt: now - 1 * DAY - 50 * MIN, partial: true, score: 6, nulls: 18 });
  console.log("  ✓ S2 (override 45น.): A 25/30 · B 14/30 · C หมดเวลา");

  // ---------- S3 (เกณฑ์ผ่าน 20) + ประวัติ reset ----------
  await assign(E.S3.id, A); await assign(E.S3.id, B); await assign(E.S3.id, C);
  {
    const at = await attempt(E.S3.id, A, { status: "submitted", score: 22, startedAt: now - 5 * DAY, submittedAt: now - 5 * DAY + 55 * MIN, reviewedAt: now - 5 * DAY + 90 * MIN });
    await survey(at, E.S3.id, A, { diff: 3, time: 3, conf: 4, stress: 2, topics: "ฟิสิกส์อะตอม", comment: "TBAT แนวนี้ชอบครับ" });
  }
  // B: เคยส่ง 9/30 แล้วเน็ตหลุด → ติวเตอร์ reset → ทำใหม่ได้ 16/30 (ยังไม่ผ่าน)
  await db.from("attempt_resets").insert({
    exam_id: E.S3.id, student_id: B, reset_by: tutor?.id ?? null,
    reset_at: iso(now - 4 * DAY),
    prev_status: "submitted", prev_score: 9, prev_total: 30,
    prev_answers: buildAnswers(keyMap[E.S3.id], 9, { nulls: 8 }),
    prev_started_at: iso(now - 4 * DAY - 30 * MIN),
    prev_submitted_at: iso(now - 4 * DAY - 5 * MIN),
  });
  {
    const at = await attempt(E.S3.id, B, { status: "submitted", score: 16, startedAt: now - 3 * DAY, submittedAt: now - 3 * DAY + 57 * MIN });
    await survey(at, E.S3.id, B, { diff: 5, time: 3, conf: 3, stress: 4, topics: "ฟิสิกส์นิวเคลียร์", comment: "รอบนี้ดีขึ้นค่ะ ขอบคุณที่รีเซ็ตให้ทำใหม่" });
  }
  // C: ยังไม่เริ่ม
  console.log("  ✓ S3 (ผ่าน≥20): A 22/30✅ · B reset(9→16)❌ · C ยังไม่เริ่ม");

  // ---------- S4 (ไม่จับเวลา / untimed) ----------
  await assign(E.S4.id, A, { untimed: true });
  await assign(E.S4.id, B, { untimed: true });
  await assign(E.S4.id, C, { untimed: true });
  {
    const at = await attempt(E.S4.id, A, { status: "submitted", score: 24, startedAt: now - 6 * HOUR, submittedAt: now - 6 * HOUR + 73 * MIN });
    await survey(at, E.S4.id, A, { diff: 3, time: 5, conf: 4, stress: 1, topics: "—", comment: "ไม่จับเวลาทำให้คิดได้ละเอียดขึ้นครับ" });
  }
  {
    const at = await attempt(E.S4.id, B, { status: "submitted", score: 13, startedAt: now - 5 * HOUR, submittedAt: now - 5 * HOUR + 95 * MIN, nulls: 4 });
    await survey(at, E.S4.id, B, { diff: 5, time: 5, conf: 2, stress: 3, topics: "การเคลื่อนที่แบบหมุน", comment: "ถึงไม่จับเวลาก็ยังทำข้อท้ายๆ ไม่ได้ค่ะ" });
  }
  // C: กำลังทำอยู่ (in_progress) — untimed เริ่มมา 2 ชม.แล้วไม่มี timer กดดัน
  await attempt(E.S4.id, C, { status: "in_progress", startedAt: now - 2 * HOUR });
  console.log("  ✓ S4 (untimed): A 24/30 · B 13/30 · C กำลังทำอยู่");

  // ---------- S5 (เปิดสอบล่วงหน้า — window) ----------
  const win = { open_at: iso(now + 1 * DAY), close_at: iso(now + 8 * DAY), due_at: iso(now + 7 * DAY) };
  await assign(E.S5.id, A, win); await assign(E.S5.id, B, win); await assign(E.S5.id, C, win);
  console.log("  ✓ S5 (เปิดพรุ่งนี้–อีก 8 วัน): A/B/C มอบหมายแล้ว ยังไม่ถึงเวลาเปิด");

  // ---------- Practice (ทำซ้ำได้) ----------
  await assign(practice.id, A); await assign(practice.id, C);
  {
    const at = await attempt(practice.id, A, { status: "submitted", score: 28, startedAt: now - 1 * DAY, submittedAt: now - 1 * DAY + 35 * MIN });
    await survey(at, practice.id, A, { diff: 2, time: 5, conf: 5, stress: 1, topics: "—", comment: "ฝึกเพลินดีครับ" });
  }
  {
    const at = await attempt(practice.id, C, { status: "submitted", score: 20, startedAt: now - 8 * HOUR, submittedAt: now - 8 * HOUR + 50 * MIN });
    await survey(at, practice.id, C, { diff: 4, time: 4, conf: 3, stress: 2, topics: "เวกเตอร์", comment: "ขอฝึกชุดนี้เพิ่มได้ไหมครับ" });
  }
  console.log("  ✓ Practice: A 28/30 · C 20/30 (B ไม่ได้รับมอบหมาย)");

  // ====== นักเรียนเพิ่มอีก 5 คน (D–H) ใช้ค่าชุดเดิม: S2 override45 · S4 untimed · S5 window ======

  // ---------- D · พลอย: ปริ่มเกณฑ์ (borderline ผ่าน/ไม่ผ่านเฉียดฉิว) ----------
  await assign(E.S1.id, D); await assign(E.S2.id, D, { duration_override_min: 45 });
  await assign(E.S3.id, D); await assign(E.S4.id, D, { untimed: true }); await assign(E.S5.id, D, win);
  {
    const at = await attempt(E.S1.id, D, { status: "submitted", score: 18, startedAt: now - 3 * DAY, submittedAt: now - 3 * DAY + 59 * MIN });
    await survey(at, E.S1.id, D, { diff: 4, time: 2, conf: 3, stress: 4, topics: "ไฟฟ้า", comment: "ผ่านแบบหวุดหวิด ขอโจทย์ไฟฟ้าเพิ่มค่ะ" });
  }
  {
    const at = await attempt(E.S3.id, D, { status: "submitted", score: 19, startedAt: now - 2 * DAY, submittedAt: now - 2 * DAY + 58 * MIN });
    await survey(at, E.S3.id, D, { diff: 4, time: 3, conf: 3, stress: 4, topics: "ฟิสิกส์อะตอม", comment: "ขาดข้อเดียวเองค่ะ เสียดายมาก" });
  }
  await attempt(E.S2.id, D, { status: "submitted", score: 16, startedAt: now - 4 * DAY, submittedAt: now - 4 * DAY + 44 * MIN });
  console.log("  ✓ D พลอย: S1 18/30✅(ปริ่ม) · S3 19/30❌(ขาด1) · S2 16/30");

  // ---------- E · ณัฐ: ขาดสอบ (มอบหมายครบแต่ไม่เริ่มเลย) ----------
  await assign(E.S1.id, E2); await assign(E.S2.id, E2, { duration_override_min: 45 });
  await assign(E.S3.id, E2); await assign(E.S4.id, E2, { untimed: true }); await assign(E.S5.id, E2, win);
  console.log("  ✓ E ณัฐ: มอบหมาย 5 ชุด ไม่เริ่มเลยสักชุด (no-show)");

  // ---------- F · ฟ้า: สม่ำเสมอกลางๆ (ทำครบ คะแนนนิ่ง 17–19) ----------
  await assign(E.S1.id, F); await assign(E.S2.id, F, { duration_override_min: 45 });
  await assign(E.S3.id, F); await assign(E.S4.id, F, { untimed: true }); await assign(E.S5.id, F, win);
  {
    const at = await attempt(E.S1.id, F, { status: "submitted", score: 19, startedAt: now - 3 * DAY, submittedAt: now - 3 * DAY + 55 * MIN });
    await survey(at, E.S1.id, F, { diff: 3, time: 3, conf: 3, stress: 3, topics: "คลื่น", comment: "พอทำได้ค่ะ" });
  }
  {
    const at = await attempt(E.S2.id, F, { status: "submitted", score: 17, startedAt: now - 2 * DAY, submittedAt: now - 2 * DAY + 43 * MIN });
    await survey(at, E.S2.id, F, { diff: 3, time: 3, conf: 3, stress: 3, topics: "พลังงาน", comment: null });
  }
  {
    const at = await attempt(E.S3.id, F, { status: "submitted", score: 18, startedAt: now - 1 * DAY, submittedAt: now - 1 * DAY + 56 * MIN });
    await survey(at, E.S3.id, F, { diff: 3, time: 3, conf: 4, stress: 2, topics: "—", comment: "ชอบ TBAT มากกว่า CU-ATS ค่ะ" });
  }
  await attempt(E.S4.id, F, { status: "submitted", score: 18, startedAt: now - 7 * HOUR, submittedAt: now - 7 * HOUR + 80 * MIN });
  console.log("  ✓ F ฟ้า: S1 19 · S2 17 · S3 18 · S4 18 (สม่ำเสมอ)");

  // ---------- G · กาย: คะแนนแกว่งหนัก (ดีมาก ↔ ตกหนัก) ----------
  await assign(E.S1.id, G); await assign(E.S2.id, G, { duration_override_min: 45 });
  await assign(E.S3.id, G); await assign(E.S4.id, G, { untimed: true }); await assign(E.S5.id, G, win);
  {
    const at = await attempt(E.S1.id, G, { status: "submitted", score: 26, startedAt: now - 3 * DAY, submittedAt: now - 3 * DAY + 38 * MIN });
    await survey(at, E.S1.id, G, { diff: 2, time: 5, conf: 5, stress: 1, topics: "—", comment: "ชุดนี้ตรงที่อ่านมาพอดีเลยครับ" });
  }
  {
    const at = await attempt(E.S2.id, G, { status: "submitted", score: 9, startedAt: now - 2 * DAY, submittedAt: now - 2 * DAY + 45 * MIN });
    await survey(at, E.S2.id, G, { diff: 5, time: 1, conf: 1, stress: 5, topics: "งานและพลังงาน, โมเมนตัม", comment: "ชุดนี้พังเลยครับ ไม่ได้อ่านบทนี้มา" });
  }
  {
    const at = await attempt(E.S3.id, G, { status: "submitted", score: 17, startedAt: now - 1 * DAY, submittedAt: now - 1 * DAY + 50 * MIN });
    await survey(at, E.S3.id, G, { diff: 4, time: 3, conf: 3, stress: 3, topics: "นิวเคลียร์", comment: null });
  }
  await attempt(E.S4.id, G, { status: "submitted", score: 23, startedAt: now - 4 * HOUR, submittedAt: now - 4 * HOUR + 65 * MIN });
  console.log("  ✓ G กาย: S1 26 · S2 9 · S3 17 · S4 23 (แกว่งหนัก)");

  // ---------- H · หงส์: สายฝึก + กำลังทำหลายชุด + survey ไม่ครบ ----------
  await assign(E.S1.id, H); await assign(E.S2.id, H, { duration_override_min: 45 });
  await assign(E.S4.id, H, { untimed: true }); await assign(practice.id, H);
  // ส่ง S1 แต่ "ไม่กรอกแบบสอบถาม" → ทดสอบ survey count < submitted
  await attempt(E.S1.id, H, { status: "submitted", score: 21, startedAt: now - 2 * DAY, submittedAt: now - 2 * DAY + 60 * MIN });
  // กำลังทำค้างไว้ 2 ชุด
  await attempt(E.S2.id, H, { status: "in_progress", startedAt: now - 20 * MIN });
  await attempt(E.S4.id, H, { status: "in_progress", startedAt: now - 90 * MIN });
  // practice ทำซ้ำ คะแนนดี + กรอก survey
  {
    const at = await attempt(practice.id, H, { status: "submitted", score: 26, startedAt: now - 5 * HOUR, submittedAt: now - 5 * HOUR + 40 * MIN });
    await survey(at, practice.id, H, { diff: 2, time: 5, conf: 4, stress: 1, topics: "—", comment: "ขอชุดฝึกเพิ่มอีกได้ไหมครับ ติดใจ" });
  }
  console.log("  ✓ H หงส์: S1 21/30(ไม่กรอก survey) · S2/S4 กำลังทำ · Practice 26/30");

  console.log("\n✓ เสร็จสิ้น — ดูได้ที่หน้า /tutor (ภาพรวม · นักเรียน · มอบหมาย · ผลสอบ)");
  console.log(`  ล็อกอินนักเรียนทดสอบ (8 คน): ${STUDENTS.map((s) => s.username).join(" / ")}  รหัสผ่าน: ${PASS}`);
}

main().catch((e) => { console.error("✗ ผิดพลาด:", e.message); process.exit(1); });
