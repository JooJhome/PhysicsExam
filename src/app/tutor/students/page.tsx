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
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-5">
      <header>
        <h1 className="font-display text-4xl font-extrabold text-ink sm:text-5xl">
          จัดการนักเรียน
        </h1>
        <p className="mt-3 text-lg text-muted">
          เพิ่มบัญชีนักเรียนทีละคนหรือวาง CSV และจัดการรายชื่อ
        </p>
      </header>
      <StudentManager students={(data as StudentRow[]) ?? []} />
    </main>
  );
}
