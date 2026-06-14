// smoke-test ตรรกะหน้า tutor (จำลอง getResults/breakdown/surveys/assignment) เทียบ UAT
// ใช้ service-role อ่านข้อมูลจริง แล้ว assert ค่าที่ UAT คาดหวัง
//   node scripts/smoke-tutor.mjs
import { createClient } from "@supabase/supabase-js";
import { getAdminEnv } from "./_env.mjs";

const { url, key } = getAdminEnv();
const db = createClient(url, key, { auth: { persistSession: false } });

let pass = 0, fail = 0;
function check(name, cond, detail = "") {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}  ${detail}`); }
}
const DEFAULT_PASS = (total) => Math.ceil((total || 30) * 0.5);

const [{ data: exams }, { data: students }, { data: asg }, { data: att }, { data: keys }, { data: surveys }, { data: resets }] =
  await Promise.all([
    db.from("exams").select("id, exam_code, title, kind, total_questions, passing_score, status"),
    db.from("profiles").select("id, username, full_name").eq("role", "student"),
    db.from("assignments").select("exam_id, student_id, untimed, open_at, close_at, duration_override_min"),
    db.from("attempts").select("id, exam_id, student_id, status, score, total, answers, started_at, submitted_at"),
    db.from("exam_answer_keys").select("exam_id, answers"),
    db.from("exam_surveys").select("exam_id, student_id, difficulty, time_adequacy, confidence, stress, hardest_topics, comment"),
    db.from("attempt_resets").select("exam_id, student_id, prev_score, prev_status"),
  ]);

const exById = new Map(exams.map((e) => [e.id, e]));
const idOf = (code) => exams.find((e) => e.exam_code === code)?.id;
const stuId = (u) => students.find((s) => s.username === u)?.id;
const keyOf = (eid) => keys.find((k) => k.exam_id === eid)?.answers;

const S1 = idOf("CU-ATS_Aug2026"), S2 = idOf("CU-ATS_Oct2026"), S3 = idOf("TBAT_Dec2026"),
      S4 = idOf("CU-ATS_Feb2027"), S5 = idOf("CU-ATS_Apr2027"), PR = idOf("PRACTICE_MOCK_01");
const A = stuId("mock_arnon"), B = stuId("mock_bee"), C = stuId("mock_chai"),
      D = stuId("mock_ploy"), E = stuId("mock_nat"), H = stuId("mock_hong");

// ---------- E.1 tiles (getResults) ----------
console.log("\n[E.1] tiles + ผ่าน/ไม่ผ่าน (getResults)");
const graded = new Set(exams.filter((e) => e.kind !== "practice").map((e) => e.id));
const gAtt = att.filter((a) => graded.has(a.exam_id));
const sub = gAtt.filter((a) => a.status === "submitted" && a.score != null);
const inprog = gAtt.filter((a) => a.status === "in_progress").length;
const attKey = new Set(gAtt.map((a) => `${a.exam_id}|${a.student_id}`));
const notStarted = asg.filter((a) => graded.has(a.exam_id) && !attKey.has(`${a.exam_id}|${a.student_id}`)).length;
// tile รวมทั้งระบบ = ค่า volatile (มี E2E exam + นักเรียนเดิมปน) → รายงานเป็นข้อมูล ไม่ assert
console.log(`  · (info) tile รวมทั้งระบบ: ส่งแล้ว ${sub.length} · กำลังทำ ${inprog} · ยังไม่เริ่ม ${notStarted}`);
// assert เฉพาะส่วน mock (เสถียร)
const MOCK = new Set([A, B, C, D, E, stuId("mock_fah"), stuId("mock_guy"), H]);
const mSub = sub.filter((a) => MOCK.has(a.student_id)).length;
const mInprog = gAtt.filter((a) => a.status === "in_progress" && MOCK.has(a.student_id)).length;
const mNotStarted = asg.filter((a) => graded.has(a.exam_id) && MOCK.has(a.student_id) && !attKey.has(`${a.exam_id}|${a.student_id}`)).length;
check("mock: ส่งแล้ว = 20", mSub === 20, `got ${mSub}`);
check("mock: กำลังทำ = 3", mInprog === 3, `got ${mInprog}`);
check("mock: ยังไม่เริ่ม = 14", mNotStarted === 14, `got ${mNotStarted}`);

const passOf = (eid) => exById.get(eid)?.passing_score ?? DEFAULT_PASS(exById.get(eid)?.total_questions);
const scoreOf = (eid, sid) => sub.find((a) => a.exam_id === eid && a.student_id === sid)?.score;
check("S1 เกณฑ์ผ่าน = 18", passOf(S1) === 18, `got ${passOf(S1)}`);
check("S3 เกณฑ์ผ่าน = 20", passOf(S3) === 20, `got ${passOf(S3)}`);
check("A·S1 27 ผ่าน", scoreOf(S1, A) >= passOf(S1));
check("B·S1 12 ไม่ผ่าน", scoreOf(S1, B) < passOf(S1));
check("D·S1 18 ผ่าน (ปริ่ม)", scoreOf(S1, D) >= passOf(S1), `score ${scoreOf(S1, D)} pass ${passOf(S1)}`);
check("D·S3 19 ไม่ผ่าน (ขาด1)", scoreOf(S3, D) < passOf(S3), `score ${scoreOf(S3, D)} pass ${passOf(S3)}`);

// expired ไม่นับ / practice ถูกตัด
check("E-05 C·S2 expired ไม่อยู่ในรายการส่ง",
  !sub.some((a) => a.exam_id === S2 && a.student_id === C) &&
  att.some((a) => a.exam_id === S2 && a.student_id === C && a.status === "expired"));
check("E-06 practice ไม่อยู่ในผลสอบ", !graded.has(PR) && PR != null);

// ---------- E.5 breakdown S1 (getExamBreakdown) ----------
console.log("\n[E.5] วิเคราะห์รายข้อ S1 (getExamBreakdown)");
const k1 = keyOf(S1);
const subS1 = sub.filter((a) => a.exam_id === S1 && Array.isArray(a.answers));
const items = [];
for (let i = 0; i < (exById.get(S1).total_questions); i++) {
  let answered = 0, correct = 0; const wrong = new Map();
  for (const a of subS1) {
    const ch = a.answers[i];
    if (ch == null) continue;
    answered++;
    if (ch === k1[i]) correct++; else wrong.set(ch, (wrong.get(ch) ?? 0) + 1);
  }
  let tw = null, twc = 0;
  for (const [ch, ct] of wrong) if (ct > twc) { tw = ch; twc = ct; }
  items.push({ n: i + 1, answered, correct, pct: answered ? Math.round(correct / answered * 100) : 0, tw, twc });
}
items.sort((a, b) => a.pct - b.pct);
check("ผู้ส่ง S1 = 8 คน", subS1.length === 8, `got ${subS1.length}`);
check("เรียงข้อยากสุดก่อน (pct ขึ้นจากน้อย)", items[0].pct <= items[items.length - 1].pct);
check("ข้อยากสุดมี topWrongChoice", items[0].tw != null && items[0].tw >= 1 && items[0].tw <= 5);
check("มีข้อ %ถูกต่ำ (<40 แดง) อย่างน้อย 1", items.some((it) => it.pct < 40));

// ---------- E.4 surveys S1 (getExamSurveys) ----------
console.log("\n[E.4] แบบสอบถาม S1 (getExamSurveys)");
const svS1 = surveys.filter((s) => s.exam_id === S1);
const avg = (f) => Math.round(svS1.reduce((s, r) => s + r[f], 0) / svS1.length * 10) / 10;
check("survey count < ผู้ส่ง (H ไม่กรอก)", svS1.length < subS1.length, `survey ${svS1.length} sub ${subS1.length}`);
check("H ส่ง S1 แต่ไม่มี survey",
  sub.some((a) => a.exam_id === S1 && a.student_id === H) && !svS1.some((s) => s.student_id === H));
check("ค่าเฉลี่ย 4 ด้านคำนวณได้", [avg("difficulty"), avg("time_adequacy"), avg("confidence"), avg("stress")].every(Number.isFinite));
check("มีคอมเมนต์ของ B (ไฟฟ้ายากมาก)",
  svS1.some((s) => s.student_id === B && /ไฟฟ้า/.test(s.hardest_topics || "")));

// ---------- D. assignment detail (getExamAssignment) ----------
console.log("\n[D] มอบหมาย: untimed / window / override / สถานะ");
const asgRow = (eid, sid) => asg.find((a) => a.exam_id === eid && a.student_id === sid);
check("D-04 S4 untimed = true", asgRow(S4, A)?.untimed === true);
check("D-06 S2 override = 45", asgRow(S2, A)?.duration_override_min === 45, `got ${asgRow(S2, A)?.duration_override_min}`);
check("D-05 S5 มี open_at (window)", asgRow(S5, A)?.open_at != null);
check("D-05 S5 open_at อยู่ในอนาคต", new Date(asgRow(S5, A).open_at) > new Date());
const stateOf = (eid, sid) => att.find((a) => a.exam_id === eid && a.student_id === sid)?.status ?? "none";
check("D-07 A·S1 submitted (ล็อก)", stateOf(S1, A) === "submitted");
check("D-07 E·S1 none (ว่าง)", stateOf(S1, E) === "none");
check("D-09 C·S4 in_progress (ทำอยู่)", stateOf(S4, C) === "in_progress");

// ---------- E.6 reset audit ----------
console.log("\n[E.6] ประวัติ reset (attempt_resets)");
const rB = resets.filter((r) => r.student_id === B && r.exam_id === S3);
check("E-51 B·S3 มีประวัติ reset 1 แถว", rB.length === 1, `got ${rB.length}`);
check("E-51 prev_score = 9", rB[0]?.prev_score === 9, `got ${rB[0]?.prev_score}`);
check("B·S3 ทำใหม่ได้ 16 (ปัจจุบัน)", scoreOf(S3, B) === 16, `got ${scoreOf(S3, B)}`);

console.log(`\n${fail === 0 ? "✓ ผ่านทั้งหมด" : "✗ มีที่ไม่ผ่าน"} — pass ${pass} / fail ${fail}`);
process.exit(fail === 0 ? 0 : 1);
