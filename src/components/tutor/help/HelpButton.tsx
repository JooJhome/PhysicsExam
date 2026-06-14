"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { HELP, helpKeyForPath } from "@/lib/help/content";
import HelpDrawer from "./HelpDrawer";

export default function HelpButton() {
  const pathname = usePathname();
  const key = helpKeyForPath(pathname);
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(false);

  // เด้งจาง ๆ ครั้งแรกต่อหน้า (จนกว่าจะเคยเปิด)
  useEffect(() => {
    if (!key) return;
    setPulse(localStorage.getItem(`bsiink:help-seen:${key}`) !== "1");
  }, [key]);

  if (!key) return null;
  const doc = HELP[key];

  function openHelp() {
    setOpen(true);
    setPulse(false);
    if (key) localStorage.setItem(`bsiink:help-seen:${key}`, "1");
  }

  return (
    <>
      <button
        type="button"
        onClick={openHelp}
        aria-label="วิธีใช้หน้านี้"
        title="วิธีใช้หน้านี้"
        className="relative grid h-9 w-9 place-items-center rounded-full border border-line bg-white font-display text-base font-bold text-brand-700 transition-colors hover:bg-brand-50"
      >
        ?
        {pulse && (
          <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent-500" />
          </span>
        )}
      </button>

      {open && <HelpDrawer doc={doc} onClose={() => setOpen(false)} />}
    </>
  );
}
