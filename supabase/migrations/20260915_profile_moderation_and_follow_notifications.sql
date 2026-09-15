create table if not exists public.profile_blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index if not exists profile_blocks_blocked_idx on public.profile_blocks(blocked_id);
alter table public.profile_blocks enable row level security;
drop policy if exists profile_blocks_select_own on public.profile_blocks;
drop policy if exists profile_blocks_insert_own on public.profile_blocks;
drop policy if exists profile_blocks_delete_own on public.profile_blocks;
create policy profile_blocks_select_own on public.profile_blocks for select to authenticated using (blocker_id = auth.uid());
create policy profile_blocks_insert_own on public.profile_blocks for insert to authenticated with check (blocker_id = auth.uid() and blocker_id <> blocked_id);
create policy profile_blocks_delete_own on public.profile_blocks for delete to authenticated using (blocker_id = auth.uid());

create table if not exists public.profile_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (char_length(trim(reason)) between 2 and 120),
  details text not null default '',
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now()
);

create index if not exists profile_reports_profile_idx on public.profile_reports(profile_id, created_at desc);
create index if not exists profile_reports_reporter_idx on public.profile_reports(reporter_id, created_at desc);
alter table public.profile_reports enable row level security;
drop policy if exists profile_reports_select_own on public.profile_reports;
drop policy if exists profile_reports_insert_own on public.profile_reports;
create policy profile_reports_select_own on public.profile_reports for select to authenticated using (reporter_id = auth.uid());
create policy profile_reports_insert_own on public.profile_reports for insert to authenticated with check (reporter_id = auth.uid() and reporter_id <> profile_id);

create or replace function public.notify_profile_follow()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.follower_id is distinct from new.following_id then
    insert into public.notifications (recipient_id, actor_id, type, title, body, entity_type, entity_id, metadata)
    values (new.following_id, new.follower_id, 'follow', 'New follower', 'Someone followed your profile.', 'profile', new.follower_id, jsonb_build_object('follower_id', new.follower_id));
  end if;
  return new;
end;
$$;

drop trigger if exists profile_follow_notification on public.profile_follows;
create trigger profile_follow_notification after insert on public.profile_follows for each row execute function public.notify_profile_follow();
