-- ============================================================
-- 0014 — autosave คำตอบระหว่างทำ (Phase 1.2)
--   • save_progress: เขียน attempts.answers ระหว่างทำ (ไม่เปลี่ยน status/score)
--   • list_student_exams: เพิ่ม answered (จำนวนข้อที่ตอบแล้ว) → หน้านักเรียนโชว์ "เหลือกี่ข้อ"
-- รันใน Supabase: SQL Editor → วางทั้งไฟล์ → Run
-- ============================================================

-- บันทึกคำตอบชั่วคราว — เฉพาะ attempt ของตัวเองที่ยัง in_progress เท่านั้น
create or replace function public.save_progress(p_exam_id uuid, p_answers jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  update public.attempts
     set answers = p_answers
   where exam_id = p_exam_id
     and student_id = auth.uid()
     and status = 'in_progress';
end;
$$;
grant execute on function public.save_progress(uuid, jsonb) to authenticated;

-- list_student_exams + answered (นับ element ที่ไม่ใช่ null ใน attempts.answers)
drop function if exists public.list_student_exams();
create or replace function public.list_student_exams()
returns table (
  exam_id uuid, title text, exam_code text, description text, kind text,
  duration_minutes int, total_questions int, passing_score int,
  score int, total int, submitted_at timestamptz, started_at timestamptz,
  attempt_status text, reviewed_at timestamptz, allow_review boolean,
  untimed boolean, open_at timestamptz, close_at timestamptz, answered int
)
language sql stable security definer set search_path = public as $$
  select e.id, e.title, e.exam_code, e.description, e.kind,
         coalesce(asg.duration_override_min, e.duration_minutes) as duration_minutes,
         e.total_questions, e.passing_score,
         at.score, at.total, at.submitted_at, at.started_at, at.status, at.reviewed_at,
         e.allow_review,
         (coalesce(asg.untimed, false) or e.kind = 'practice') as untimed,
         asg.open_at, asg.close_at,
         coalesce((
           select count(*)::int from jsonb_array_elements(at.answers) v
           where v <> 'null'::jsonb
         ), 0) as answered
  from public.assignments asg
  join public.exams e on e.id = asg.exam_id
  left join public.attempts at on at.exam_id = e.id and at.student_id = auth.uid()
  where asg.student_id = auth.uid() and e.status = 'published'
  order by e.created_at;
$$;
grant execute on function public.list_student_exams() to authenticated;
