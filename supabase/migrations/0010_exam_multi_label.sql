-- ============================================================
-- 0010 — ป้ายกำกับชุดหลายอัน (multi-label) แทน subject เดี่ยว
-- ชุดเดียวเป็นได้หลายหมวด เช่น CU-ATS + TBAT ; แก้ได้ภายหลังโดยไม่ต้องอัปโหลดใหม่
-- รันใน Supabase: SQL Editor → วางทั้งไฟล์ → Run
-- ============================================================

alter table public.exams
  add column if not exists subjects text[] not null default '{}';

-- backfill จาก subject เดี่ยวเดิม (เก็บคอลัมน์ subject ไว้ ไม่ลบ)
update public.exams
  set subjects = array[subject]
  where subject is not null and btrim(subject) <> ''
    and (subjects is null or subjects = '{}');
