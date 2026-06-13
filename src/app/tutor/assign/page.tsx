import { createClient } from "@/lib/supabase/server";
import AssignMatrix from "@/components/tutor/AssignMatrix";

export default async function AssignPage() {
  const supabase = await createClient();
  const [{ data: students }, { data: exams }, { data: assignments }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, username, full_name")
        .eq("role", "student")
        .order("username"),
      supabase
        .from("exams")
        .select("id, title, exam_code, status")
        .order("created_at"),
      supabase.from("assignments").select("exam_id, student_id"),
    ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-5">
      <header>
        <h1 className="font-display text-4xl font-extrabold text-ink sm:text-5xl">
          มอบหมายชุดสอบ
        </h1>
        <p className="mt-3 text-lg text-muted">
          ติ๊กเพื่อมอบหมายชุดสอบให้นักเรียน — นักเรียนจะเห็นเฉพาะชุดที่ “เผยแพร่แล้ว”
        </p>
      </header>
      <AssignMatrix
        students={students ?? []}
        exams={exams ?? []}
        assignments={assignments ?? []}
      />
    </main>
  );
}
