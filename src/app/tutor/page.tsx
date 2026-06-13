import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArrowUpRight } from "@/components/Decor";

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
    {
      label: "ชุดข้อสอบ",
      desc: "ทั้งหมดในระบบ",
      value: examCount ?? 0,
      href: "/tutor/exams",
      tone: "teal" as const,
    },
    {
      label: "นักเรียน",
      desc: "บัญชีที่สร้างแล้ว",
      value: studentCount ?? 0,
      href: "/tutor/students",
      tone: "amber" as const,
    },
    {
      label: "ส่งคำตอบแล้ว",
      desc: "ครั้งที่ส่งสำเร็จ",
      value: submitCount ?? 0,
      href: "/tutor/results",
      tone: "plain" as const,
    },
  ];

  const toneClass = {
    teal: "bg-brand-600 text-white",
    amber: "bg-accent-400 text-ink",
    plain: "border border-line bg-white text-ink",
  };

  const actions = [
    { label: "อัปโหลดข้อสอบ", href: "/tutor/exams" },
    { label: "เพิ่มนักเรียน", href: "/tutor/students" },
    { label: "มอบหมายชุดสอบ", href: "/tutor/assign" },
    { label: "ดูผลสอบ", href: "/tutor/results" },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-5">
      <header>
        <h1 className="font-display text-4xl font-extrabold text-ink sm:text-5xl">
          ภาพรวมระบบ
        </h1>
        <p className="mt-3 text-lg text-muted">
          จัดการชุดข้อสอบ นักเรียน และติดตามผลได้จากที่นี่
        </p>
      </header>

      {/* สถิติ */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className={`group relative overflow-hidden rounded-3xl p-7 shadow-card transition-transform hover:-translate-y-0.5 ${toneClass[c.tone]}`}
          >
            <span
              className={`absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
                c.tone === "plain"
                  ? "bg-sand-100 text-ink"
                  : "bg-white/20 text-current"
              }`}
            >
              <ArrowUpRight className="h-4 w-4" />
            </span>
            <p
              className={`text-base font-medium ${
                c.tone === "teal"
                  ? "text-white/80"
                  : c.tone === "amber"
                  ? "text-ink/70"
                  : "text-muted"
              }`}
            >
              {c.label}
            </p>
            <p
              className={`mt-2 font-display text-6xl font-extrabold leading-none tabular-nums ${
                c.tone === "plain" ? "text-brand-700" : ""
              }`}
            >
              {c.value}
            </p>
            <p
              className={`mt-3 text-sm ${
                c.tone === "teal"
                  ? "text-white/65"
                  : c.tone === "amber"
                  ? "text-ink/55"
                  : "text-muted"
              }`}
            >
              {c.desc}
            </p>
          </Link>
        ))}
      </div>

      {/* เนื้อหา 2 คอลัมน์ */}
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        {/* เริ่มต้นใช้งาน */}
        <section className="rounded-3xl border border-line bg-white p-7 lg:col-span-2">
          <h2 className="font-display text-xl font-bold text-ink">
            เริ่มต้นใช้งาน
          </h2>
          <ol className="mt-5 space-y-4 text-ink-soft">
            {[
              "อัปโหลดข้อสอบที่หน้า “ข้อสอบ” แล้วกด publish",
              "สร้างบัญชีนักเรียนที่หน้า “นักเรียน” (ทีละคนหรือวาง CSV)",
              "มอบหมายชุดสอบที่หน้า “มอบหมาย”",
              "ติดตามคะแนนแบบเรียลไทม์ที่หน้า “ผลสอบ”",
            ].map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-brand-50 font-display text-sm font-bold text-brand-700">
                  {i + 1}
                </span>
                <span className="pt-1">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* ทางลัด */}
        <section className="rounded-3xl border border-line bg-white p-7">
          <h2 className="font-display text-xl font-bold text-ink">ทางลัด</h2>
          <div className="mt-5 space-y-2">
            {actions.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="group flex items-center justify-between rounded-2xl px-4 py-3.5 text-ink-soft transition-colors hover:bg-brand-50 hover:text-brand-700"
              >
                <span className="font-semibold">{a.label}</span>
                <span className="grid h-8 w-8 place-items-center rounded-full bg-sand-100 text-ink transition-colors group-hover:bg-brand-600 group-hover:text-white">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
