-- ============================================================
-- 0012 — ฝั่งนักเรียน: แสดงเวลาทำจริง (override) + ไม่จับเวลา + วันปิดรับ (deadline)
-- list_student_exams เดิมคืน exams.duration_minutes (ค่า default ของชุด) เสมอ
-- → ถ้าติวเตอร์ตั้งเวลา/ไม่จับเวลา/วันปิด ต่อการมอบหมาย (assignments) จะไม่โชว์
-- แก้ให้คืนค่าตามการมอบหมายจริง (ตรงกับที่ start_attempt ใช้):
--   duration_minutes = coalesce(asg.duration_override_min, exams.duration_minutes)
--   untimed          = asg.untimed OR exams.kind = 'practice'
--   open_at/close_at  = ช่วงเวลาทำข้อสอบของการมอบหมายนั้น (close_at = วันปิดรับ)
-- รันใน Supabase: SQL Editor → วางทั้งไฟล์ → Run
-- ============================================================

drop function if exists public.list_student_exams();
create or replace function public.list_student_exams()
returns table (
  exam_id uuid, title text, exam_code text, description text, kind text,
  duration_minutes int, total_questions int,
  status text, score int, total int, submitted_at timestamptz,
  attempt_status text, reviewed_at timestamptz,
  untimed boolean, open_at timestamptz, close_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select e.id, e.title, e.exam_code, e.description, e.kind,
         coalesce(asg.duration_override_min, e.duration_minutes) as duration_minutes,
         e.total_questions, e.status,
         at.score, at.total, at.submitted_at, at.status, at.reviewed_at,
         (coalesce(asg.untimed, false) or e.kind = 'practice') as untimed,
         asg.open_at, asg.close_at
  from public.assignments asg
  join public.exams e on e.id = asg.exam_id
  left join public.attempts at on at.exam_id = e.id and at.student_id = auth.uid()
  where asg.student_id = auth.uid() and e.status = 'published'
  order by e.created_at;
$$;
