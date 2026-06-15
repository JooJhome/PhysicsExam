-- ============================================================
-- 0015 — live assignment: ตารางมอบหมายระดับกลุ่ม (group ↔ exam + window)
--   เป็นแหล่งความจริงว่า "ชุดนี้ถูกมอบให้กลุ่มนี้แบบต่อเนื่อง"
--   → เพิ่มคนเข้ากลุ่มทีหลัง app จะ auto-สร้าง assignments รายคนให้เอง
--   (assignments รายคนยังเป็นตัวบังคับสิทธิ์จริงเหมือนเดิม — ตารางนี้แค่ template)
-- รันใน Supabase: SQL Editor → วางทั้งไฟล์ → Run
-- ============================================================

create table if not exists public.group_assignments (
  group_id              uuid not null references public.groups(id) on delete cascade,
  exam_id               uuid not null references public.exams(id) on delete cascade,
  open_at               timestamptz,
  close_at              timestamptz,
  due_at                timestamptz,
  duration_override_min int,
  untimed               boolean not null default false,
  created_at            timestamptz not null default now(),
  primary key (group_id, exam_id)
);

create index if not exists group_assignments_exam_idx on public.group_assignments(exam_id);

alter table public.group_assignments enable row level security;

drop policy if exists group_assignments_tutor_all on public.group_assignments;
create policy group_assignments_tutor_all on public.group_assignments for all
  using (public.is_tutor()) with check (public.is_tutor());
