-- ============================================================
-- ดูเฉลย/ผลคะแนนได้ "ครั้งเดียว"
-- - หลังส่งคำตอบ + ตอบแบบสอบถาม → โชว์คะแนน+เฉลยได้
-- - เมื่อนักเรียน "กดออก" → เซ็ต reviewed_at → เข้ามาดูซ้ำไม่ได้อีก
--   (gate จริงทำที่ frontend แต่ยึดสถานะจาก reviewed_at ใน DB กันเลี่ยงด้วย reload/อีกเครื่อง)
-- ============================================================

alter table public.attempts add column if not exists reviewed_at timestamptz;

-- ปิดการดูเฉลย (เรียกตอนนักเรียนกดออกจากหน้าเฉลย) — idempotent
create or replace function public.close_review(p_exam_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  update public.attempts
     set reviewed_at = coalesce(reviewed_at, now())
   where exam_id = p_exam_id and student_id = v_uid and status = 'submitted';
  return json_build_object('ok', true);
end;
$$;

grant execute on function public.close_review(uuid) to authenticated;

-- get_review: เพิ่ม reviewed_at เพื่อให้ frontend รู้ว่าปิดดูเฉลยไปแล้วหรือยัง
create or replace function public.get_review(p_exam_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_exam public.exams%rowtype;
  v_att  public.attempts%rowtype;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;

  select * into v_att from public.attempts where exam_id = p_exam_id and student_id = v_uid;
  if not found or v_att.status <> 'submitted' then raise exception 'not_submitted'; end if;

  select * into v_exam from public.exams where id = p_exam_id;

  return json_build_object(
    'title', v_exam.title,
    'score', v_att.score,
    'total', v_att.total,
    'submitted_at', v_att.submitted_at,
    'reviewed_at', v_att.reviewed_at,
    'allow_review', v_exam.allow_review,
    'answers', v_att.answers,
    'review_html', case when v_exam.allow_review then v_exam.review_html else null end
  );
end;
$$;

-- list_student_exams: เพิ่ม reviewed_at เพื่อให้หน้ารวมตัดสินใจว่ายังมีเฉลยค้างให้ดูไหม
-- ต้อง drop ก่อน เพราะเปลี่ยน return type (เพิ่มคอลัมน์) — create or replace ทำไม่ได้
drop function if exists public.list_student_exams();
create or replace function public.list_student_exams()
returns table (
  exam_id uuid, title text, exam_code text, description text,
  duration_minutes int, total_questions int,
  status text, score int, total int, submitted_at timestamptz,
  attempt_status text, reviewed_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select e.id, e.title, e.exam_code, e.description,
         e.duration_minutes, e.total_questions, e.status,
         at.score, at.total, at.submitted_at, at.status, at.reviewed_at
  from public.assignments asg
  join public.exams e on e.id = asg.exam_id
  left join public.attempts at on at.exam_id = e.id and at.student_id = auth.uid()
  where asg.student_id = auth.uid() and e.status = 'published'
  order by e.created_at;
$$;
