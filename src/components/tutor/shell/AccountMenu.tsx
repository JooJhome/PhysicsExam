"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions/auth";
import { HELP, helpKeyForPath } from "@/lib/help/content";
import HelpDrawer from "@/components/tutor/help/HelpDrawer";
import { IconUser, IconSettings, IconHelp, IconLogout, IconLock } from "./icons";

export default function AccountMenu({
  name,
  collapsed = false,
}: {
  name: string;
  collapsed?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const helpKey = helpKeyForPath(pathname);
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  // ปิด popover เมื่อคลิกนอก / Esc
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`เมนูบัญชี ${name}`}
        className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-side-hover ${
          collapsed ? "justify-center" : ""
        }`}
      >
        <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-side-active font-display text-sm font-bold text-white">
          {initial}
        </span>
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-side-text">
                {name}
              </span>
              <span className="block text-xs text-side-muted">ติวเตอร์</span>
            </span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`flex-none text-side-muted transition-transform ${open ? "rotate-180" : ""}`}
              aria-hidden
            >
              <path d="M6 15l6-6 6 6" />
            </svg>
          </>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute bottom-full left-0 z-50 mb-2 w-56 overflow-hidden rounded-2xl border border-line bg-white p-1.5 shadow-lift"
        >
          <MenuRow Icon={IconUser} label="โปรไฟล์" soon />
          <MenuRow Icon={IconSettings} label="ตั้งค่า" soon />
          {helpKey && (
            <MenuRow
              Icon={IconHelp}
              label="วิธีใช้หน้านี้"
              onClick={() => {
                setOpen(false);
                setHelpOpen(true);
              }}
            />
          )}
          <div className="my-1 border-t border-line" />
          <form action={logout}>
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
            >
              <IconLogout className="h-[18px] w-[18px]" />
              ออกจากระบบ
            </button>
          </form>
        </div>
      )}

      {helpOpen && helpKey && (
        <HelpDrawer doc={HELP[helpKey]} onClose={() => setHelpOpen(false)} />
      )}
    </div>
  );
}

function MenuRow({
  Icon,
  label,
  onClick,
  soon = false,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  soon?: boolean;
}) {
  if (soon) {
    return (
      <div
        className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted"
        aria-disabled
      >
        <Icon className="h-[18px] w-[18px]" />
        <span className="flex-1">{label}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-sand-100 px-2 py-0.5 text-[11px] font-semibold text-muted">
          <IconLock className="h-3 w-3" />
          เร็วๆนี้
        </span>
      </div>
    );
  }
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-ink transition-colors hover:bg-brand-50 hover:text-brand-700"
    >
      <Icon className="h-[18px] w-[18px]" />
      {label}
    </button>
  );
}
