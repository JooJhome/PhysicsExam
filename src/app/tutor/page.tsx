import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function TutorDashboard() {
  const supabase = await createClient();
  const [{ count: examCount }, { count: studentCount }, { count: submitCount }] =
    await Promise.all([
      supabase.from("exams").select("*", { count: "exact", head: true }),
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "student"),
      supabase
        .from("attempts")
        .select("*", { count: "exact", head: true })
        .eq("status", "submitted"),
    ]);

  const cards = [
    { label: "ชุดข้อสอบ", value: examCount ?? 0, href: "/tutor/exams" },
    { label: "นักเรียน", value: studentCount ?? 0, href: "/tutor/students" },
    { label: "ส่งคำตอบแล้ว", value: submitCount ?? 0, href: "/tutor/results" },
  ];

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-lg font-bold text-gray-900">ภาพรวมระบบ</h1>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 hover:ring-blue-300"
          >
            <p className="text-sm text-gray-500">{c.label}</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{c.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 rounded-xl bg-blue-50 p-4 text-sm text-blue-900 ring-1 ring-blue-100">
        <p className="font-semibold">เริ่มต้นใช้งาน</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>อัปโหลดข้อสอบที่หน้า “ข้อสอบ” แล้วกด publish</li>
          <li>สร้างบัญชีนักเรียนที่หน้า “นักเรียน” (ทีละคนหรือวาง CSV)</li>
          <li>มอบหมายชุดสอบที่หน้า “มอบหมาย”</li>
          <li>ติดตามคะแนนแบบเรียลไทม์ที่หน้า “ผลสอบ”</li>
        </ol>
      </div>
    </main>
  );
}
