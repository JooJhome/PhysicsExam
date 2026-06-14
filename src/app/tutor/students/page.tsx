import { getTutorStudents } from "@/lib/students";
import StudentManager from "@/components/tutor/StudentManager";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const students = await getTutorStudents();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-5 sm:py-10">
      <header>
        <h1 className="font-display text-h1 font-extrabold text-ink">
          จัดการนักเรียน
        </h1>
        <p className="mt-2 text-muted sm:text-lg">
          เพิ่มบัญชีทีละคนหรือวาง CSV และจัดการรายชื่อ
        </p>
      </header>
      <StudentManager students={students} />
    </main>
  );
}
