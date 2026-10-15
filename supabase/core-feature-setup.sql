-- VideoBox core feature setup. Safe to run more than once.
-- Run the whole file in Supabase SQL Editor once before using the new features.

alter table public.videos
  add column if not exists content_type text not null default 'film',
  add column if not exists creator_name text,
  add column if not exists monetization_enabled boolean not null default false;

-- Admin checks run as a fixed-search-path security definer so they can safely
-- read the admin list even when row-level security is enabled on that table.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Admin-only append-only ledger for manually recorded business income/expenses.
-- This is not an AdSense earnings feed or a payout/withdrawal system.
create table if not exists public.money_entries (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('income', 'expense')),
  source text not null check (char_length(trim(source)) between 1 and 100),
  description text check (description is null or char_length(description) <= 1000),
  amount numeric(14,2) not null check (amount > 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  recorded_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

alter table public.money_entries enable row level security;
drop policy if exists money_entries_admin_read on public.money_entries;
create policy money_entries_admin_read on public.money_entries
  for select to authenticated using (public.is_admin());
drop policy if exists money_entries_admin_insert on public.money_entries;
create policy money_entries_admin_insert on public.money_entries
  for insert to authenticated with check (public.is_admin());
-- No update/delete policy: retain an append-only audit trail.
grant select, insert on public.money_entries to authenticated;
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'videos_content_type_check'
      and conrelid = 'public.videos'::regclass
  ) then
    alter table public.videos
      add constraint videos_content_type_check
      check (content_type in ('film', 'short'));
  end if;
end $$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'videos',
  'videos',
  true,
  52428800,
  array['video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- New creator uploads stay private while awaiting moderation. The approval
-- flow copies an approved object into the public videos bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'video-drafts',
  'video-drafts',
  false,
  52428800,
  array['video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Ordinary creators must not upload straight to the public bucket, even if
-- they bypass Creator Studio. Only the admin approval copy may insert there.
drop policy if exists videobox_videos_upload_own_folder on storage.objects;
-- Only admins may remove public objects so a creator cannot silently delete
-- an approved file while leaving its published video record behind.
drop policy if exists videobox_videos_delete_own_folder on storage.objects;
drop policy if exists videobox_videos_admin_insert on storage.objects;
create policy videobox_videos_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'videos' and public.is_admin());
drop policy if exists videobox_videos_admin_delete on storage.objects;
create policy videobox_videos_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'videos' and public.is_admin());

drop policy if exists videobox_video_drafts_upload_own_folder on storage.objects;
create policy videobox_video_drafts_upload_own_folder on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'video-drafts'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
drop policy if exists videobox_video_drafts_read_own_or_admin on storage.objects;
create policy videobox_video_drafts_read_own_or_admin on storage.objects
  for select to authenticated
  using (
    bucket_id = 'video-drafts'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or public.is_admin()
    )
  );
drop policy if exists videobox_video_drafts_delete_own_or_admin on storage.objects;
create policy videobox_video_drafts_delete_own_or_admin on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'video-drafts'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or public.is_admin()
    )
  );

-- Video pages use the same authenticated account model as the rest of the app.
-- Creators can upload drafts; only admins can publish/reject them.
alter table public.videos enable row level security;
drop policy if exists videobox_videos_read_published_or_owner_or_admin on public.videos;
create policy videobox_videos_read_published_or_owner_or_admin on public.videos
  for select to authenticated
  using (status = 'published' or user_id = (select auth.uid()) or public.is_admin());
drop policy if exists videobox_videos_insert_own_draft on public.videos;
create policy videobox_videos_insert_own_draft on public.videos
  for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'draft');
drop policy if exists videobox_videos_update_admin on public.videos;
create policy videobox_videos_update_admin on public.videos
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create table if not exists public.video_saves (
  user_id uuid not null references auth.users(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, video_id)
);

-- Per-viewer playback history. Store only the latest playback position and
-- completion state; users can read and update only their own rows.
create table if not exists public.watch_history (
  user_id uuid not null references auth.users(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  last_position_seconds integer not null default 0 check (last_position_seconds >= 0),
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, video_id)
);

create table if not exists public.video_likes (
  user_id uuid not null references auth.users(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, video_id)
);

create table if not exists public.video_comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  status text not null default 'published' check (status in ('published', 'hidden')),
  created_at timestamptz not null default now()
);

create table if not exists public.creator_follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  creator_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, creator_id),
  check (follower_id <> creator_id)
);

create table if not exists public.video_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reporter_email text,
  video_id uuid not null references public.videos(id) on delete cascade,
  comment_id uuid references public.video_comments(id) on delete set null,
  reason text not null check (char_length(trim(reason)) between 3 and 500),
  details text check (details is null or char_length(details) <= 2000),
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now()
);
alter table public.video_reports
  add column if not exists reporter_email text;
alter table public.video_reports
  add column if not exists comment_id uuid references public.video_comments(id) on delete set null;
create index if not exists video_saves_user_created_idx
  on public.video_saves(user_id, created_at desc);
create index if not exists video_likes_video_idx
  on public.video_likes(video_id);
create index if not exists video_comments_video_created_idx
  on public.video_comments(video_id, created_at desc);
create index if not exists creator_follows_creator_idx
  on public.creator_follows(creator_id);
create index if not exists video_reports_comment_idx
  on public.video_reports(comment_id) where comment_id is not null;

alter table public.video_saves enable row level security;
alter table public.watch_history enable row level security;
alter table public.video_likes enable row level security;
alter table public.video_comments enable row level security;
alter table public.creator_follows enable row level security;
alter table public.video_reports enable row level security;

drop policy if exists video_saves_read_own on public.video_saves;
create policy video_saves_read_own on public.video_saves
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists video_saves_insert_own on public.video_saves;
create policy video_saves_insert_own on public.video_saves
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists video_saves_delete_own on public.video_saves;
create policy video_saves_delete_own on public.video_saves
  for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists watch_history_read_own on public.watch_history;
create policy watch_history_read_own on public.watch_history
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists watch_history_insert_own on public.watch_history;
create policy watch_history_insert_own on public.watch_history
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists watch_history_update_own on public.watch_history;
create policy watch_history_update_own on public.watch_history
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
drop policy if exists watch_history_delete_own on public.watch_history;
create policy watch_history_delete_own on public.watch_history
  for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists video_likes_read_authenticated on public.video_likes;
drop policy if exists video_likes_read_own_or_admin on public.video_likes;
create policy video_likes_read_own_or_admin on public.video_likes
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
drop policy if exists video_likes_insert_own on public.video_likes;
create policy video_likes_insert_own on public.video_likes
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists video_likes_delete_own on public.video_likes;
create policy video_likes_delete_own on public.video_likes
  for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists video_comments_read_visible on public.video_comments;
create policy video_comments_read_visible on public.video_comments
  for select to authenticated
  using (status = 'published' or user_id = (select auth.uid()) or public.is_admin());
drop policy if exists video_comments_insert_own on public.video_comments;
create policy video_comments_insert_own on public.video_comments
  for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'published');
drop policy if exists video_comments_delete_own_or_admin on public.video_comments;
create policy video_comments_delete_own_or_admin on public.video_comments
  for delete to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
drop policy if exists video_comments_admin_update on public.video_comments;
create policy video_comments_admin_update on public.video_comments
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists creator_follows_read_authenticated on public.creator_follows;
drop policy if exists creator_follows_read_own_or_admin on public.creator_follows;
create policy creator_follows_read_own_or_admin on public.creator_follows
  for select to authenticated
  using (follower_id = (select auth.uid()) or public.is_admin());
drop policy if exists creator_follows_insert_own on public.creator_follows;
create policy creator_follows_insert_own on public.creator_follows
  for insert to authenticated
  with check (follower_id = (select auth.uid()) and follower_id <> creator_id);
drop policy if exists creator_follows_delete_own on public.creator_follows;
create policy creator_follows_delete_own on public.creator_follows
  for delete to authenticated using (follower_id = (select auth.uid()));

grant select, insert, delete on public.video_saves to authenticated;
grant select, insert, update, delete on public.watch_history to authenticated;
grant select, insert, delete on public.video_likes to authenticated;
revoke all on public.video_comments from public, anon, authenticated;
grant select (id, video_id, body, status, created_at) on public.video_comments to authenticated;
grant insert (user_id, video_id, body) on public.video_comments to authenticated;
grant update (status) on public.video_comments to authenticated;
grant delete on public.video_comments to authenticated;
grant select, insert, delete on public.creator_follows to authenticated;
grant select, insert, update on public.video_reports to authenticated;
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
drop policy if exists video_reports_read_own_or_admin on public.video_reports;
create policy video_reports_read_own_or_admin on public.video_reports
  for select to authenticated
  using (reporter_id = (select auth.uid()) or public.is_admin());
drop policy if exists video_reports_admin_update on public.video_reports;
create policy video_reports_admin_update on public.video_reports
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Expose only aggregate like counts and the current viewer's own like state.
-- This avoids returning other viewers' internal user IDs to the browser.
create or replace function public.get_video_engagement(video_ids_input uuid[])
returns table(video_id uuid, like_count bigint, liked_by_me boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select
    v.id,
    count(l.user_id)::bigint,
    coalesce(bool_or(l.user_id = (select auth.uid())), false)
  from public.videos as v
  left join public.video_likes as l on l.video_id = v.id
  where v.status = 'published'
    and v.id = any(coalesce(video_ids_input, array[]::uuid[]))
  group by v.id;
$$;
revoke all on function public.get_video_engagement(uuid[]) from public;
revoke all on function public.get_video_engagement(uuid[]) from anon;
grant execute on function public.get_video_engagement(uuid[]) to authenticated;

-- Return a creator's public follower total without disclosing the follower list.
create or replace function public.get_creator_follower_count(creator_id_input uuid)
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::bigint
  from public.creator_follows as f
  where f.creator_id = creator_id_input;
$$;
revoke all on function public.get_creator_follower_count(uuid) from public;
revoke all on function public.get_creator_follower_count(uuid) from anon;
grant execute on function public.get_creator_follower_count(uuid) to authenticated;
create or replace function public.increment_video_view(video_id_input uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.videos
  set view_count = coalesce(view_count, 0) + 1
  where id = video_id_input and status = 'published';
$$;
revoke all on function public.increment_video_view(uuid) from public;
grant execute on function public.increment_video_view(uuid) to authenticated;

