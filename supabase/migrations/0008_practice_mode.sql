-- ============================================================
-- 0008 — โหมดแบบฝึกหัด (practice): ทำซ้ำได้ (reset-and-retry) + ไม่จับเวลา
-- ส่ง exams.kind ลงฝั่งนักเรียน เพื่อให้ client ปิด timer/เปิดปุ่มทำใหม่
-- รันใน Supabase: SQL Editor → วางทั้งไฟล์ → Run
-- ============================================================

-- ---------- 1) start_attempt: practice = reset-and-retry + คืน kind ----------
-- exam (ปกติ): ทำได้ครั้งเดียว, บังคับ window, จับเวลา (เหมือนเดิม)
-- practice: ถ้าเคยส่งแล้ว → ลบ attempt เดิมแล้วเริ่มใหม่ (คง 1 แถว/คน/ชุด), ข้าม window
create or replace function public.start_attempt(p_exam_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_exam public.exams%rowtype;
  v_asg  public.assignments%rowtype;
  v_att  public.attempts%rowtype;
  v_duration int;
  v_practice boolean;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;

  select * into v_exam from public.exams where id = p_exam_id and status = 'published';
  if not found then raise exception 'exam_not_available'; end if;

  select * into v_asg from public.assignments where exam_id = p_exam_id and student_id = v_uid;
  if not found then raise exception 'not_assigned'; end if;

  v_practice := (v_exam.kind = 'practice');
  v_duration := coalesce(v_asg.duration_override_min, v_exam.duration_minutes);

  select * into v_att from public.attempts where exam_id = p_exam_id and student_id = v_uid;

  if found and v_att.status = 'in_progress' then
    -- ค้างอยู่ → กลับเข้าทำต่อได้ทั้ง exam และ practice
    null;
  else
    if found then
      -- เคยส่งแล้ว/หมดเวลา
      if not v_practice then raise exception 'already_submitted'; end if;
      -- practice: ลบของเก่าทิ้ง แล้วเริ่มใหม่ (reset reviewed_at/score ไปในตัว)
      delete from public.attempts where id = v_att.id;
    end if;
    -- เริ่มใหม่: exam บังคับ window; practice ข้าม window
    if not v_practice then
      if v_asg.open_at is not null and now() < v_asg.open_at then raise exception 'exam_not_open'; end if;
      if v_asg.close_at is not null and now() > v_asg.close_at then raise exception 'exam_closed'; end if;
    end if;
    insert into public.attempts (exam_id, student_id, status, started_at, total)
    values (p_exam_id, v_uid, 'in_progress', now(), v_exam.total_questions)
    returning * into v_att;
  end if;

  return json_build_object(
    'exam_id', v_exam.id,
    'title', v_exam.title,
    'kind', v_exam.kind,
    'exam_html', v_exam.exam_html,
    'duration_minutes', v_duration,
    'total_questions', v_exam.total_questions,
    'started_at', v_att.started_at
  );
end;
$$;

-- ---------- 2) list_student_exams: เพิ่ม kind (ให้ฝั่งนักเรียนแยกแบบฝึกหัด) ----------
drop function if exists public.list_student_exams();
create or replace function public.list_student_exams()
returns table (
  exam_id uuid, title text, exam_code text, description text, kind text,
  duration_minutes int, total_questions int,
  status text, score int, total int, submitted_at timestamptz,
  attempt_status text, reviewed_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select e.id, e.title, e.exam_code, e.description, e.kind,
         e.duration_minutes, e.total_questions, e.status,
         at.score, at.total, at.submitted_at, at.status, at.reviewed_at
  from public.assignments asg
  join public.exams e on e.id = asg.exam_id
  left join public.attempts at on at.exam_id = e.id and at.student_id = auth.uid()
  where asg.student_id = auth.uid() and e.status = 'published'
  order by e.created_at;
$$;
