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
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-lg font-bold text-gray-900">มอบหมายชุดสอบ</h1>
      <p className="mt-1 text-sm text-gray-500">
        ติ๊กเพื่อมอบหมายชุดสอบให้นักเรียน (นักเรียนจะเห็นเฉพาะชุดที่ “เผยแพร่แล้ว”)
      </p>
      <AssignMatrix
        students={students ?? []}
        exams={exams ?? []}
        assignments={assignments ?? []}
      />
    </main>
  );
}
