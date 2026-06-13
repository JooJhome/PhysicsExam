import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export interface Profile {
  id: string;
  role: "tutor" | "student";
  username: string;
  full_name: string | null;
}

/**
 * ดึง profile ของผู้ใช้ปัจจุบัน (server-side) — ไม่ล็อกอิน → /login
 * ห่อด้วย React cache() เพื่อ dedupe ต่อ request:
 * layout (requireRole) + page เรียกซ้ำได้โดยยิง auth/DB จริงครั้งเดียว
 */
export const getProfile = cache(async function getProfile(): Promise<Profile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, username, full_name")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");
  return profile as Profile;
});

export async function requireRole(role: "tutor" | "student"): Promise<Profile> {
  const profile = await getProfile();
  if (profile.role !== role) {
    redirect(profile.role === "tutor" ? "/tutor" : "/student");
  }
  return profile;
}
