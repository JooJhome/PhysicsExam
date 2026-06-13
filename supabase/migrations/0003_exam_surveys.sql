-- ============================================================
-- แบบสอบถามหลังสอบ (post-exam survey)
-- - นักเรียนกรอกหลังส่งคำตอบ (บังคับก่อนออกจากหน้า)
-- - เก็บลงตาราง exam_surveys (1 attempt = 1 survey)
-- - tutor อ่านได้ทั้งหมด ; นักเรียนเขียนผ่าน RPC submit_survey เท่านั้น
-- ============================================================

create table if not exists public.exam_surveys (
  attempt_id      uuid primary key references public.attempts(id) on delete cascade,
  exam_id         uuid not null references public.exams(id)     on delete cascade,
  student_id      uuid not null references public.profiles(id)  on delete cascade,
  difficulty      smallint not null check (difficulty    between 1 and 5),  -- ความยาก
  time_adequacy   smallint not null check (time_adequacy between 1 and 5),  -- เวลาเพียงพอ
  confidence      smallint not null check (confidence    between 1 and 5),  -- ความมั่นใจ
  stress          smallint not null check (stress        between 1 and 5),  -- ความเครียด
  hardest_topics  text,                                                     -- บทที่ยากที่สุด
  comment         text,                                                     -- ความเห็นถึงติวเตอร์
  created_at      timestamptz not null default now()
);

alter table public.exam_surveys enable row level security;

-- tutor จัดการ/อ่านได้ทั้งหมด
drop policy if exists surveys_tutor_all on public.exam_surveys;
create policy surveys_tutor_all on public.exam_surveys for all
  using (public.is_tutor()) with check (public.is_tutor());

-- นักเรียนอ่านของตัวเอง (เขียนผ่าน RPC เท่านั้น)
drop policy if exists surveys_student_read on public.exam_surveys;
create policy surveys_student_read on public.exam_surveys for select
  using (student_id = auth.uid());

-- ส่งแบบสอบถาม → ผูกกับ attempt ที่ "ส่งแล้ว" ของนักเรียนคนนั้น (idempotent)
create or replace function public.submit_survey(
  p_exam_id        uuid,
  p_difficulty     int,
  p_time_adequacy  int,
  p_confidence     int,
  p_stress         int,
  p_hardest_topics text,
  p_comment        text
) returns json language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_att public.attempts%rowtype;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;

  select * into v_att from public.attempts where exam_id = p_exam_id and student_id = v_uid;
  if not found then raise exception 'not_started'; end if;
  if v_att.status <> 'submitted' then raise exception 'not_submitted'; end if;

  insert into public.exam_surveys (
    attempt_id, exam_id, student_id,
    difficulty, time_adequacy, confidence, stress, hardest_topics, comment
  ) values (
    v_att.id, p_exam_id, v_uid,
    p_difficulty, p_time_adequacy, p_confidence, p_stress,
    nullif(btrim(p_hardest_topics), ''), nullif(btrim(p_comment), '')
  )
  on conflict (attempt_id) do update set
    difficulty     = excluded.difficulty,
    time_adequacy  = excluded.time_adequacy,
    confidence     = excluded.confidence,
    stress         = excluded.stress,
    hardest_topics = excluded.hardest_topics,
    comment        = excluded.comment;

  return json_build_object('ok', true);
end;
$$;

grant execute on function public.submit_survey(uuid, int, int, int, int, text, text) to authenticated;

-- เช็คว่านักเรียนกรอกแบบสอบถามของชุดนี้แล้วหรือยัง (กันบังคับซ้ำตอน reload)
create or replace function public.has_survey(p_exam_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.exam_surveys
    where exam_id = p_exam_id and student_id = auth.uid()
  );
$$;

grant execute on function public.has_survey(uuid) to authenticated;
