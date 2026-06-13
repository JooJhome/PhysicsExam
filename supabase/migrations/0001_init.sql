-- ============================================================
-- BSIINK Physics Exam — schema + RLS + RPC
-- รันใน Supabase: SQL Editor → วางทั้งไฟล์ → Run
-- ============================================================

-- ---------- ตาราง ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null default 'student' check (role in ('tutor','student')),
  username    text unique not null,
  full_name   text,
  created_at  timestamptz not null default now()
);

create table if not exists public.exams (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  exam_code        text unique not null,           -- เช่น CU-ATS_Aug2027
  description      text,
  duration_minutes int  not null default 180,
  total_questions  int  not null default 30,
  exam_html        text not null,                   -- ฉบับสอบ (ไม่มีเฉลย)
  review_html      text not null,                   -- ฉบับเฉลย
  allow_review     boolean not null default true,   -- ให้นักเรียนดูเฉลยหลังส่งหรือไม่
  status           text not null default 'draft' check (status in ('draft','published')),
  created_by       uuid references public.profiles(id),
  created_at       timestamptz not null default now()
);

-- เฉลยแยกตาราง — RLS เปิดเฉพาะ tutor; นักเรียน select ไม่ได้เด็ดขาด
create table if not exists public.exam_answer_keys (
  exam_id  uuid primary key references public.exams(id) on delete cascade,
  answers  jsonb not null                            -- [30 ตัว ค่า 1..5]
);

create table if not exists public.assignments (
  id          uuid primary key default gen_random_uuid(),
  exam_id     uuid not null references public.exams(id) on delete cascade,
  student_id  uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (exam_id, student_id)
);

create table if not exists public.attempts (
  id            uuid primary key default gen_random_uuid(),
  exam_id       uuid not null references public.exams(id) on delete cascade,
  student_id    uuid not null references public.profiles(id) on delete cascade,
  status        text not null default 'in_progress' check (status in ('in_progress','submitted','expired')),
  started_at    timestamptz not null default now(),
  submitted_at  timestamptz,
  score         int,
  total         int,
  answers       jsonb,
  unique (exam_id, student_id)   -- ★ บังคับ 1 คน/ชุด/ครั้ง
);

-- ---------- helper ----------
create or replace function public.is_tutor()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'tutor');
$$;

-- ---------- RLS ----------
alter table public.profiles         enable row level security;
alter table public.exams            enable row level security;
alter table public.exam_answer_keys enable row level security;
alter table public.assignments      enable row level security;
alter table public.attempts         enable row level security;

-- profiles: ดูตัวเอง / tutor ดูทุกคน ; แก้ไขผ่าน service-role (admin) เท่านั้น
drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles for select
  using (id = auth.uid() or public.is_tutor());

-- exams: tutor จัดการได้ทั้งหมด ; นักเรียนเห็น metadata เฉพาะที่ published + ถูก assign
drop policy if exists exams_tutor_all on public.exams;
create policy exams_tutor_all on public.exams for all
  using (public.is_tutor()) with check (public.is_tutor());

drop policy if exists exams_student_read on public.exams;
create policy exams_student_read on public.exams for select
  using (
    status = 'published'
    and exists (select 1 from public.assignments a
                where a.exam_id = exams.id and a.student_id = auth.uid())
  );

-- exam_answer_keys: tutor เท่านั้น (นักเรียนไม่มี policy = select ไม่ได้)
drop policy if exists keys_tutor_all on public.exam_answer_keys;
create policy keys_tutor_all on public.exam_answer_keys for all
  using (public.is_tutor()) with check (public.is_tutor());

-- assignments: tutor จัดการ ; นักเรียนเห็นของตัวเอง
drop policy if exists assign_tutor_all on public.assignments;
create policy assign_tutor_all on public.assignments for all
  using (public.is_tutor()) with check (public.is_tutor());

drop policy if exists assign_student_read on public.assignments;
create policy assign_student_read on public.assignments for select
  using (student_id = auth.uid());

-- attempts: tutor อ่านทั้งหมด+reset ; นักเรียนอ่านของตัวเอง (เขียนผ่าน RPC เท่านั้น)
drop policy if exists attempts_tutor_all on public.attempts;
create policy attempts_tutor_all on public.attempts for all
  using (public.is_tutor()) with check (public.is_tutor());

drop policy if exists attempts_student_read on public.attempts;
create policy attempts_student_read on public.attempts for select
  using (student_id = auth.uid());

-- ============================================================
-- RPC (SECURITY DEFINER) — ทางเดียวที่นักเรียนแตะข้อสอบ/เฉลย
-- ============================================================

-- รายการชุดสอบของนักเรียน + สถานะ (ไม่มี HTML/เฉลย)
create or replace function public.list_student_exams()
returns table (
  exam_id uuid, title text, exam_code text, description text,
  duration_minutes int, total_questions int,
  status text, score int, total int, submitted_at timestamptz, attempt_status text
)
language sql stable security definer set search_path = public as $$
  select e.id, e.title, e.exam_code, e.description,
         e.duration_minutes, e.total_questions, e.status,
         at.score, at.total, at.submitted_at, at.status
  from public.assignments asg
  join public.exams e on e.id = asg.exam_id
  left join public.attempts at on at.exam_id = e.id and at.student_id = auth.uid()
  where asg.student_id = auth.uid() and e.status = 'published'
  order by e.created_at;
$$;

-- เริ่ม/กลับเข้าทำข้อสอบ → คืนฉบับสอบ (ไม่มีเฉลย)
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
    insert into public.attempts (exam_id, student_id, status, started_at, total)
    values (p_exam_id, v_uid, 'in_progress', now(), v_exam.total_questions)
    returning * into v_att;
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

-- ส่งคำตอบ → ตรวจกับเฉลยฝั่งเซิร์ฟเวอร์ → ล็อก (idempotent)
create or replace function public.submit_attempt(p_exam_id uuid, p_answers jsonb)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_att public.attempts%rowtype;
  v_key jsonb;
  v_total int;
  v_score int;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;

  select * into v_att from public.attempts where exam_id = p_exam_id and student_id = v_uid;
  if not found then raise exception 'not_started'; end if;
  if v_att.status = 'submitted' then
    return json_build_object('score', v_att.score, 'total', v_att.total, 'already', true);
  end if;

  select answers into v_key from public.exam_answer_keys where exam_id = p_exam_id;
  if v_key is null then raise exception 'no_answer_key'; end if;

  v_total := jsonb_array_length(v_key);
  select count(*) into v_score
  from generate_series(0, v_total - 1) i
  where (p_answers ->> i)::int = (v_key ->> i)::int;

  update public.attempts
     set status = 'submitted', submitted_at = now(),
         answers = p_answers, score = v_score, total = v_total
   where id = v_att.id;

  return json_build_object('score', v_score, 'total', v_total, 'already', false);
end;
$$;

-- ดูฉบับเฉลยหลังส่ง (ถ้า tutor เปิดให้)
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
    'allow_review', v_exam.allow_review,
    'answers', v_att.answers,
    'review_html', case when v_exam.allow_review then v_exam.review_html else null end
  );
end;
$$;

-- สิทธิ์เรียก RPC
grant execute on function public.list_student_exams() to authenticated;
grant execute on function public.start_attempt(uuid) to authenticated;
grant execute on function public.submit_attempt(uuid, jsonb) to authenticated;
grant execute on function public.get_review(uuid) to authenticated;
grant execute on function public.is_tutor() to authenticated;
