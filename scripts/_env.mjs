// โหลดค่าจาก .env.local เข้า process.env (เรียกก่อนใช้ key)
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

export function loadEnv() {
  let raw;
  try {
    raw = readFileSync(join(root, ".env.local"), "utf8");
  } catch {
    return;
  }
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim();
    if (!(k in process.env)) process.env[k] = v;
  }
}

export function getAdminEnv() {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const domain =
    process.env.NEXT_PUBLIC_STUDENT_EMAIL_DOMAIN || "students.bsiink.local";
  if (!url || !key || url.includes("placeholder") || key === "placeholder") {
    throw new Error(
      "ยังไม่ได้ตั้งค่า NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ใน .env.local"
    );
  }
  return { url, key, domain, root };
}

export function usernameToEmail(username, domain) {
  return `${username.trim().toLowerCase()}@${domain}`;
}
