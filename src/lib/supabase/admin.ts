import { createClient } from "@supabase/supabase-js";

/**
 * Supabase admin client — ใช้ service-role key (ข้าม RLS)
 * ⚠️ ฝั่งเซิร์ฟเวอร์เท่านั้น ห้าม import ใน Client Component
 * ใช้สร้างบัญชีนักเรียน + งาน admin ที่ต้องข้าม RLS
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
