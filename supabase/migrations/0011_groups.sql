-- ============================================================
-- 0011 — กลุ่ม/ห้องเรียน (groups) — ชั้น convenience เหนือ assignments
-- กลุ่มเป็นเครื่องมือฝั่งติวเตอร์ล้วน (RLS = tutor-only) ไม่แตะ path ทำข้อสอบ
-- "มอบหมายทั้งกลุ่ม" = ขยายสมาชิก → upsert assignments รายคนเหมือนเดิม
-- รันใน Supabase: SQL Editor → วางทั้งไฟล์ → Run
-- ============================================================

create table if not exists public.groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  color       text,                                   -- accent ของ chip (ออปชัน)
  note        text,
  created_by  uuid references public.profiles(id),
  created_at  timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id    uuid not null references public.groups(id) on delete cascade,
  student_id  uuid not null references public.profiles(id) on delete cascade,
  added_at    timestamptz not null default now(),
  primary key (group_id, student_id)
);

create index if not exists group_members_student_idx on public.group_members(student_id);

-- ---------- RLS: tutor จัดการได้ทั้งหมด ; นักเรียนไม่มี policy = แตะไม่ได้ ----------
alter table public.groups        enable row level security;
alter table public.group_members enable row level security;

drop policy if exists groups_tutor_all on public.groups;
create policy groups_tutor_all on public.groups for all
  using (public.is_tutor()) with check (public.is_tutor());

drop policy if exists group_members_tutor_all on public.group_members;
create policy group_members_tutor_all on public.group_members for all
  using (public.is_tutor()) with check (public.is_tutor());
