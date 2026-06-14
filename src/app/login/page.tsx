"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { usernameToEmail } from "@/lib/constants";
import { Wordmark, Underline, Sparkle } from "@/components/Decor";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const usernameRef = useRef<HTMLInputElement>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    });

    if (signInError || !data.user) {
      setError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
      setLoading(false);
      // ย้ายโฟกัสกลับช่องแรกเพื่อให้ลองใหม่ได้ทันที (focus management)
      usernameRef.current?.focus();
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    router.replace(profile?.role === "tutor" ? "/tutor" : "/student");
    router.refresh();
  }

  return (
    <main className="grid min-h-dvh md:grid-cols-2">
      {/* ── แผงแบรนด์ (เทียลเต็มความสูง) ── */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-600 px-10 py-8 text-white md:flex lg:px-14 lg:py-10">
        {/* พื้นหลัง composed: กระดาษกราฟ (ธีมฟิสิกส์) + แสงอำพันนุ่ม */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-accent-400/20 blur-3xl"
        />

        <Wordmark className="relative" onDark />

        <div className="relative my-auto mx-auto flex max-w-xl flex-col items-center py-6 text-center">
          <Sparkle className="mb-4 h-10 w-10 text-accent-300" />
          <h2 className="font-display text-5xl font-extrabold leading-[1.05] lg:text-6xl">
            ตั้งใจสอบ
            <br />
            <span className="relative inline-block text-accent-300">
              เต็มที่นะ
              <Underline className="absolute -bottom-3 left-0 w-full text-accent-400" />
            </span>
          </h2>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/85 lg:text-xl">
            พื้นที่สอบที่สงบ โปร่งใส และยุติธรรม — ให้คุณโฟกัสกับข้อสอบได้เต็มที่
          </p>
          <ul className="mt-8 space-y-4 text-left">
            {[
              "โฟกัสได้เต็มที่ ระบบดูแลเวลาและบันทึกคำตอบให้เอง",
              "ยุติธรรมกับทุกคน — แต่ละชุดทำได้ครั้งเดียว",
              "รู้ผลและทบทวนเฉลยได้ทันทีหลังส่ง",
            ].map((t) => (
              <li
                key={t}
                className="flex items-center gap-3.5 text-lg text-white/90 lg:text-xl"
              >
                <CheckCircle />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3.5 ring-1 ring-white/15">
            <Shield />
            <p className="text-sm text-white/85">
              เฉลยไม่รั่วก่อนส่ง — ตรวจคะแนนฝั่งเซิร์ฟเวอร์
            </p>
          </div>
          <p className="mt-5 text-xs text-white/60">
            © {new Date().getFullYear()} BSIINK Physics
          </p>
        </div>
      </div>

      {/* ── ฟอร์มเข้าสู่ระบบ (พื้นขาวเต็มความสูง) ── */}
      <div className="flex flex-col justify-center bg-white px-6 py-12 sm:px-12 lg:px-24">
        <div className="mx-auto w-full max-w-lg">
          <div className="md:hidden">
            <Wordmark />
          </div>
          <div className="mt-8 md:mt-0">
            <h1 className="font-display text-5xl font-extrabold text-ink lg:text-[3.25rem]">
              เข้าสู่ระบบ
            </h1>
            <p className="mt-3 text-lg text-muted">
              กรอกชื่อผู้ใช้และรหัสผ่านที่ได้รับจากติวเตอร์
            </p>
          </div>

          <form onSubmit={handleLogin} className="mt-10 space-y-6">
            <div>
              <label
                htmlFor="login-username"
                className="block text-base font-semibold text-ink-soft"
              >
                ชื่อผู้ใช้ (Username)
              </label>
              <input
                id="login-username"
                ref={usernameRef}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
                autoFocus
                aria-invalid={error ? true : undefined}
                className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-4 text-lg transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
            <div>
              <label
                htmlFor="login-password"
                className="block text-base font-semibold text-ink-soft"
              >
                รหัสผ่าน (Password)
              </label>
              <div className="relative mt-2">
                <input
                  id="login-password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  aria-invalid={error ? true : undefined}
                  className="w-full rounded-xl border border-line bg-white px-4 py-4 pr-14 text-lg transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  aria-pressed={showPw}
                  className="absolute inset-y-0 right-0 grid w-14 place-items-center rounded-r-xl text-muted transition-colors hover:text-ink-soft"
                >
                  {showPw ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-100"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-[1.15rem] text-lg font-bold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-60"
            >
              {loading && (
                <span
                  className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none"
                  aria-hidden
                />
              )}
              {loading ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
            </button>
          </form>

          <p className="mt-8 border-t border-line pt-6 text-center text-base text-muted">
            ลืมรหัสผ่าน?{" "}
            <span className="font-semibold text-ink-soft">
              ติดต่อติวเตอร์เพื่อรีเซ็ต
            </span>
          </p>
        </div>
      </div>
    </main>
  );
}

function CheckCircle() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="flex-none text-accent-300"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </svg>
  );
}

function Shield() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="flex-none text-accent-300"
      aria-hidden
    >
      <path d="M12 3 5 6v5c0 4.2 2.9 7.4 7 8.5 4.1-1.1 7-4.3 7-8.5V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function Eye() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOff() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c6.5 0 10 7 10 7a13 13 0 0 1-2.16 2.97M6.6 6.6A13 13 0 0 0 2 12s3.5 7 10 7a9.1 9.1 0 0 0 3.4-.65" />
      <path d="m3 3 18 18" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}
