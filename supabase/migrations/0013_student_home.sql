-- ============================================================
-- 0013 — หน้า home นักเรียน (redesign): เพิ่ม started_at + passing_score
-- ต่อยอดจาก 0012 — redefine list_student_exams แบบ self-contained
-- (รันได้ไม่ว่า 0012 จะรันมาก่อนหรือไม่ — คืน field ครบทั้งหมด)
--   + started_at   = เวลาเริ่มทำ (ไว้คำนวณ "เหลือ {นาที}" ของ in_progress)
--   + passing_score = เกณฑ์ผ่านของชุด (ไว้ตัดสิน ผ่าน/ไม่ผ่าน บนการ์ด submitted)
-- รันใน Supabase: SQL Editor → วางทั้งไฟล์ → Run
-- ============================================================

drop function if exists public.list_student_exams();
create or replace function public.list_student_exams()
returns table (
  exam_id uuid, title text, exam_code text, description text, kind text,
  duration_minutes int, total_questions int, passing_score int,
  status text, score int, total int, submitted_at timestamptz, started_at timestamptz,
  attempt_status text, reviewed_at timestamptz, allow_review boolean,
  untimed boolean, open_at timestamptz, close_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select e.id, e.title, e.exam_code, e.description, e.kind,
         coalesce(asg.duration_override_min, e.duration_minutes) as duration_minutes,
         e.total_questions, e.passing_score,
         at.score, at.total, at.submitted_at, at.started_at, at.status, at.reviewed_at,
         e.allow_review,
         (coalesce(asg.untimed, false) or e.kind = 'practice') as untimed,
         asg.open_at, asg.close_at
  from public.assignments asg
  join public.exams e on e.id = asg.exam_id
  left join public.attempts at on at.exam_id = e.id and at.student_id = auth.uid()
  where asg.student_id = auth.uid() and e.status = 'published'
  order by e.created_at;
$$;

grant execute on function public.list_student_exams() to authenticated;
