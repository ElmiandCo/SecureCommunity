create extension if not exists pg_cron;
create extension if not exists pg_net;
create extension if not exists supabase_vault;

alter table public.profiles
  add column if not exists is_ai boolean not null default false,
  add column if not exists ai_label text;

alter table public.post_reactions drop constraint if exists post_reactions_emoji_check;
alter table public.post_reactions add constraint post_reactions_emoji_check check (emoji = any (array['🔥','❤️','😂','🤨','😡']::text[]));
alter table public.comment_reactions drop constraint if exists comment_reactions_emoji_check;
alter table public.comment_reactions add constraint comment_reactions_emoji_check check (emoji = any (array['🔥','❤️','😂','🤨','😡']::text[]));

create table if not exists public.ai_agent_config (
  id text primary key default 'default',
  enabled boolean not null default true,
  interval_seconds integer not null default 300 check (interval_seconds in (300,3600,86400)),
  max_posts_per_day integer not null default 288 check (max_posts_per_day between 0 and 1000),
  max_comments_per_day integer not null default 288 check (max_comments_per_day between 0 and 1000),
  max_reactions_per_day integer not null default 288 check (max_reactions_per_day between 0 and 1000),
  include_images boolean not null default true,
  include_links boolean not null default true,
  agent_user_id uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.ai_agent_config (id) values ('default') on conflict (id) do nothing;

create table if not exists public.ai_agent_actions (
  id uuid primary key default gen_random_uuid(),
  agent_user_id uuid not null references public.profiles(id) on delete cascade,
  action_type text not null check (action_type in ('post','comment','reaction')),
  target_post_id uuid references public.posts(id) on delete cascade,
  target_comment_id uuid references public.comments(id) on delete cascade,
  emoji text,
  content text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint ai_agent_action_target_check check (
    (action_type='post' and target_post_id is null and target_comment_id is null)
    or (action_type='comment' and target_post_id is not null and target_comment_id is null)
    or (action_type='reaction' and target_post_id is not null and target_comment_id is null)
  )
);

create unique index if not exists ai_agent_one_action_per_post
  on public.ai_agent_actions (agent_user_id, action_type, target_post_id)
  where action_type in ('comment','reaction');
create index if not exists ai_agent_actions_created_at_idx on public.ai_agent_actions (created_at desc);

alter table public.ai_agent_config enable row level security;
alter table public.ai_agent_actions enable row level security;

drop policy if exists "Authenticated users can view AI agent config" on public.ai_agent_config;
create policy "Authenticated users can view AI agent config"
  on public.ai_agent_config for select to authenticated using (true);

drop policy if exists "Authenticated users can view AI agent activity" on public.ai_agent_actions;
create policy "Authenticated users can view AI agent activity"
  on public.ai_agent_actions for select to authenticated using (true);

revoke insert, update, delete on public.ai_agent_config from anon, authenticated;
revoke insert, update, delete on public.ai_agent_actions from anon, authenticated;

create or replace function public.verify_ai_agent_cron_secret(p_secret text)
returns boolean
language plpgsql
security definer
set search_path = public, vault
as $$
declare expected text;
begin
  select decrypted_secret into expected from vault.decrypted_secrets where name = 'ai_agent_cron_secret' limit 1;
  return expected is not null and p_secret is not null and expected = p_secret;
end;
$$;
revoke all on function public.verify_ai_agent_cron_secret(text) from public;
grant execute on function public.verify_ai_agent_cron_secret(text) to service_role;

create or replace function public.get_ai_agent_secret(p_name text)
returns text
language plpgsql
security definer
set search_path = public, vault
as $$
declare value text;
begin
  select decrypted_secret into value from vault.decrypted_secrets where name = p_name limit 1;
  return value;
end;
$$;
revoke all on function public.get_ai_agent_secret(text) from public;
grant execute on function public.get_ai_agent_secret(text) to service_role;

do $$
begin
  if not exists (select 1 from vault.secrets where name = 'ai_agent_cron_secret') then
    perform vault.create_secret(encode(gen_random_bytes(32),'base64'), 'ai_agent_cron_secret', 'Secret used only by the scheduled OneMuslim AI community agent');
  end if;
end $$;

do $$
begin
  perform cron.unschedule('onemuslim-ai-agent-every-5-min');
exception when others then
  null;
end $$;

select cron.schedule(
  'onemuslim-ai-agent-every-5-min',
  '*/5 * * * *',
  $job$
    select net.http_post(
      url := 'https://njilnqgdfrvpvgbkodwl.supabase.co/functions/v1/ai-community-agent',
      headers := jsonb_build_object(
        'Content-Type','application/json',
        'x-ai-cron-secret',(select decrypted_secret from vault.decrypted_secrets where name='ai_agent_cron_secret')
      ),
      body := jsonb_build_object('source','supabase-cron','time',now())
    );
  $job$
);
