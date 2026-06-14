/**
 * ไอคอน inline (stroke = currentColor) สำหรับ sidebar ฝั่งติวเตอร์
 * ไม่พึ่ง icon library — สไตล์ Lucide (24×24, stroke 2)
 */
type P = { className?: string };

function svg(children: React.ReactNode) {
  return function Icon({ className }: P) {
    return (
      <svg
        className={className}
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {children}
      </svg>
    );
  };
}

export const IconDashboard = svg(
  <>
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </>
);
export const IconFiles = svg(
  <>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
  </>
);
export const IconArchive = svg(
  <>
    <rect x="3" y="4" width="18" height="4" rx="1" />
    <path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8" />
    <path d="M10 12h4" />
  </>
);
export const IconUsers = svg(
  <>
    <circle cx="9" cy="8" r="3" />
    <path d="M3 20a6 6 0 0 1 12 0" />
    <path d="M16 5a3 3 0 0 1 0 6M21 20a6 6 0 0 0-5-5.9" />
  </>
);
export const IconUsersGroup = svg(
  <>
    <circle cx="8" cy="9" r="2.5" />
    <circle cx="16" cy="9" r="2.5" />
    <path d="M3 19a5 5 0 0 1 10 0M11 19a5 5 0 0 1 10 0" />
  </>
);
export const IconClipboard = svg(
  <>
    <rect x="6" y="4" width="12" height="17" rx="2" />
    <path d="M9 4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1H9z" />
    <path d="M9 11h6M9 15h4" />
  </>
);
export const IconChartBar = svg(
  <>
    <path d="M3 21h18" />
    <rect x="5" y="11" width="3.5" height="7" rx="0.5" />
    <rect x="10.25" y="6" width="3.5" height="12" rx="0.5" />
    <rect x="15.5" y="14" width="3.5" height="4" rx="0.5" />
  </>
);
export const IconChevronLeft = svg(<path d="M15 6l-6 6 6 6" />);
export const IconMenu = svg(<path d="M4 6h16M4 12h16M4 18h16" />);
export const IconClose = svg(<path d="M6 6l12 12M18 6L6 18" />);
export const IconHelp = svg(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9a2.5 2.5 0 0 1 4.5 1.5c0 1.5-2 2-2 3.5" />
    <path d="M12 17h.01" />
  </>
);
export const IconSettings = svg(
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
  </>
);
export const IconUser = svg(
  <>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </>
);
export const IconLogout = svg(
  <>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5M21 12H9" />
  </>
);
export const IconLock = svg(
  <>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </>
);
