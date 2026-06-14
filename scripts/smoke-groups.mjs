// smoke-test ฟีเจอร์กลุ่ม/ห้องเรียน (migration 0011) ผ่าน service-role
//   node scripts/smoke-groups.mjs
import { createClient } from "@supabase/supabase-js";
import { getAdminEnv } from "./_env.mjs";

const { url, key } = getAdminEnv();
const db = createClient(url, key, { auth: { persistSession: false } });

let pass = 0, fail = 0;
function check(name, cond, detail = "") {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}  ${detail}`); }
}

// 1) ตารางมีอยู่ + query ได้
const g0 = await db.from("groups").select("id").limit(1);
check("ตาราง groups มีอยู่", !g0.error, g0.error?.message ?? "");
const m0 = await db.from("group_members").select("group_id").limit(1);
check("ตาราง group_members มีอยู่", !m0.error, m0.error?.message ?? "");

// 2) หานักเรียนจริงมาทดสอบ
const { data: students } = await db
  .from("profiles").select("id, username").eq("role", "student").limit(2);
check("มีนักเรียนให้ทดสอบ ≥1", (students?.length ?? 0) >= 1, `got ${students?.length ?? 0}`);

let createdGroupId = null;
if ((students?.length ?? 0) >= 1) {
  // 3) สร้างกลุ่ม
  const ins = await db.from("groups").insert({ name: "__smoke_group__" }).select("id").single();
  check("สร้างกลุ่มได้", !ins.error && !!ins.data?.id, ins.error?.message ?? "");
  createdGroupId = ins.data?.id ?? null;

  if (createdGroupId) {
    // 4) เพิ่มสมาชิก
    const rows = students.map((s) => ({ group_id: createdGroupId, student_id: s.id }));
    const mem = await db.from("group_members").insert(rows);
    check("เพิ่มสมาชิกได้", !mem.error, mem.error?.message ?? "");

    // 5) อ่านกลับ (mirror getGroups)
    const back = await db.from("group_members").select("student_id").eq("group_id", createdGroupId);
    check("อ่านสมาชิกกลับครบ", (back.data?.length ?? 0) === students.length, `got ${back.data?.length}`);

    // 6) cascade: ลบกลุ่มแล้ว group_members ต้องหายตาม
    await db.from("groups").delete().eq("id", createdGroupId);
    const after = await db.from("group_members").select("student_id").eq("group_id", createdGroupId);
    check("ลบกลุ่ม → สมาชิก cascade หาย", (after.data?.length ?? 0) === 0, `got ${after.data?.length}`);

    // 7) นักเรียนยังอยู่ (ไม่โดน cascade ผิดทาง)
    const stillThere = await db.from("profiles").select("id").eq("id", students[0].id).single();
    check("ลบกลุ่มไม่กระทบบัญชีนักเรียน", !stillThere.error && !!stillThere.data, stillThere.error?.message ?? "");
  }
}

console.log(`\nผล: ${pass} ผ่าน · ${fail} ไม่ผ่าน`);
process.exit(fail > 0 ? 1 : 0);
