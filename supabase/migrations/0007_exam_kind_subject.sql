-- ============================================================
-- 0007 — ประเภทเนื้อหา (kind) + วิชา/หมวด (subject) ต่อชุด
-- รองรับอนาคต: ไม่ใช่แค่ "ข้อสอบ TBAT/CU-ATS" — มีแบบฝึกหัด และวิชาอื่น ๆ ได้
-- รันใน Supabase: SQL Editor → วางทั้งไฟล์ → Run
-- ============================================================

-- ---------- 1) kind: exam (ข้อสอบเต็มชุด) | practice (แบบฝึกหัด) ----------
alter table public.exams
  add column if not exists kind text not null default 'exam'
    check (kind in ('exam', 'practice'));

-- ---------- 2) subject: วิชา/หมวด แบบอิสระ (เช่น CU-ATS, TBAT, ฟิสิกส์ ม.6) ----------
alter table public.exams
  add column if not exists subject text;

-- ---------- 3) backfill subject ของชุดเดิมจาก prefix รหัส (เดิมใช้ deriveType ฝั่งโค้ด) ----------
update public.exams
  set subject = 'CU-ATS'
  where subject is null and upper(replace(exam_code, '-', '')) like 'CUATS%';

update public.exams
  set subject = 'TBAT'
  where subject is null and upper(exam_code) like 'TBAT%';
