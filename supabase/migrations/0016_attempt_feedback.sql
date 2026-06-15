-- ============================================================
-- 0016 — ฟีดแบ็กติวเตอร์ → นักเรียน ต่อ attempt (Phase 4.2)
--   • attempts.tutor_feedback: คอมเมนต์ของติวเตอร์ต่อการทำครั้งนั้น
--   • get_review: คืน tutor_feedback ให้นักเรียนเห็นในหน้าผล
--   (ติวเตอร์เขียนผ่าน RLS attempts_tutor_all เดิม — ไม่ต้องเพิ่ม policy)
-- รันใน Supabase: SQL Editor → วางทั้งไฟล์ → Run
-- ============================================================

alter table public.attempts add column if not exists tutor_feedback text;

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
    'tutor_feedback', v_att.tutor_feedback,
    'answers', v_att.answers,
    'review_html', case when v_exam.allow_review then v_exam.review_html else null end
  );
end;
$$;
