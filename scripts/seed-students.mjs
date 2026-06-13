// สร้าง/อัปเดตบัญชีนักเรียน ผ่าน service-role (ข้าม RLS)
//   ทีละคน: node scripts/seed-students.mjs <username> <password> ["full name"]
//   จาก CSV: node scripts/seed-students.mjs --csv students.csv
//            (CSV ต่อบรรทัด: username,password,full_name)
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { getAdminEnv, usernameToEmail } from "./_env.mjs";

const { url, key, domain } = getAdminEnv();
const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function parseArgs() {
  const a = process.argv.slice(2);
  if (a[0] === "--csv") {
    const raw = readFileSync(a[1], "utf8");
    return raw
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"))
      .map((l) => {
        const [username, password, ...rest] = l.split(",").map((s) => s.trim());
        return { username, password, fullName: rest.join(",") || username };
      });
  }
  const [username, password, fullName] = a;
  if (!username || !password) {
    console.error('ใช้: node scripts/seed-students.mjs <username> <password> ["full name"]  |  --csv <file>');
    process.exit(1);
  }
  return [{ username, password, fullName: fullName || username }];
}

async function findUserByEmail(email) {
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === email);
    if (hit) return hit;
    if (data.users.length < 200) break;
  }
  return null;
}

async function upsertStudent({ username, password, fullName }) {
  const email = usernameToEmail(username, domain);
  const existing = await findUserByEmail(email);
  let userId;
  if (existing) {
    userId = existing.id;
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
    });
    if (error) throw error;
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;
    userId = data.user.id;
  }
  const { error: pErr } = await admin
    .from("profiles")
    .upsert({ id: userId, role: "student", username, full_name: fullName }, { onConflict: "id" });
  if (pErr) throw pErr;
  return { username, userId, existing: !!existing };
}

const list = parseArgs();
let ok = 0;
for (const s of list) {
  try {
    const r = await upsertStudent(s);
    ok++;
    console.log(`✅ ${r.username}  (${r.existing ? "อัปเดต" : "ใหม่"})  ${r.userId}`);
  } catch (e) {
    console.error(`❌ ${s.username}: ${e.message}`);
  }
}
console.log(`\nเสร็จ — สำเร็จ ${ok}/${list.length} คน`);
