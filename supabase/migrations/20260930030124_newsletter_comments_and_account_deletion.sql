-- OneMuslim Newsletter + account deletion foundation
-- Applied to production as migration: newsletter_comments_and_account_deletion

create table if not exists public.newsletter_articles (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 180),
  slug text not null unique,
  category text not null default 'Community' check (category in ('Community','Faith','Family','Knowledge','Discussion','Announcements')),
  excerpt text not null default '' check (char_length(excerpt) <= 500),
  content text not null default '',
  cover_emoji text not null default '📰',
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.newsletter_comments (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.newsletter_articles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists newsletter_articles_category_idx on public.newsletter_articles(category);
create index if not exists newsletter_articles_created_idx on public.newsletter_articles(created_at desc);
create index if not exists newsletter_comments_article_idx on public.newsletter_comments(article_id, created_at asc);
create index if not exists newsletter_comments_user_idx on public.newsletter_comments(user_id);

alter table public.newsletter_articles enable row level security;
alter table public.newsletter_comments enable row level security;

-- Article creation is enforced in the database, not only by the UI.
-- The only allowed author is the exact normalized email elmi@elmi.com.
create policy "authenticated users can read published newsletter articles"
on public.newsletter_articles for select to authenticated
using (published = true or lower(coalesce(auth.jwt()->>'email','')) = 'elmi@elmi.com');

create policy "Elmi can create newsletter articles"
on public.newsletter_articles for insert to authenticated
with check (lower(coalesce(auth.jwt()->>'email','')) = 'elmi@elmi.com' and author_id = auth.uid());

create policy "Elmi can update newsletter articles"
on public.newsletter_articles for update to authenticated
using (lower(coalesce(auth.jwt()->>'email','')) = 'elmi@elmi.com' and author_id = auth.uid())
with check (lower(coalesce(auth.jwt()->>'email','')) = 'elmi@elmi.com' and author_id = auth.uid());

create policy "Elmi can delete newsletter articles"
on public.newsletter_articles for delete to authenticated
using (lower(coalesce(auth.jwt()->>'email','')) = 'elmi@elmi.com' and author_id = auth.uid());

create policy "authenticated users can read newsletter comments"
on public.newsletter_comments for select to authenticated using (true);

create policy "authenticated users can create own newsletter comments"
on public.newsletter_comments for insert to authenticated
with check (user_id = auth.uid());

create policy "users can update own newsletter comments"
on public.newsletter_comments for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "users can delete own newsletter comments"
on public.newsletter_comments for delete to authenticated
using (user_id = auth.uid());

create or replace function public.delete_my_account()
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
  return true;
end;
$$;

revoke all on function public.delete_my_account() from public;
revoke execute on function public.delete_my_account() from anon;
grant execute on function public.delete_my_account() to authenticated;

-- Account deletion must not be blocked by an old lesson-video ownership record.
alter table public.lesson_videos drop constraint if exists lesson_videos_uploaded_by_fkey;
alter table public.lesson_videos add constraint lesson_videos_uploaded_by_fkey
  foreign key (uploaded_by) references auth.users(id) on delete set null;


-- Optional starter content for a new OneMuslim database.
insert into public.newsletter_articles (author_id,title,slug,category,excerpt,content,cover_emoji,published)
select id,'A Wedding Built Around Family, Faith & Joy','wedding-family-faith-joy','Family',
'A Muslim wedding can be deeply rooted in tradition and beautifully personal — from the nikah to the gathering that follows.',
'Across generations, families often find their own rhythm for celebrating a marriage. The heart of the occasion remains simple: two people making a commitment, families coming together, and a community sharing in their happiness.',
'💍',true from auth.users where lower(email)='elmi@elmi.com'
and not exists(select 1 from public.newsletter_articles where slug='wedding-family-faith-joy');

insert into public.newsletter_articles (author_id,title,slug,category,excerpt,content,cover_emoji,published)
select id,'Should Our Mosques Make More Room for Youth Voices?','mosques-youth-voices','Discussion',
'A lively community debate can be a chance to listen carefully, ask better questions and discover what younger members need.',
'Youth councils, open forums and intergenerational conversations can give more people a meaningful seat at the table while keeping respect at the center.',
'💬',true from auth.users where lower(email)='elmi@elmi.com'
and not exists(select 1 from public.newsletter_articles where slug='mosques-youth-voices');

insert into public.newsletter_articles (author_id,title,slug,category,excerpt,content,cover_emoji,published)
select id,'A New Mosque Begins With a Foundation of People','mosque-foundation-people','Community',
'Before the first wall rises, a mosque project begins with conversations about what the community needs.',
'Before the first wall rises, volunteers, planners, donors, architects and families imagine a place that can grow with the community.',
'🕌',true from auth.users where lower(email)='elmi@elmi.com'
and not exists(select 1 from public.newsletter_articles where slug='mosque-foundation-people');

insert into public.newsletter_articles (author_id,title,slug,category,excerpt,content,cover_emoji,published)
select id,'The Nikah Table: Small Details That Become Big Memories','nikah-table-small-details','Faith',
'From the seating plan to the meal, wedding days are full of small decisions that become big memories.',
'A simple program, clear communication and a little flexibility can turn a busy day into a gathering people remember with gratitude.',
'☾',true from auth.users where lower(email)='elmi@elmi.com'
and not exists(select 1 from public.newsletter_articles where slug='nikah-table-small-details');
