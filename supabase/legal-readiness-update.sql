-- Apply this small update to an existing VideoBox database before using
-- the updated video report form. Safe to run more than once.
alter table public.video_reports
  add column if not exists reporter_email text;
alter table public.video_reports
  add column if not exists comment_id uuid references public.video_comments(id) on delete set null;
create index if not exists video_reports_comment_idx
  on public.video_reports(comment_id) where comment_id is not null;

-- Only let a signed-in reporter attach the email address on their own session.
drop policy if exists video_reports_insert_own on public.video_reports;
create policy video_reports_insert_own on public.video_reports
  for insert to authenticated
  with check (
    reporter_id = (select auth.uid())
    and status = 'open'
    and (reporter_email is null or reporter_email = (select auth.jwt() ->> 'email'))
    and (
      comment_id is null
      or exists (
        select 1
        from public.video_comments as reported_comment
        where reported_comment.id = public.video_reports.comment_id
          and reported_comment.video_id = public.video_reports.video_id
          and reported_comment.status = 'published'
      )
    )
  );
