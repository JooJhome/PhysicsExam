import { getProfile } from "@/lib/profile";
import TutorSettings from "@/components/tutor/TutorSettings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const profile = await getProfile();

  return (
    <main className="mx-auto max-w-2xl px-4 pb-10 pt-6 sm:px-5">
      <header className="motion-safe:animate-rise-in">
        <h1 className="font-display text-h1 font-extrabold text-ink">ตั้งค่าบัญชี</h1>
        <p className="mt-2 text-muted sm:text-lg">แก้ชื่อที่แสดง และเปลี่ยนรหัสผ่านของคุณ</p>
      </header>
      <TutorSettings
        username={profile.username}
        fullName={profile.full_name ?? ""}
      />
    </main>
  );
}
