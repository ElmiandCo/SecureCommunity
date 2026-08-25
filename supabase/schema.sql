-- One Muslim V2 schema. Run in Supabase SQL Editor.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  bio text default '',
  city text default '',
  state_region text default '',
  country text default '',
  show_on_map boolean not null default false,
  avatar jsonb not null default '{"gender":"male","maleBase":"male-1","maskColor":"white","headwear":"none","shirtColor":"black","backgroundColor":"default","eyeGlowColor":"none"}'::jsonb,
  rank_points integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- V3 migration for existing One Muslim profiles
alter table public.profiles add column if not exists rank_points integer not null default 100;
alter table public.profiles alter column rank_points set default 100;
update public.profiles set rank_points=100 where rank_points is null;
update public.profiles set avatar='{"gender":"male","maleBase":"male-1","maskColor":"white","headwear":"none","shirtColor":"black","backgroundColor":"default","eyeGlowColor":"none"}'::jsonb where avatar is null or avatar='{}'::jsonb;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  city text default '',
  state_region text default '',
  country text default '',
  starts_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.events enable row level security;
create policy "authenticated users can read profiles" on public.profiles for select to authenticated using (true);
create policy "users create own profile" on public.profiles for insert to authenticated with check (auth.uid()=id);
create policy "users update own profile" on public.profiles for update to authenticated using (auth.uid()=id) with check (auth.uid()=id);
create policy "authenticated users can read posts" on public.posts for select to authenticated using (true);
create policy "users create own posts" on public.posts for insert to authenticated with check (auth.uid()=user_id);
create policy "users update own posts" on public.posts for update to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "users delete own posts" on public.posts for delete to authenticated using (auth.uid()=user_id);
create policy "authenticated users can read events" on public.events for select to authenticated using (true);
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into public.profiles(id,display_name,rank_points) values(new.id,coalesce(new.raw_user_meta_data->>'display_name',split_part(new.email,'@',1)),100); return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
