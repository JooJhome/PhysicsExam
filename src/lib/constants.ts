/** โดเมนสังเคราะห์สำหรับ map username -> email ของนักเรียน/ติวเตอร์ */
export const STUDENT_EMAIL_DOMAIN =
  process.env.NEXT_PUBLIC_STUDENT_EMAIL_DOMAIN || "students.bsiink.local";

/** username -> email ที่ใช้กับ Supabase Auth */
export function usernameToEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${STUDENT_EMAIL_DOMAIN}`;
}

export type Role = "tutor" | "student";
