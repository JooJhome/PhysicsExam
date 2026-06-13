import { getAssignExams } from "@/lib/assign";
import AssignList from "@/components/tutor/assign/AssignList";

export const dynamic = "force-dynamic";

export default async function AssignPage() {
  const data = await getAssignExams();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-5 sm:py-10">
      <header>
        <h1 className="font-display text-3xl font-extrabold text-ink sm:text-4xl">
          มอบหมายชุดสอบ
        </h1>
        <p className="mt-2 text-muted sm:text-lg">
          เลือกชุดที่กำลังใช้ แล้วกดมอบหมายให้นักเรียน
        </p>
      </header>
      <AssignList data={data} />
    </main>
  );
}
