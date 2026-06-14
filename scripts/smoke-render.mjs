// smoke-test การ render หน้า tutor จริง (ผ่าน HTTP + session cookie)
//   - สร้าง tutor ชั่วคราว → ล็อกอินได้ session → ประกอบ cookie แบบ @supabase/ssr
//   - GET หน้า tutor แล้วตรวจว่า mock data โผล่ใน HTML จริง
//   - ลบ tutor ชั่วคราวทิ้งเสมอ (cleanup)
//   ต้องรัน dev server ไว้ที่ :3000 ก่อน
//   node scripts/smoke-render.mjs
import { createRequire } from "node:module";
import { createClient } from "@supabase/supabase-js";
import { getAdminEnv, loadEnv, usernameToEmail } from "./_env.mjs";

const require = createRequire(import.meta.url);
const { createChunks } = require("@supabase/ssr/dist/main/utils/chunker.js");

loadEnv();
const { url, key, domain } = getAdminEnv();
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const BASE = process.env.SMOKE_BASE || "http://localhost:3000";
const ref = new URL(url).host.split(".")[0]; // project ref
const COOKIE_BASE = `sb-${ref}-auth-token`;

const admin = createClient(url, key, { auth: { persistSession: false } });
const pub = createClient(url, anon, { auth: { persistSession: false } });

const USER = "smoke_tutor_tmp";
const PASS = "SmokeTutor123!";
const email = usernameToEmail(USER, domain);

function base64url(str) {
  return Buffer.from(str, "utf8").toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function sessionCookies(session) {
  const value = "base64-" + base64url(JSON.stringify(session));
  return createChunks(COOKIE_BASE, value); // [{name,value}] หรือ chunked .0/.1
}

let pass = 0, fail = 0;
const check = (name, cond, detail = "") =>
  cond ? (pass++, console.log(`  ✓ ${name}`)) : (fail++, console.log(`  ✗ ${name}  ${detail}`));

async function findUser() {
  for (let p = 1; p <= 50; p++) {
    const { data } = await admin.auth.admin.listUsers({ page: p, perPage: 200 });
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) return hit;
    if (data.users.length < 200) break;
  }
  return null;
}

async function main() {
  // 0) cleanup เก่า (กันค้าง)
  const old = await findUser();
  if (old) await admin.auth.admin.deleteUser(old.id);

  // 1) สร้าง tutor ชั่วคราว
  const { data: created, error: cErr } = await admin.auth.admin.createUser({
    email, password: PASS, email_confirm: true,
  });
  if (cErr) throw cErr;
  const uid = created.user.id;
  await admin.from("profiles").upsert({ id: uid, role: "tutor", username: USER, full_name: "Smoke Tutor (tmp)" });
  console.log(`สร้าง tutor ชั่วคราว: ${USER}`);

  try {
    // 2) ล็อกอินได้ session
    const { data: signIn, error: sErr } = await pub.auth.signInWithPassword({ email, password: PASS });
    if (sErr) throw sErr;
    const cookies = sessionCookies(signIn.session);
    const cookieHeader = cookies.map((c) => `${c.name}=${encodeURIComponent(c.value)}`).join("; ");
    console.log(`session cookie: ${cookies.length} chunk(s)`);

    const get = async (path) => {
      const res = await fetch(BASE + path, { headers: { cookie: cookieHeader }, redirect: "manual" });
      const body = res.status === 200 ? await res.text() : "";
      return { status: res.status, body };
    };

    // 3) ตรวจ render แต่ละหน้า
    console.log("\n[render] /tutor/results");
    const results = await get("/tutor/results");
    check("เข้าถึงได้ (200 ไม่ redirect)", results.status === 200, `status ${results.status}`);
    check("หัวข้อ 'ผลสอบ'", results.body.includes("ผลสอบ"));
    check("ปุ่ม 'ดาวน์โหลด CSV'", results.body.includes("ดาวน์โหลด CSV"));
    check("tile 'กำลังทำ'", results.body.includes("กำลังทำ"));
    check("นักเรียน mock โผล่ (อานนท์)", results.body.includes("อานนท์"));
    check("ป้าย 'ผ่าน' หรือ 'ไม่ผ่าน'", results.body.includes("ผ่าน"));

    console.log("\n[render] /tutor/assign");
    const assign = await get("/tutor/assign");
    check("เข้าถึงได้ (200)", assign.status === 200, `status ${assign.status}`);
    check("ชุด CU-ATS โผล่", assign.body.includes("CU-ATS"));
    check("ปุ่ม 'มอบหมาย'", assign.body.includes("มอบหมาย"));

    console.log("\n[render] /tutor/exams");
    const exams = await get("/tutor/exams");
    check("เข้าถึงได้ (200)", exams.status === 200, `status ${exams.status}`);
    check("ป้าย 'แบบฝึกหัด' (practice)", exams.body.includes("แบบฝึกหัด"));

    console.log("\n[render] /tutor/students");
    const students = await get("/tutor/students");
    check("เข้าถึงได้ (200)", students.status === 200, `status ${students.status}`);
    check("นักเรียน mock โผล่ (mock_)", students.body.includes("mock_"));

    console.log("\n[render] /tutor (ภาพรวม)");
    const overview = await get("/tutor");
    check("เข้าถึงได้ (200)", overview.status === 200, `status ${overview.status}`);
  } finally {
    // 4) ลบ tutor ชั่วคราว
    await admin.auth.admin.deleteUser(uid);
    console.log(`\nลบ tutor ชั่วคราวแล้ว`);
  }

  console.log(`\n${fail === 0 ? "✓ render ผ่านทั้งหมด" : "✗ มีที่ไม่ผ่าน"} — pass ${pass} / fail ${fail}`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error("✗ ผิดพลาด:", e.message); process.exit(1); });
