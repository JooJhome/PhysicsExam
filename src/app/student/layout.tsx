import AppHeader from "@/components/AppHeader";
import { requireRole } from "@/lib/profile";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("student");
  return (
    <div className="min-h-screen">
      <AppHeader
        title="BSIINK Physics"
        name={profile.full_name || profile.username}
      />
      {children}
    </div>
  );
}
