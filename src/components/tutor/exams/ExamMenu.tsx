"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export type MenuItem =
  | { kind: "link"; label: string; href: string; newTab?: boolean; icon?: React.ReactNode }
  | { kind: "button"; label: string; onClick: () => void; danger?: boolean; icon?: React.ReactNode };

/**
 * เมนู ⋯ — popover บน desktop/tablet, bottom sheet บนมือถือ (<768px)
 * keyboard: Esc ปิด, โฟกัสปุ่มแรกเมื่อเปิด, คลิกนอกพื้นที่ปิด
 */
export default function ExamMenu({
  items,
  label = "ตัวเลือกเพิ่มเติม",
}: {
  items: MenuItem[];
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const firstItemRef = useRef<HTMLButtonElement | HTMLAnchorElement>(null);

  useEffect(() => {
    if (!open) return;
    firstItemRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  function renderItem(it: MenuItem, i: number) {
    const ref = i === 0 ? (firstItemRef as React.Ref<never>) : undefined;
    const base =
      "flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-colors sm:py-2.5";
    if (it.kind === "link") {
      return (
        <Link
          key={it.label}
          ref={ref}
          href={it.href}
          target={it.newTab ? "_blank" : undefined}
          role="menuitem"
          onClick={() => setOpen(false)}
          className={`${base} text-ink-soft hover:bg-brand-50 hover:text-brand-700`}
        >
          {it.icon}
          {it.label}
        </Link>
      );
    }
    return (
      <button
        key={it.label}
        ref={ref}
        type="button"
        role="menuitem"
        onClick={() => {
          setOpen(false);
          it.onClick();
        }}
        className={`${base} ${
          it.danger
            ? "text-red-600 hover:bg-red-50"
            : "text-ink-soft hover:bg-brand-50 hover:text-brand-700"
        }`}
      >
        {it.icon}
        {it.label}
      </button>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        className="grid h-11 w-11 place-items-center rounded-xl text-muted transition-colors hover:bg-canvas hover:text-ink sm:h-9 sm:w-9"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <circle cx="5" cy="12" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="19" cy="12" r="1.8" />
        </svg>
      </button>

      {open && (
        <>
          {/* desktop / tablet: popover */}
          <div
            role="menu"
            className="absolute right-0 top-full z-30 mt-1 hidden w-56 overflow-hidden rounded-2xl border border-line bg-white py-1 shadow-lift sm:block"
          >
            {items.map(renderItem)}
          </div>

          {/* mobile: bottom sheet */}
          <div className="fixed inset-0 z-40 sm:hidden">
            <div
              className="absolute inset-0 bg-ink/40 animate-fade-in"
              onClick={() => setOpen(false)}
            />
            <div
              role="menu"
              className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-line bg-white pb-[env(safe-area-inset-bottom)] shadow-lift animate-dialog-in"
            >
              <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-line" />
              <div className="py-2">{items.map(renderItem)}</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
