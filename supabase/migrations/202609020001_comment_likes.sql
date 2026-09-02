create table if not exists public.comment_likes (
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create index if not exists comment_likes_comment_id_idx on public.comment_likes(comment_id);
create index if not exists comment_likes_user_id_idx on public.comment_likes(user_id);

alter table public.comment_likes enable row level security;

drop policy if exists "comment likes are readable by authenticated users" on public.comment_likes;
create policy "comment likes are readable by authenticated users"
  on public.comment_likes for select
  to authenticated
  using (true);

drop policy if exists "users can like comments" on public.comment_likes;
create policy "users can like comments"
  on public.comment_likes for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "users can remove their comment likes" on public.comment_likes;
create policy "users can remove their comment likes"
  on public.comment_likes for delete
  to authenticated
  using (auth.uid() = user_id);
