-- ============================================================
-- 0017 — แท็กหัวข้อรายข้อ (Phase 4.1a)
--   exams.question_topics: array ยาว = จำนวนข้อ · ค่าแต่ละช่อง = ชื่อหัวข้อของข้อนั้น
--   ("" = ยังไม่แท็ก) · free-form ต่อชุด (เหมือน subjects)
-- รันใน Supabase: SQL Editor → วางทั้งไฟล์ → Run
-- ============================================================

alter table public.exams
  add column if not exists question_topics text[] not null default '{}';
