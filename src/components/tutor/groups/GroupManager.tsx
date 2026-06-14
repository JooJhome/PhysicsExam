"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createGroup,
  renameGroup,
  deleteGroup,
  setGroupMembers,
} from "@/lib/actions/tutor";
import type { GroupListItem, GroupMemberLite } from "@/lib/groups";
import ConfirmDialog from "@/components/ConfirmDialog";
import GroupMemberDrawer from "./GroupMemberDrawer";

export default function GroupManager({
  groups,
  students,
}: {
  groups: GroupListItem[];
  students: GroupMemberLite[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [newName, setNewName] = useState("");
  const [nameError, setNameError] = useState(false);
  const newNameRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState<GroupListItem | null>(null); // จัดสมาชิก
  const [renameTarget, setRenameTarget] = useState<GroupListItem | null>(null);
  const [renameVal, setRenameVal] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<GroupListItem | null>(null);

  function flash(r: { ok: boolean; message: string }) {
    setMsg({ ok: r.ok, text: r.message });
    router.refresh();
  }

  function onCreate() {
    const name = newName.trim();
    if (!name) {
      // ช่องว่าง → ชี้ให้ชัดว่าต้องกรอกชื่อก่อน (แทนปุ่มสีจางที่งง)
      setNameError(true);
      newNameRef.current?.focus();
      return;
    }
    setNameError(false);
    startTransition(async () => {
      const r = await createGroup(name);
      flash(r);
      if (r.ok) setNewName("");
    });
  }

  function onSaveMembers(ids: string[]) {
    if (!editing) return;
    const target = editing;
    startTransition(async () => {
      const r = await setGroupMembers(target.id, ids);
      flash(r);
    });
    setEditing(null);
  }

  function onRename() {
    if (!renameTarget) return;
    const target = renameTarget;
    const name = renameVal.trim();
    setRenameTarget(null);
    if (!name || name === target.name) return;
    startTransition(async () => flash(await renameGroup(target.id, name)));
  }

  function onDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    startTransition(async () => flash(await deleteGroup(target.id)));
  }

  return (
    <div className="mt-6 space-y-4">
      {/* สร้างกลุ่ม */}
      <div className="rounded-2xl border border-line bg-white px-4 py-3 shadow-card">
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={newNameRef}
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
              if (nameError) setNameError(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && onCreate()}
            placeholder="ชื่อกลุ่มใหม่ เช่น ม.6/1, คอร์สเข้มฟิสิกส์"
            aria-label="ชื่อกลุ่มใหม่"
            aria-invalid={nameError}
            className={`min-w-0 flex-1 rounded-xl border bg-white px-4 py-2.5 text-base focus:outline-none focus:ring-2 ${
              nameError
                ? "border-red-300 focus:border-red-500 focus:ring-red-500/30"
                : "border-line focus:border-brand-500 focus:ring-brand-500/30"
            }`}
          />
          <button
            type="button"
            onClick={onCreate}
            disabled={pending}
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-60"
          >
            {pending ? "กำลังสร้าง…" : "+ สร้างกลุ่ม"}
          </button>
        </div>
        {nameError && (
          <p className="mt-2 text-sm font-medium text-red-600">พิมพ์ชื่อกลุ่มก่อนกดสร้าง</p>
        )}
      </div>

      {msg && (
        <p
          className={`rounded-xl px-4 py-3 text-sm font-medium ring-1 ${
            msg.ok ? "bg-green-50 text-green-700 ring-green-200" : "bg-red-50 text-red-700 ring-red-100"
          }`}
        >
          {msg.text}
        </p>
      )}

      <p className="text-sm text-muted">
        ทั้งหมด <b className="font-display font-bold text-ink">{groups.length}</b> กลุ่ม
      </p>

      {groups.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white px-5 py-14 text-center shadow-card">
          <p className="text-2xl">👥</p>
          <p className="mt-2 font-semibold text-ink">ยังไม่มีกลุ่ม</p>
          <p className="mt-1 text-sm text-muted">สร้างกลุ่มแรกด้านบน แล้วเพิ่มนักเรียนเข้าไป</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {groups.map((g) => (
            <div key={g.id} className="rounded-2xl border border-line bg-white p-4 shadow-card">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-display text-lg font-bold text-ink">{g.name}</h3>
                  <p className="text-sm text-muted">{g.memberCount} คน</p>
                </div>
                <div className="flex flex-none gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setRenameTarget(g);
                      setRenameVal(g.name);
                    }}
                    className="rounded-lg border border-line px-2.5 py-1 text-xs font-semibold text-ink-soft transition-colors hover:bg-canvas"
                  >
                    แก้ชื่อ
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(g)}
                    className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                  >
                    ลบ
                  </button>
                </div>
              </div>

              {/* member avatars */}
              {g.members.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {g.members.slice(0, 8).map((m) => (
                    <span
                      key={m.id}
                      title={m.displayName || m.username}
                      className="grid h-8 w-8 place-items-center rounded-full bg-brand-50 font-display text-xs font-bold uppercase text-brand-700"
                    >
                      {(m.displayName || m.username).charAt(0)}
                    </span>
                  ))}
                  {g.members.length > 8 && (
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-sand-100 text-xs font-bold text-muted">
                      +{g.members.length - 8}
                    </span>
                  )}
                </div>
              )}

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(g)}
                  className="rounded-lg border border-brand-200 px-4 py-2 text-sm font-bold text-brand-700 transition-colors hover:bg-brand-50"
                >
                  จัดสมาชิก
                </button>
                <Link
                  href="/tutor/assign"
                  className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:bg-canvas"
                >
                  มอบหมายข้อสอบ
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <GroupMemberDrawer
          group={editing}
          students={students}
          onClose={() => setEditing(null)}
          onSave={onSaveMembers}
          busy={pending}
        />
      )}

      <ConfirmDialog
        open={renameTarget !== null}
        title="แก้ชื่อกลุ่ม"
        body={
          <input
            value={renameVal}
            onChange={(e) => setRenameVal(e.target.value)}
            autoFocus
            className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        }
        confirmLabel="บันทึก"
        cancelLabel="ยกเลิก"
        tone="brand"
        busy={pending}
        onConfirm={onRename}
        onCancel={() => setRenameTarget(null)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="ลบกลุ่ม?"
        body={
          <p>
            ลบกลุ่ม <b className="text-ink">{deleteTarget?.name}</b> — เป็นการลบกลุ่มเท่านั้น
            <b className="text-ink"> ไม่กระทบบัญชีนักเรียนหรือข้อสอบที่มอบหมายไปแล้ว</b>
          </p>
        }
        confirmLabel="ลบกลุ่ม"
        cancelLabel="ยกเลิก"
        tone="danger"
        busy={pending}
        onConfirm={onDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
