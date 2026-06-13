import { requireRole } from "@/lib/profile";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ประตูตรวจสิทธิ์เท่านั้น — header อยู่ในแต่ละหน้า เพื่อให้หน้าทำข้อสอบเป็นโหมดโฟกัส (ไม่มี nav/ออกจากระบบ)
  await requireRole("student");
  return <div className="min-h-screen">{children}</div>;
}
