import { getAssignExams } from "@/lib/assign";
import AssignList from "@/components/tutor/assign/AssignList";

export const dynamic = "force-dynamic";

export default async function AssignPage() {
  const data = await getAssignExams();

  return (
    <main className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-5">
      <header className="motion-safe:animate-rise-in">
        <h1 className="font-display text-h1 font-extrabold text-ink">
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
