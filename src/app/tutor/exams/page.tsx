import { Suspense } from "react";
import { getTutorExams } from "@/lib/exams";
import ExamManager from "@/components/tutor/ExamManager";

export const dynamic = "force-dynamic";

export default async function ExamsPage() {
  const exams = await getTutorExams();

  return (
    <main className="mx-auto max-w-6xl px-4 pb-10 pt-6 sm:px-5">
      <header>
        <h1 className="font-display text-h1 font-extrabold text-ink">
          จัดการข้อสอบ
        </h1>
        <p className="mt-2 text-muted sm:text-lg">
          อัปโหลดชุดข้อสอบ เผยแพร่ และกำหนดสิทธิ์ดูเฉลย
        </p>
      </header>
      <Suspense fallback={null}>
        <ExamManager exams={exams} />
      </Suspense>
    </main>
  );
}
