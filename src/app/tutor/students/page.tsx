import { createClient } from "@/lib/supabase/server";
import StudentManager, {
  type StudentRow,
} from "@/components/tutor/StudentManager";

export default async function StudentsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, username, full_name, created_at")
    .eq("role", "student")
    .order("username");

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-lg font-bold text-gray-900">จัดการนักเรียน</h1>
      <StudentManager students={(data as StudentRow[]) ?? []} />
    </main>
  );
}
