import type { ComponentType } from "react";
import {
  IconDashboard,
  IconFiles,
  IconArchive,
  IconUsers,
  IconUsersGroup,
  IconClipboard,
  IconChartBar,
} from "./icons";

export type NavItem = {
  label: string;
  href?: string; // ไม่มี href = ยังไม่เปิด (soon)
  Icon: ComponentType<{ className?: string }>;
  soon?: boolean;
};
export type NavSection = { title?: string; items: NavItem[] };

export const NAV: NavSection[] = [
  {
    items: [{ label: "ภาพรวม", href: "/tutor", Icon: IconDashboard }],
  },
  {
    title: "เนื้อหา",
    items: [
      { label: "ข้อสอบ", href: "/tutor/exams", Icon: IconFiles },
      { label: "คลังข้อสอบ", Icon: IconArchive, soon: true },
    ],
  },
  {
    title: "คน",
    items: [
      { label: "นักเรียน", href: "/tutor/students", Icon: IconUsers },
      { label: "กลุ่ม/ห้องเรียน", Icon: IconUsersGroup, soon: true },
      { label: "มอบหมาย", href: "/tutor/assign", Icon: IconClipboard },
    ],
  },
  {
    title: "ผล",
    items: [{ label: "ผลสอบ", href: "/tutor/results", Icon: IconChartBar }],
  },
];

/** active เมื่อ pathname ตรงเป๊ะ หรือเป็น sub-route (ยกเว้น /tutor ที่ต้องตรงเป๊ะ) */
export function isActive(pathname: string, href: string): boolean {
  if (href === "/tutor") return pathname === "/tutor";
  return pathname === href || pathname.startsWith(href + "/");
}
