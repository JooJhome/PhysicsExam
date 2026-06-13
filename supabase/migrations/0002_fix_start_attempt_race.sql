-- ============================================================
-- แก้ race condition ใน start_attempt
-- อาการ: เปิดหน้าทำข้อสอบแล้ว useEffect (React Strict Mode/ดับเบิลคลิก) ยิง
--        start_attempt พร้อมกัน 2 ครั้ง → ทั้งคู่ SELECT ไม่เจอ → INSERT ชนกัน
--        → "duplicate key value violates unique constraint attempts_exam_id_student_id_key"
-- วิธีแก้: ดัก unique_violation — ตัวที่แพ้ race ดึง attempt ที่มีอยู่มาคืนแทน
-- ============================================================

create or replace function public.start_attempt(p_exam_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_exam public.exams%rowtype;
  v_att  public.attempts%rowtype;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;

  select * into v_exam from public.exams where id = p_exam_id and status = 'published';
  if not found then raise exception 'exam_not_available'; end if;

  if not exists (select 1 from public.assignments
                 where exam_id = p_exam_id and student_id = v_uid) then
    raise exception 'not_assigned';
  end if;

  select * into v_att from public.attempts where exam_id = p_exam_id and student_id = v_uid;
  if found then
    if v_att.status <> 'in_progress' then raise exception 'already_submitted'; end if;
  else
    begin
      insert into public.attempts (exam_id, student_id, status, started_at, total)
      values (p_exam_id, v_uid, 'in_progress', now(), v_exam.total_questions)
      returning * into v_att;
    exception when unique_violation then
      -- มีอีก request สร้าง attempt ไปก่อนแล้ว (race) — ดึงตัวที่มีอยู่มาใช้
      select * into v_att from public.attempts where exam_id = p_exam_id and student_id = v_uid;
      if v_att.status <> 'in_progress' then raise exception 'already_submitted'; end if;
    end;
  end if;

  return json_build_object(
    'exam_id', v_exam.id,
    'title', v_exam.title,
    'exam_html', v_exam.exam_html,
    'duration_minutes', v_exam.duration_minutes,
    'total_questions', v_exam.total_questions,
    'started_at', v_att.started_at
  );
end;
$$;
