"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  deleteStudent,
  resetStudentPassword,
  renameStudent,
  addStudentsToGroups,
} from "@/lib/actions/tutor";
import { generatePassword } from "@/lib/password";
import type { StudentListItem } from "@/lib/students";
import ConfirmDialog from "@/components/ConfirmDialog";
import AddStudentModal from "@/components/tutor/students/AddStudentModal";
import StudentCard from "@/components/tutor/students/StudentCard";
import CredentialHandoff, { type Credential } from "@/components/tutor/students/CredentialHandoff";
import StudentsToolbar, { type StudentSortKey } from "@/components/tutor/students/StudentsToolbar";

type GroupRef = { id: string; name: string; color: string | null };

export default function StudentManager({
  students,
  groups = [],
}: {
  students: StudentListItem[];
  groups?: GroupRef[];
}) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<StudentSortKey>("recent");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<{ ids: string[]; label: string } | null>(null);
  const [resetCred, setResetCred] = useState<Credential | null>(null);
  const [addToGroupOpen, setAddToGroupOpen] = useState(false);
  const [pickedGroups, setPickedGroups] = useState<Set<string>>(new Set());

  const groupNameById = useMemo(
    () => new Map(groups.map((g) => [g.id, g.name])),
    [groups]
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let base = students;
    if (groupFilter !== "all") base = base.filter((s) => s.groupIds.includes(groupFilter));
    const out = term
      ? base.filter((s) =>
          `${s.username} ${s.displayName ?? ""}`.toLowerCase().includes(term)
        )
      : [...base];
    switch (sort) {
      case "name":
        out.sort((a, b) =>
          (a.displayName ?? a.username).localeCompare(b.displayName ?? b.username, "th")
        );
        break;
      case "assigned":
        out.sort((a, b) => b.assignedCount - a.assignedCount);
        break;
      case "avg":
        out.sort((a, b) => (b.avgPercent ?? -1) - (a.avgPercent ?? -1));
        break;
      case "recent":
      default:
        out.sort((a, b) => (b.lastActiveAt ?? "").localeCompare(a.lastActiveAt ?? ""));
        break;
    }
    return out;
  }, [students, q, sort, groupFilter]);

  // นักเรียนที่ยังไม่มีชื่อจริง (displayName=null คือยังเป็น username/ว่าง) → ลายน้ำใช้ username
  const needNameCount = students.filter((s) => !s.displayName).length;

  function doAddToGroups() {
    const ids = [...selected];
    const gids = [...pickedGroups];
    setAddToGroupOpen(false);
    setPickedGroups(new Set());
    if (ids.length === 0 || gids.length === 0) return;
    startTransition(async () => {
      const r = await addStudentsToGroups(ids, gids);
      setMsg({ ok: r.ok, text: r.message });
      setSelected(new Set());
      router.refresh();
    });
  }

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
    <div className="mt-6 space-y-4">
      <StudentsToolbar
        q={q}
        sort={sort}
        onSearch={setQ}
        onSort={setSort}
        onAdd={() => setAddOpen(true)}
      />

      {/* กรองตามกลุ่ม */}
      {groups.length > 0 && (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          <button
            type="button"
            onClick={() => setGroupFilter("all")}
            className={`flex-none rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
              groupFilter === "all"
                ? "bg-brand-600 text-white"
                : "border border-line bg-white text-ink-soft hover:border-brand-200"
            }`}
          >
            ทุกกลุ่ม
          </button>
          {groups.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setGroupFilter(g.id)}
              className={`flex-none rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                groupFilter === g.id
                  ? "bg-brand-600 text-white"
                  : "border border-line bg-white text-ink-soft hover:border-brand-200"
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      )}

      {msg && (
        <p
          className={`rounded-xl px-4 py-3 text-sm font-medium ring-1 ${
            msg.ok ? "bg-green-50 text-green-700 ring-green-200" : "bg-red-50 text-red-700 ring-red-100"
          }`}
        >
          {msg.text}
        </p>
      )}

      {/* เตือนคนที่ยังไม่มีชื่อจริง — ลายน้ำตอนสอบจะใช้ username ไปก่อน */}
      {needNameCount > 0 && (
        <div className="flex items-start gap-2 rounded-xl bg-accent-50 px-4 py-3 text-sm text-accent-900 ring-1 ring-accent-200">
          <span aria-hidden>🪪</span>
          <p>
            มี <b className="font-display tabular-nums">{needNameCount}</b>{" "}
            คนยังไม่ได้ตั้งชื่อจริง — ลายน้ำตอนทำข้อสอบจะใช้ username ไปก่อน
            กดเมนู <b>⋯ → แก้ไขชื่อ</b> เพื่อเติมชื่อ-สกุล
          </p>
        </div>
      )}

      {/* รายชื่อ */}
      <div>
        <p className="mb-2 text-sm text-muted">
          นักเรียนทั้งหมด <b className="font-display font-bold text-ink">{students.length}</b> คน
          {q.trim() && <> · พบ <b className="font-display font-bold text-ink">{filtered.length}</b></>}
        </p>

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
              groupNames={s.groupIds.map((id) => groupNameById.get(id)).filter((n): n is string => !!n)}
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
              {groups.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setPickedGroups(new Set());
                    setAddToGroupOpen(true);
                  }}
                  className="rounded-lg border border-accent-200 px-4 py-2 text-sm font-bold text-accent-700 transition-colors hover:bg-accent-50"
                >
                  เพิ่มเข้ากลุ่ม
                </button>
              )}
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

      {/* เพิ่มนักเรียน */}
      <AddStudentModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        existingUsernames={students.map((s) => s.username)}
      />

      {/* เพิ่มเข้ากลุ่ม (bulk) */}
      <ConfirmDialog
        open={addToGroupOpen}
        title={`เพิ่ม ${selected.size} คนเข้ากลุ่ม`}
        body={
          <div>
            <p className="mb-3 text-sm text-muted">เลือกกลุ่มที่จะเพิ่มนักเรียนเข้าไป (เลือกได้หลายกลุ่ม)</p>
            <div className="max-h-64 space-y-1 overflow-y-auto">
              {groups.map((g) => {
                const on = pickedGroups.has(g.id);
                return (
                  <label
                    key={g.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-canvas"
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() =>
                        setPickedGroups((prev) => {
                          const next = new Set(prev);
                          if (next.has(g.id)) next.delete(g.id);
                          else next.add(g.id);
                          return next;
                        })
                      }
                      className="h-4 w-4 accent-brand-600"
                    />
                    <span className="font-display font-semibold text-ink">{g.name}</span>
                  </label>
                );
              })}
            </div>
          </div>
        }
        confirmLabel="เพิ่มเข้ากลุ่ม"
        cancelLabel="ยกเลิก"
        tone="brand"
        busy={pending}
        onConfirm={doAddToGroups}
        onCancel={() => setAddToGroupOpen(false)}
      />

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
