import TutorShell from "@/components/tutor/shell/TutorShell";
import { requireRole } from "@/lib/profile";

export default async function TutorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("tutor");
  return (
    <TutorShell name={profile.full_name || profile.username}>
      {children}
    </TutorShell>
  );
}
