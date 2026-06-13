import Link from "next/link";
import { logout } from "@/lib/actions/auth";
import { Wordmark } from "@/components/Decor";

export default function AppHeader({
  title,
  name,
  nav,
}: {
  title: string;
  name?: string;
  nav?: { href: string; label: string }[];
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-5">
        <Link href="#" aria-label={title}>
          <Wordmark />
        </Link>
        {nav && (
          <nav className="flex gap-1 text-sm">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="rounded-full px-3 py-1.5 font-medium text-ink-soft transition-colors hover:bg-brand-50 hover:text-brand-700"
              >
                {n.label}
              </Link>
            ))}
          </nav>
        )}
        <div className="ml-auto flex items-center gap-3 text-sm">
          {name && (
            <span className="hidden font-medium text-ink-soft sm:inline">
              {name}
            </span>
          )}
          <form action={logout}>
            <button className="rounded-full border border-line bg-white px-4 py-1.5 font-semibold text-ink-soft transition-colors hover:bg-sand-100">
              ออกจากระบบ
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
