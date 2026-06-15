"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link, { useLinkStatus } from "next/link";
import { Wordmark } from "@/components/Decor";
import { NAV, isActive, type NavItem } from "./nav";
import { IconChevronLeft, IconMenu, IconClose, IconLock } from "./icons";
import AccountMenu from "./AccountMenu";

const LS_KEY = "bsiink:tutor-sidebar";

export default function TutorShell({
  name,
  children,
}: {
  name: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(true); // SSR default = expanded
  const [drawerOpen, setDrawerOpen] = useState(false);

  // initial: localStorage > default ตาม viewport (desktop=ขยาย / tablet=พับ)
  useEffect(() => {
    const stored = localStorage.getItem(LS_KEY);
    if (stored === "expanded") setExpanded(true);
    else if (stored === "collapsed") setExpanded(false);
    else setExpanded(window.matchMedia("(min-width: 1024px)").matches);
  }, []);

  // เปลี่ยนหน้า → ปิด drawer
  useEffect(() => setDrawerOpen(false), [pathname]);

  const toggle = useCallback(() => {
    setExpanded((v) => {
      const next = !v;
      localStorage.setItem(LS_KEY, next ? "expanded" : "collapsed");
      return next;
    });
  }, []);

  return (
    <div className="min-h-dvh">
      {/* ── Sidebar (md+) ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col bg-side-bg text-side-text transition-[width] duration-200 ease-out md:flex print:!hidden ${
          expanded ? "w-56" : "w-16"
        }`}
      >
        <SidebarNav
          expanded={expanded}
          pathname={pathname}
          name={name}
          onToggle={toggle}
        />
      </aside>

      {/* ── Mobile top bar (<md) ── */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-canvas/90 px-3 backdrop-blur md:hidden print:!hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="เปิดเมนู"
          aria-expanded={drawerOpen}
          className="grid h-11 w-11 flex-none place-items-center rounded-lg text-ink transition-colors hover:bg-sand-100"
        >
          <IconMenu />
        </button>
        <Wordmark />
      </header>

      {/* ── Mobile drawer (<md) ── */}
      {drawerOpen && (
        <MobileDrawer name={name} pathname={pathname} onClose={() => setDrawerOpen(false)} />
      )}

      {/* ── Content ── */}
      <div
        className={`transition-[padding] duration-200 ease-out print:!pl-0 ${
          expanded ? "md:pl-56" : "md:pl-16"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

/* ───────── Sidebar content (ใช้ทั้ง desktop aside + mobile drawer) ───────── */
function SidebarNav({
  expanded,
  pathname,
  name,
  onToggle,
  inDrawer = false,
}: {
  expanded: boolean;
  pathname: string;
  name: string;
  onToggle?: () => void;
  inDrawer?: boolean;
}) {
  return (
    <>
      {/* logo + ปุ่มพับ */}
      <div
        className={`flex h-16 flex-none items-center ${
          expanded || inDrawer ? "justify-between px-4" : "justify-center"
        }`}
      >
        {(expanded || inDrawer) && <Wordmark onDark />}
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-label={expanded ? "พับเมนู" : "ขยายเมนู"}
            className="grid h-9 w-9 flex-none place-items-center rounded-lg text-side-muted transition-colors hover:bg-side-hover hover:text-side-text"
          >
            <IconChevronLeft
              className={`h-5 w-5 transition-transform ${expanded ? "" : "rotate-180"}`}
            />
          </button>
        )}
      </div>

      {/* เมนู */}
      <nav className="flex-1 overflow-y-auto px-2 py-2" aria-label="เมนูติวเตอร์">
        {NAV.map((section, i) => (
          <div key={i} className={i > 0 ? "mt-4" : ""}>
            {section.title && (expanded || inDrawer) && (
              <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-side-muted">
                {section.title}
              </p>
            )}
            {section.title && !expanded && !inDrawer && i > 0 && (
              <div className="mx-3 mb-2 border-t border-white/10" />
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.label}>
                  <NavLink
                    item={item}
                    active={!!item.href && isActive(pathname, item.href)}
                    showLabel={expanded || inDrawer}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* บัญชี */}
      <div className="flex-none border-t border-white/10 p-2">
        <AccountMenu name={name} collapsed={!expanded && !inDrawer} />
      </div>
    </>
  );
}

function NavLink({
  item,
  active,
  showLabel,
}: {
  item: NavItem;
  active: boolean;
  showLabel: boolean;
}) {
  const base = `flex items-center gap-3 rounded-xl text-sm font-medium transition-colors min-h-[44px] ${
    showLabel ? "px-3" : "justify-center px-0"
  }`;

  // ยังไม่เปิด (soon)
  if (item.soon || !item.href) {
    return (
      <div
        className={`${base} cursor-not-allowed text-side-muted/70`}
        aria-disabled
        title={showLabel ? undefined : `${item.label} (เร็วๆนี้)`}
      >
        <item.Icon className="h-[22px] w-[22px] flex-none" />
        {showLabel && (
          <>
            <span className="flex-1">{item.label}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold">
              <IconLock className="h-3 w-3" />
              เร็วๆนี้
            </span>
          </>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      title={showLabel ? undefined : item.label}
      className={`relative ${base} ${
        active
          ? "bg-side-active font-bold text-white"
          : "text-side-text hover:bg-side-hover"
      }`}
    >
      <item.Icon className="h-[22px] w-[22px] flex-none" />
      {showLabel && <span className="truncate">{item.label}</span>}
      <NavPending showLabel={showLabel} />
    </Link>
  );
}

/** spinner ที่โผล่เฉพาะตอนเมนูนี้กำลังพาไปหน้าใหม่ — บอกว่า "กดติดแล้ว กำลังโหลด" */
function NavPending({ showLabel }: { showLabel: boolean }) {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      className={`animate-spin text-current ${
        showLabel ? "ml-auto h-4 w-4 flex-none" : "absolute right-1 top-1 h-3.5 w-3.5"
      }`}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
      <path d="M12 2a10 10 0 0 1 10 10h-3a7 7 0 0 0-7-7V2z" fill="currentColor" className="opacity-90" />
    </svg>
  );
}

/* ───────── Mobile drawer + backdrop + focus trap ───────── */
function MobileDrawer({
  name,
  pathname,
  onClose,
}: {
  name: string;
  pathname: string;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // โฟกัสปุ่มปิดเมื่อเปิด
    const panel = panelRef.current;
    const focusables = () =>
      Array.from(
        panel?.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])'
        ) ?? []
      );
    focusables()[0]?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") return onClose();
      if (e.key !== "Tab") return;
      const els = focusables();
      if (els.length === 0) return;
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div
        className="absolute inset-0 bg-ink/50 animate-fade-in"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="เมนูติวเตอร์"
        className="absolute inset-y-0 left-0 flex w-72 max-w-[82vw] flex-col bg-side-bg text-side-text shadow-lift animate-dialog-in"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="ปิดเมนู"
          className="absolute right-3 top-4 z-10 grid h-9 w-9 place-items-center rounded-lg text-side-muted transition-colors hover:bg-side-hover hover:text-side-text"
        >
          <IconClose className="h-5 w-5" />
        </button>
        <SidebarNav expanded pathname={pathname} name={name} inDrawer />
      </div>
    </div>
  );
}
