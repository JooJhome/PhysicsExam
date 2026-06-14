"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteStudent, resetStudentPassword, renameStudent } from "@/lib/actions/tutor";
import { generatePassword } from "@/lib/password";
import type { StudentListItem } from "@/lib/students";
import ConfirmDialog from "@/components/ConfirmDialog";
import AddStudentCard from "@/components/tutor/students/AddStudentCard";
import StudentCard from "@/components/tutor/students/StudentCard";
import CredentialHandoff, { type Credential } from "@/components/tutor/students/CredentialHandoff";

export default function StudentManager({ students }: { students: StudentListItem[] }) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<{ ids: string[]; label: string } | null>(null);
  const [resetCred, setResetCred] = useState<Credential | null>(null);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return students;
    return students.filter((s) =>
      `${s.username} ${s.displayName ?? ""}`.toLowerCase().includes(term)
    );
  }, [students, q]);

  function act(fn: () => Promise<{ ok: boolean; message: string }>) {
    startTransition(async () => {
      const r = await fn();
      setMsg({ ok: r.ok, text: r.message });
      router.refresh();
    });
  }

  function toggleSelect(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function onReset(student: StudentListItem) {
    const password = generatePassword();
    startTransition(async () => {
      const r = await resetStudentPassword(student.id, password);
      setMsg({ ok: r.ok, text: r.ok ? `รีเซ็ตรหัส ${student.username} แล้ว` : r.message });
      if (r.ok) setResetCred({ username: student.username, password, displayName: student.displayName ?? undefined });
    });
  }

  function confirmDelete() {
    const ids = deleteTarget?.ids ?? [];
    setDeleteTarget(null);
    if (ids.length === 0) return;
    startTransition(async () => {
      let ok = 0;
      for (const id of ids) {
        const r = await deleteStudent(id);
        if (r.ok) ok++;
      }
      setSelected(new Set());
      setMsg({ ok: ok === ids.length, text: `ลบแล้ว ${ok}/${ids.length} บัญชี` });
      router.refresh();
    });
  }

  const allVisibleSelected = filtered.length > 0 && filtered.every((s) => selected.has(s.id));

  return (
    <div className="mt-8 space-y-6">
      <AddStudentCard existingUsernames={students.map((s) => s.username)} />

      {msg && (
        <p
          className={`rounded-xl px-4 py-3 text-sm font-medium ring-1 ${
            msg.ok ? "bg-green-50 text-green-700 ring-green-200" : "bg-red-50 text-red-700 ring-red-100"
          }`}
        >
          {msg.text}
        </p>
      )}

      {/* รายชื่อ */}
      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-xl font-bold text-ink">
            รายชื่อนักเรียน{" "}
            <span className="text-sm font-medium text-muted">{students.length} คน</span>
          </h2>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นหาชื่อ / username"
            aria-label="ค้นหานักเรียน"
            className="w-full rounded-xl border border-line bg-white px-4 py-3 text-base transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 sm:w-72"
          />
        </div>

        {/* select-all + bulk */}
        {filtered.length > 0 && (
          <label className="mb-2 inline-flex min-h-[40px] cursor-pointer items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={(e) =>
                setSelected(e.target.checked ? new Set(filtered.map((s) => s.id)) : new Set())
              }
              className="h-4 w-4 accent-brand-600"
            />
            เลือกทั้งหมดในรายการ
          </label>
        )}

        <div className="space-y-3">
          {filtered.map((s) => (
            <StudentCard
              key={s.id}
              student={s}
              selected={selected.has(s.id)}
              pending={pending}
              onSelect={(checked) => toggleSelect(s.id, checked)}
              onReset={() => onReset(s)}
              onRename={(name) => act(() => renameStudent(s.id, name))}
              onDelete={() => setDeleteTarget({ ids: [s.id], label: s.username })}
            />
          ))}

          {filtered.length === 0 && (
            <div className="rounded-2xl border border-line bg-white px-5 py-14 text-center shadow-card">
              <p className="text-2xl">{students.length === 0 ? "👥" : "🔍"}</p>
              <p className="mt-2 font-semibold text-ink">
                {students.length === 0 ? "ยังไม่มีนักเรียน" : "ไม่พบนักเรียนที่ค้นหา"}
              </p>
              <p className="mt-1 text-sm text-muted">
                {students.length === 0 ? "เพิ่มทีละคนหรือวาง CSV ด้านบน" : "ลองค้นด้วยคำอื่น"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* bulk bar (sticky) */}
      {selected.size > 0 && (
        <div className="sticky bottom-3 z-20">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3 shadow-lift">
            <span className="text-sm font-semibold text-ink">เลือก {selected.size} คน</span>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-sm font-medium text-muted hover:text-ink"
            >
              ล้าง
            </button>
            <div className="ml-auto flex flex-wrap gap-2">
              <Link
                href="/tutor/assign"
                className="rounded-lg border border-brand-200 px-4 py-2 text-sm font-bold text-brand-700 transition-colors hover:bg-brand-50"
              >
                มอบหมายข้อสอบ
              </Link>
              <button
                type="button"
                onClick={() =>
                  setDeleteTarget({ ids: [...selected], label: `${selected.size} คน` })
                }
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-bold text-red-600 transition-colors hover:bg-red-50"
              >
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ลบ */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="ลบนักเรียน?"
        body={
          <p>
            ลบบัญชี <span className="font-semibold text-ink">{deleteTarget?.label}</span> และ
            <span className="font-medium text-ink">ผลสอบ/การมอบหมายทั้งหมด</span>ของคนนี้ — ย้อนกลับไม่ได้
          </p>
        }
        confirmLabel="ลบ"
        cancelLabel="ยกเลิก"
        tone="danger"
        busy={pending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* รหัสใหม่หลังรีเซ็ต */}
      <ConfirmDialog
        open={resetCred !== null}
        title={`รหัสใหม่ของ ${resetCred?.username ?? ""}`}
        body={
          resetCred ? (
            <div>
              <p className="mb-3">รหัสนี้แสดงครั้งเดียว — คัดลอก/พิมพ์เพื่อส่งให้นักเรียนก่อนปิด</p>
              <CredentialHandoff creds={[resetCred]} />
            </div>
          ) : undefined
        }
        confirmLabel="เสร็จแล้ว"
        tone="brand"
        onConfirm={() => setResetCred(null)}
      />
    </div>
  );
}
