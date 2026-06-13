import { redirect } from "next/navigation";

// middleware จัดการ redirect ตาม role อยู่แล้ว — กันกรณีหลุดมาถึงนี่
export default function Home() {
  redirect("/login");
}
