-- ============================================================
-- 0005 — มอบหมาย: lifecycle archived + availability window + duration override
-- รันใน Supabase: SQL Editor → วางทั้งไฟล์ → Run
-- ============================================================

-- ---------- 1) exams.status: เพิ่ม 'archived' (คลัง) ----------
-- archived ถูกซ่อนจากนักเรียนอัตโนมัติ เพราะ RPC กรองเฉพาะ status='published'
alter table public.exams drop constraint if exists exams_status_check;
alter table public.exams
  add constraint exams_status_check check (status in ('draft','published','archived'));

-- ---------- 2) assignments: ช่วงเวลา + เวลาสอบ override (ต่อการมอบหมาย) ----------
alter table public.assignments
  add column if not exists open_at             timestamptz,
  add column if not exists close_at            timestamptz,
  add column if not exists due_at              timestamptz,
  add column if not exists duration_override_min int;

-- ---------- 3) start_attempt: บังคับ window + ใช้ duration override ----------
create or replace function public.start_attempt(p_exam_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_exam public.exams%rowtype;
  v_asg  public.assignments%rowtype;
  v_att  public.attempts%rowtype;
  v_duration int;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;

  select * into v_exam from public.exams where id = p_exam_id and status = 'published';
  if not found then raise exception 'exam_not_available'; end if;

  select * into v_asg from public.assignments where exam_id = p_exam_id and student_id = v_uid;
  if not found then raise exception 'not_assigned'; end if;

  v_duration := coalesce(v_asg.duration_override_min, v_exam.duration_minutes);

  select * into v_att from public.attempts where exam_id = p_exam_id and student_id = v_uid;
  if found then
    if v_att.status <> 'in_progress' then raise exception 'already_submitted'; end if;
    -- attempt ที่ค้างอยู่ → ให้กลับเข้าทำต่อได้เสมอ (ไม่บล็อกด้วย window)
  else
    -- เริ่มใหม่: บังคับช่วงเวลาเปิดสอบ (ถ้ากำหนดไว้)
    if v_asg.open_at is not null and now() < v_asg.open_at then
      raise exception 'exam_not_open';
    end if;
    if v_asg.close_at is not null and now() > v_asg.close_at then
      raise exception 'exam_closed';
    end if;
    insert into public.attempts (exam_id, student_id, status, started_at, total)
    values (p_exam_id, v_uid, 'in_progress', now(), v_exam.total_questions)
    returning * into v_att;
  end if;

  return json_build_object(
    'exam_id', v_exam.id,
    'title', v_exam.title,
    'exam_html', v_exam.exam_html,
    'duration_minutes', v_duration,
    'total_questions', v_exam.total_questions,
    'started_at', v_att.started_at
  );
end;
$$;
