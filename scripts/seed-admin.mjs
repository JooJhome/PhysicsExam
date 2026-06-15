// สร้าง/อัปเดตบัญชี Admin (role = tutor — ผู้ควบคุมระบบทั้งหมดในเว็บ) ผ่าน service-role
//   node scripts/seed-admin.mjs                       (ค่าเริ่มต้น: admin / Admin@Bsiink2026)
//   node scripts/seed-admin.mjs --user=admin --pass=YourStrongPass123
import { createClient } from "@supabase/supabase-js";
import { getAdminEnv, usernameToEmail } from "./_env.mjs";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)=(.*)$/);
    return m ? [m[1], m[2]] : [a.replace(/^--/, ""), true];
  })
);

const { url, key, domain } = getAdminEnv();
const db = createClient(url, key, { auth: { persistSession: false } });

const USER = String(args.user || "admin").trim().toLowerCase();
const PASS = String(args.pass || "Admin@Bsiink2026");
const FULL = String(args.name || "ผู้ดูแลระบบ (Admin)");
const email = usernameToEmail(USER, domain);

async function findUserByEmail() {
  for (let p = 1; p <= 50; p++) {
    const { data, error } = await db.auth.admin.listUsers({ page: p, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) return hit;
    if (data.users.length < 200) break;
  }
  return null;
}

async function main() {
  if (PASS.length < 6) {
    console.error("✗ รหัสผ่านอย่างน้อย 6 ตัวอักษร");
    process.exit(1);
  }
  const existing = await findUserByEmail();
  let id;
  if (existing) {
    id = existing.id;
    const { error } = await db.auth.admin.updateUserById(id, { password: PASS, email_confirm: true });
    if (error) throw error;
    console.log(`• พบบัญชีเดิม ${USER} — อัปเดตรหัสผ่าน + ยืนยันเป็น tutor`);
  } else {
    const { data, error } = await db.auth.admin.createUser({
      email, password: PASS, email_confirm: true,
      user_metadata: { username: USER, full_name: FULL },
    });
    if (error) throw error;
    id = data.user.id;
    console.log(`• สร้างบัญชีใหม่ ${USER}`);
  }
  // role = tutor = ควบคุมทั้งระบบ (is_tutor() = true)
  const { error: pErr } = await db.from("profiles").upsert(
    { id, role: "tutor", username: USER, full_name: FULL },
    { onConflict: "id" }
  );
  if (pErr) throw pErr;

  console.log("\n✓ Admin พร้อมใช้งาน (role = tutor · ควบคุมทั้งระบบในเว็บ)");
  console.log(`  เข้าระบบที่ /login`);
  console.log(`  Username : ${USER}`);
  console.log(`  Password : ${PASS}`);
  console.log(`  Email    : ${email}`);
  console.log(`\n  ⚠️ ควรเปลี่ยนรหัสผ่านหลังเข้าใช้ครั้งแรก: node scripts/seed-admin.mjs --pass=รหัสใหม่`);
}

main().catch((e) => { console.error("✗ ผิดพลาด:", e.message); process.exit(1); });
