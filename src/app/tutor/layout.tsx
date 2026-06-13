import AppHeader from "@/components/AppHeader";
import { requireRole } from "@/lib/profile";

export default async function TutorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("tutor");
  return (
    <div className="min-h-screen">
      <AppHeader
        title="BSIINK · ติวเตอร์"
        name={profile.full_name || profile.username}
        nav={[
          { href: "/tutor", label: "ภาพรวม" },
          { href: "/tutor/exams", label: "ข้อสอบ" },
          { href: "/tutor/students", label: "นักเรียน" },
          { href: "/tutor/assign", label: "มอบหมาย" },
          { href: "/tutor/results", label: "ผลสอบ" },
        ]}
      />
      {children}
    </div>
  );
}
