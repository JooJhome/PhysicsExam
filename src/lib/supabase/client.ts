import { createBrowserClient } from "@supabase/ssr";

/** Supabase client ฝั่ง browser (ใช้ใน Client Components) */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
