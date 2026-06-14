"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createStudent, createStudentsBulkDetailed } from "@/lib/actions/tutor";
import { generatePassword } from "@/lib/password";
import CredentialHandoff, { type Credential } from "./CredentialHandoff";

type Mode = "single" | "csv" | "file";

type ParsedRow = {
  username: string;
  password: string;
  fullName: string;
  generated: boolean;
  error?: string;
};

const TEMPLATE = "username,password,full_name\nsom,,สมชาย ใจดี\nying,,สมหญิง รักเรียน\n";

function parseCsv(text: string, existing: Set<string>): ParsedRow[] {
  const seen = new Set<string>();
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && !/^username\s*,/i.test(l))
    .map((line) => {
      const [uRaw = "", pRaw = "", ...rest] = line.split(",");
      const username = uRaw.trim().toLowerCase();
      const fullName = rest.join(",").trim();
      let password = pRaw.trim();
      let generated = false;
      let error: string | undefined;

      if (!username) error = "ไม่มี username";
      else if (existing.has(username)) error = "ซ้ำกับที่มีอยู่";
      else if (seen.has(username)) error = "ซ้ำในไฟล์";
      else if (!fullName) error = "ไม่มีชื่อ-สกุล";
      else if (password && password.length < 6) error = "รหัสสั้นกว่า 6 ตัว";

      if (username) seen.add(username);
      if (!password) {
        password = generatePassword();
        generated = true;
      }
      return { username, password, fullName, generated, error };
    });
}

export default function AddStudentCard({
  existingUsernames,
  variant = "card",
}: {
  existingUsernames: string[];
  variant?: "card" | "bare";
}) {
  const router = useRouter();
  const existing = new Set(existingUsernames.map((u) => u.toLowerCase()));
  const [mode, setMode] = useState<Mode>("single");

  // single
  const [password, setPassword] = useState(generatePassword());
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [creds, setCreds] = useState<Credential[]>([]);

  // csv/file
  const [csvText, setCsvText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const parsed = mode === "single" ? [] : parseCsv(csvText, existing);
  const valid = parsed.filter((r) => !r.error);
  const dup = parsed.filter((r) => r.error?.startsWith("ซ้ำ")).length;
  const errs = parsed.filter((r) => r.error && !r.error.startsWith("ซ้ำ")).length;

  async function onCreateSingle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    const username = String(fd.get("username") || "").trim().toLowerCase();
    const r = await createStudent(fd);
    setMsg({ ok: r.ok, text: r.message });
    setBusy(false);
    if (r.ok) {
      setCreds([{ username, password, displayName: String(fd.get("full_name") || "").trim() || undefined }]);
      (e.target as HTMLFormElement).reset();
      setPassword(generatePassword());
      router.refresh();
    }
  }

  async function onCommitBulk() {
    setBusy(true);
    setMsg(null);
    const res = await createStudentsBulkDetailed(
      valid.map((r) => ({ username: r.username, password: r.password, fullName: r.fullName }))
    );
    const okSet = new Set(res.results.filter((r) => r.ok).map((r) => r.username));
    const made = valid
      .filter((r) => okSet.has(r.username))
      .map((r) => ({ username: r.username, password: r.password, displayName: r.fullName || undefined }));
    const failed = res.results.filter((r) => !r.ok);
    setCreds(made);
    setMsg({
      ok: failed.length === 0,
      text: `สร้างสำเร็จ ${made.length} บัญชี` + (failed.length ? ` · ปัญหา ${failed.length} แถว` : ""),
    });
    setBusy(false);
    if (made.length) {
      setCsvText("");
      router.refresh();
    }
  }

  function loadFile(f: File | null) {
    if (!f) return;
    f.text().then((t) => {
      setCsvText(t);
      setMode("file");
    });
  }

  function downloadTemplate() {
    const blob = new Blob([TEMPLATE], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bsiink-students-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const seg = (m: Mode, label: string) => (
    <button
      type="button"
      onClick={() => setMode(m)}
      aria-pressed={mode === m}
      className={`min-h-[40px] rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
        mode === m ? "bg-brand-600 text-white shadow-sm" : "text-ink-soft hover:bg-white"
      }`}
    >
      {label}
    </button>
  );

  const field =
    "w-full rounded-xl border border-line bg-white px-4 py-3 text-base transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

  const bare = variant === "bare";

  return (
    <div className={bare ? "" : "rounded-2xl border border-line bg-white p-5 shadow-card sm:p-7"}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        {!bare && <h2 className="font-display text-xl font-bold text-ink">เพิ่มนักเรียน</h2>}
        <div className="flex flex-wrap gap-1 rounded-xl bg-canvas p-1">
          {seg("single", "ทีละคน")}
          {seg("csv", "วาง CSV")}
          {seg("file", "อัปโหลดไฟล์ .csv")}
        </div>
      </div>

      {/* ---- ทีละคน ---- */}
      {mode === "single" && (
        <form onSubmit={onCreateSingle} className="mt-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="username" className="mb-1.5 block text-sm font-semibold text-ink-soft">
                Username
              </label>
              <input id="username" name="username" required autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="เช่น punim" className={field} />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-ink-soft">
                รหัสผ่าน
              </label>
              <div className="flex gap-2">
                <input
                  id="password"
                  name="password"
                  required
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${field} font-mono`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "ซ่อนรหัส" : "แสดงรหัส"}
                  className="min-h-[44px] flex-none rounded-xl border border-line px-3 text-sm font-semibold text-ink-soft transition-colors hover:bg-canvas"
                >
                  {showPw ? "ซ่อน" : "แสดง"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPassword(generatePassword());
                    setShowPw(true);
                  }}
                  className="min-h-[44px] flex-none rounded-xl border border-brand-200 px-3 text-sm font-bold text-brand-700 transition-colors hover:bg-brand-50"
                >
                  สุ่ม
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="full_name" className="mb-1.5 block text-sm font-semibold text-ink-soft">
                ชื่อ-สกุล <span className="font-normal text-muted">(ใช้เป็นลายน้ำตอนสอบ)</span>
              </label>
              <input id="full_name" name="full_name" required placeholder="เช่น สมชาย ใจดี" className={field} />
            </div>
          </div>
          <p className="mt-3 text-xs text-muted">
            รหัสถูกแฮชเก็บ — คัดลอกตอนสร้างเพื่อส่งให้นักเรียน (ดูย้อนหลังไม่ได้)
          </p>
          <button
            disabled={busy}
            className="mt-4 w-full rounded-xl bg-brand-600 py-3 text-base font-bold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-60 sm:w-auto sm:px-8"
          >
            {busy ? "กำลังสร้าง…" : "เพิ่มนักเรียน"}
          </button>
        </form>
      )}

      {/* ---- CSV / ไฟล์ ---- */}
      {mode !== "single" && (
        <div className="mt-5">
          <p className="text-sm text-muted">
            บรรทัดละคน:{" "}
            <code className="rounded bg-sand-100 px-1.5 py-0.5 font-mono text-xs text-ink-soft">
              username,password,ชื่อ-สกุล
            </code>{" "}
            · เว้นรหัสไว้ = สุ่มให้ ·{" "}
            <button type="button" onClick={downloadTemplate} className="font-semibold text-brand-700 underline-offset-2 hover:underline">
              ดาวน์โหลดเทมเพลต .csv
            </button>
          </p>

          {mode === "file" ? (
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                loadFile(e.dataTransfer.files?.[0] ?? null);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileRef.current?.click();
                }
              }}
              className="mt-3 cursor-pointer rounded-2xl border-2 border-dashed border-line bg-canvas/40 px-4 py-8 text-center transition-colors hover:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            >
              <p className="text-sm font-semibold text-ink">ลากไฟล์ .csv มาวาง หรือเลือกไฟล์</p>
              <p className="mt-1 text-xs text-muted">{csvText ? "โหลดไฟล์แล้ว — ตรวจตัวอย่างด้านล่าง" : "เข้ารหัส UTF-8"}</p>
              <input ref={fileRef} type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => loadFile(e.target.files?.[0] ?? null)} />
            </div>
          ) : (
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              rows={5}
              placeholder={"som,,สมชาย ใจดี\nying,pass5678,สมหญิง รักเรียน"}
              className="mt-3 w-full rounded-xl border border-line bg-white px-4 py-3 font-mono text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          )}

          {/* preview */}
          {parsed.length > 0 && (
            <div className="mt-3 rounded-xl border border-line bg-canvas/50 p-4">
              <p className="text-sm font-semibold text-ink">
                จะสร้าง <span className="text-brand-700">{valid.length}</span> บัญชี
                {dup > 0 && <> · ซ้ำกับที่มีอยู่ <span className="text-accent-700">{dup}</span></>}
                {errs > 0 && <> · มีปัญหา <span className="text-red-600">{errs}</span> แถว</>}
              </p>
              {parsed.some((r) => r.error) && (
                <ul className="mt-2 space-y-0.5 text-xs text-muted">
                  {parsed
                    .filter((r) => r.error)
                    .slice(0, 6)
                    .map((r, i) => (
                      <li key={i}>
                        <span className="font-mono text-ink-soft">{r.username || "(ว่าง)"}</span> — {r.error}
                      </li>
                    ))}
                </ul>
              )}
            </div>
          )}

          <button
            onClick={onCommitBulk}
            disabled={busy || valid.length === 0}
            className="mt-4 w-full rounded-xl bg-brand-600 py-3 text-base font-bold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-50 sm:w-auto sm:px-8"
          >
            {busy ? "กำลังสร้าง…" : `สร้าง ${valid.length || ""} บัญชี`}
          </button>
        </div>
      )}

      {msg && (
        <p
          className={`mt-4 rounded-xl px-4 py-3 text-sm font-medium ring-1 ${
            msg.ok ? "bg-green-50 text-green-700 ring-green-200" : "bg-red-50 text-red-700 ring-red-100"
          }`}
        >
          {msg.text}
        </p>
      )}

      {creds.length > 0 && (
        <div className="mt-3">
          <CredentialHandoff creds={creds} onDismiss={() => setCreds([])} />
        </div>
      )}
    </div>
  );
}
