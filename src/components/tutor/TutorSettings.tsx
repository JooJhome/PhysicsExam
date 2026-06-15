"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateTutorName, changeOwnPassword } from "@/lib/actions/tutor";

const field =
  "w-full rounded-xl border border-line bg-white px-4 py-2.5 text-base transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";
const btn =
  "rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-50";

export default function TutorSettings({
  username,
  fullName,
}: {
  username: string;
  fullName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [name, setName] = useState(fullName);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");

  function flash(r: { ok: boolean; message: string }) {
    setMsg({ ok: r.ok, text: r.message });
  }

  function saveName() {
    if (!name.trim() || name.trim() === fullName) return;
    startTransition(async () => {
      flash(await updateTutorName(name));
      router.refresh();
    });
  }

  function savePassword() {
    if (pw.length < 6) return flash({ ok: false, message: "รหัสผ่านอย่างน้อย 6 ตัวอักษร" });
    if (pw !== pw2) return flash({ ok: false, message: "รหัสผ่านสองช่องไม่ตรงกัน" });
    startTransition(async () => {
      const r = await changeOwnPassword(pw);
      flash(r);
      if (r.ok) {
        setPw("");
        setPw2("");
      }
    });
  }

  return (
    <div className="mt-6 space-y-4">
      {msg && (
        <p
          className={`rounded-xl px-4 py-3 text-sm font-medium ring-1 ${
            msg.ok ? "bg-green-50 text-green-700 ring-green-200" : "bg-red-50 text-red-700 ring-red-100"
          }`}
        >
          {msg.text}
        </p>
      )}

      {/* โปรไฟล์ */}
      <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
        <h2 className="font-display text-lg font-bold text-ink">โปรไฟล์</h2>
        <div className="mt-3 space-y-1">
          <label className="text-xs font-medium text-muted">ชื่อผู้ใช้ (เปลี่ยนไม่ได้)</label>
          <input value={username} disabled className={`${field} cursor-not-allowed bg-canvas text-hint`} />
        </div>
        <div className="mt-3 space-y-1">
          <label className="text-xs font-medium text-muted" htmlFor="t-name">
            ชื่อที่แสดง
          </label>
          <input
            id="t-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ชื่อ-สกุล"
            className={field}
          />
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={saveName}
            disabled={pending || !name.trim() || name.trim() === fullName}
            className={btn}
          >
            บันทึกชื่อ
          </button>
        </div>
      </section>

      {/* รหัสผ่าน */}
      <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
        <h2 className="font-display text-lg font-bold text-ink">เปลี่ยนรหัสผ่าน</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted" htmlFor="t-pw">
              รหัสผ่านใหม่
            </label>
            <input
              id="t-pw"
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              autoComplete="new-password"
              placeholder="อย่างน้อย 6 ตัวอักษร"
              className={field}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted" htmlFor="t-pw2">
              ยืนยันรหัสผ่านใหม่
            </label>
            <input
              id="t-pw2"
              type="password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              autoComplete="new-password"
              className={field}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button type="button" onClick={savePassword} disabled={pending || !pw || !pw2} className={btn}>
            เปลี่ยนรหัสผ่าน
          </button>
        </div>
      </section>
    </div>
  );
}
