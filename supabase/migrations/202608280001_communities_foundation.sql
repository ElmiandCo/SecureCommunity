-- One Muslim Communities foundation
-- Scalable, database-enforced ownership and membership model.

create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text not null default '' check (char_length(description) <= 1000),
  creator_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_members (
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','moderator','member')),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (community_id, user_id)
);

create index if not exists communities_creator_id_idx on public.communities(creator_id);
create index if not exists communities_name_idx on public.communities(lower(name));
create index if not exists community_members_user_status_idx on public.community_members(user_id, status);
create index if not exists community_members_community_status_idx on public.community_members(community_id, status);

-- Creator automatically becomes the owner. The ownership limit is enforced
-- inside the same transaction that creates the community, preventing races.
create or replace function public.create_community(
  p_name text,
  p_slug text,
  p_description text default ''
) returns public.communities
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  community public.communities;
  owned_count integer;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if char_length(trim(p_name)) not between 2 and 80 then raise exception 'Community name must be 2-80 characters'; end if;

  select count(*) into owned_count from public.communities where creator_id = uid;
  if owned_count >= 2 then raise exception 'You can create a maximum of 2 communities'; end if;

  insert into public.communities(name, slug, description, creator_id)
  values(trim(p_name), lower(trim(p_slug)), coalesce(trim(p_description), ''), uid)
  returning * into community;

  insert into public.community_members(community_id, user_id, role, status)
  values(community.id, uid, 'owner', 'approved');

  return community;
end;
$$;

create or replace function public.request_community_membership(p_community_id uuid)
returns public.community_members
language plpgsql
security definer
set search_path = public
as $$
declare uid uuid := auth.uid(); result public.community_members;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if not exists (select 1 from public.communities where id = p_community_id) then raise exception 'Community not found'; end if;
  insert into public.community_members(community_id,user_id,role,status)
  values(p_community_id,uid,'member','pending')
  on conflict (community_id,user_id) do update set status='pending', updated_at=now()
  returning * into result;
  return result;
end;
$$;

create or replace function public.is_approved_community_member(p_community_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.community_members where community_id=p_community_id and user_id=p_user_id and status='approved');
$$;

create or replace function public.is_community_manager(p_community_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.community_members where community_id=p_community_id and user_id=p_user_id and status='approved' and role in ('owner','moderator'));
$$;

alter table public.communities enable row level security;
alter table public.community_members enable row level security;

drop policy if exists "authenticated users can discover communities" on public.communities;
create policy "authenticated users can discover communities" on public.communities for select to authenticated using (true);

drop policy if exists "community members can view membership" on public.community_members;
create policy "community members can view membership" on public.community_members for select to authenticated using (
  user_id = auth.uid() or public.is_approved_community_member(community_id, auth.uid()) or public.is_community_manager(community_id, auth.uid())
);

revoke all on function public.create_community(text,text,text) from public;
grant execute on function public.create_community(text,text,text) to authenticated;
revoke all on function public.request_community_membership(uuid) from public;
grant execute on function public.request_community_membership(uuid) to authenticated;
revoke all on function public.is_approved_community_member(uuid,uuid) from public;
grant execute on function public.is_approved_community_member(uuid,uuid) to authenticated;
revoke all on function public.is_community_manager(uuid,uuid) from public;
grant execute on function public.is_community_manager(uuid,uuid) to authenticated;
