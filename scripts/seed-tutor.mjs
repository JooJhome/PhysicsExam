// สร้าง/อัปเดตบัญชี tutor ผ่าน service-role (ข้าม RLS)
//   ใช้:  node scripts/seed-tutor.mjs <username> <password> [full_name]
//   เช่น: node scripts/seed-tutor.mjs Bsiink 29121994 "BSIINK Tutor"
import { createClient } from "@supabase/supabase-js";
import { getAdminEnv, usernameToEmail } from "./_env.mjs";

const [username, password, fullName] = process.argv.slice(2);
if (!username || !password) {
  console.error('ใช้: node scripts/seed-tutor.mjs <username> <password> ["full name"]');
  process.exit(1);
}

const { url, key, domain } = getAdminEnv();
const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const email = usernameToEmail(username, domain);

async function findUserByEmail(targetEmail) {
  // page ผ่าน listUsers หา email ที่ตรง (ผู้ใช้ระบบนี้มีไม่มาก)
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === targetEmail);
    if (hit) return hit;
    if (data.users.length < 200) break;
  }
  return null;
}

let userId;
const existing = await findUserByEmail(email);
if (existing) {
  userId = existing.id;
  const { error } = await admin.auth.admin.updateUserById(userId, {
    password,
    email_confirm: true,
  });
  if (error) throw error;
  console.log(`อัปเดตรหัสผ่าน user เดิม: ${email}`);
} else {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  userId = data.user.id;
  console.log(`สร้าง auth user ใหม่: ${email}`);
}

const { error: pErr } = await admin.from("profiles").upsert(
  {
    id: userId,
    role: "tutor",
    username,
    full_name: fullName || username,
  },
  { onConflict: "id" }
);
if (pErr) throw pErr;

console.log("✅ เสร็จ — tutor พร้อมใช้");
console.log(`   username : ${username}`);
console.log(`   login email (ภายใน): ${email}`);
console.log(`   role     : tutor`);
console.log(`   user id  : ${userId}`);
