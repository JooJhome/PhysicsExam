-- ============================================================
-- 0009 — ตัวเลือก "ไม่จับเวลา" ต่อการมอบหมาย (untimed)
-- ข้อสอบจริงก็ตั้งไม่จับเวลาได้ (ยังให้คะแนน/ทำครั้งเดียว/ตอบแบบสอบถามตามปกติ)
-- รันใน Supabase: SQL Editor → วางทั้งไฟล์ → Run
-- ============================================================

alter table public.assignments
  add column if not exists untimed boolean not null default false;

-- start_attempt: คืน untimed (= practice หรือ assignment.untimed) เพื่อให้ client ปิดนาฬิกา
create or replace function public.start_attempt(p_exam_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_exam public.exams%rowtype;
  v_asg  public.assignments%rowtype;
  v_att  public.attempts%rowtype;
  v_duration int;
  v_practice boolean;
  v_untimed boolean;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;

  select * into v_exam from public.exams where id = p_exam_id and status = 'published';
  if not found then raise exception 'exam_not_available'; end if;

  select * into v_asg from public.assignments where exam_id = p_exam_id and student_id = v_uid;
  if not found then raise exception 'not_assigned'; end if;

  v_practice := (v_exam.kind = 'practice');
  v_untimed  := v_practice or coalesce(v_asg.untimed, false);
  v_duration := coalesce(v_asg.duration_override_min, v_exam.duration_minutes);

  select * into v_att from public.attempts where exam_id = p_exam_id and student_id = v_uid;

  if found and v_att.status = 'in_progress' then
    null; -- ทำต่อ
  else
    if found then
      if not v_practice then raise exception 'already_submitted'; end if;
      delete from public.attempts where id = v_att.id; -- practice retake: รีเซ็ต
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
    'untimed', v_untimed,
    'exam_html', v_exam.exam_html,
    'duration_minutes', v_duration,
    'total_questions', v_exam.total_questions,
    'started_at', v_att.started_at
  );
end;
$$;
