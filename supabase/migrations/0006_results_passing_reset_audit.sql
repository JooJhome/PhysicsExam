-- ============================================================
-- 0006 — ผลสอบ: เกณฑ์ผ่านต่อชุด + เก็บประวัติการรีเซ็ต (audit)
-- รันใน Supabase: SQL Editor → วางทั้งไฟล์ → Run
-- ============================================================

-- ---------- 1) เกณฑ์ผ่านต่อชุด (จำนวนข้อ; null = ใช้ค่า default กลาง 50%) ----------
alter table public.exams
  add column if not exists passing_score int;

-- ---------- 2) ประวัติการรีเซ็ต (เก็บ snapshot ก่อนลบ + ใครรีเซ็ต) ----------
create table if not exists public.attempt_resets (
  id            uuid primary key default gen_random_uuid(),
  exam_id       uuid not null references public.exams(id) on delete cascade,
  student_id    uuid not null references public.profiles(id) on delete cascade,
  reset_by      uuid references public.profiles(id),
  reset_at      timestamptz not null default now(),
  prev_status   text,
  prev_score    int,
  prev_total    int,
  prev_answers  jsonb,
  prev_started_at   timestamptz,
  prev_submitted_at timestamptz
);

create index if not exists attempt_resets_exam_student_idx
  on public.attempt_resets (exam_id, student_id);

-- RLS: ติวเตอร์เท่านั้น (นักเรียนไม่มี policy = อ่าน/เขียนไม่ได้)
alter table public.attempt_resets enable row level security;
drop policy if exists resets_tutor_all on public.attempt_resets;
create policy resets_tutor_all on public.attempt_resets for all
  using (public.is_tutor()) with check (public.is_tutor());
