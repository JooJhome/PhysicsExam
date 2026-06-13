import Link from "next/link";
import { logout } from "@/lib/actions/auth";

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
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="#" className="text-base font-bold text-gray-900">
          {title}
        </Link>
        {nav && (
          <nav className="flex gap-4 text-sm">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="text-gray-600 hover:text-blue-600"
              >
                {n.label}
              </Link>
            ))}
          </nav>
        )}
        <div className="ml-auto flex items-center gap-3 text-sm">
          {name && <span className="text-gray-500">{name}</span>}
          <form action={logout}>
            <button className="rounded-lg border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50">
              ออกจากระบบ
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
