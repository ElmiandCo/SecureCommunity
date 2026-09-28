-- OneMuslim AI: generate at most one community post every 2 days.
-- The daily cron may wake the function each day, but the agent interval guard
-- prevents a new post until 48 hours have elapsed since the previous post.

alter table public.ai_agent_config
  drop constraint if exists ai_agent_config_interval_seconds_check;

alter table public.ai_agent_config
  add constraint ai_agent_config_interval_seconds_check
  check (interval_seconds in (300,3600,86400,172800));

update public.ai_agent_config
set interval_seconds = 172800,
    max_posts_per_day = 1,
    updated_at = now()
where id = 'default';

do $$
begin
  perform cron.unschedule('onemuslim-ai-agent-every-5-min');
exception when others then
  null;
end $$;

do $$
begin
  perform cron.unschedule('onemuslim-ai-agent-daily');
exception when others then
  null;
end $$;

select cron.schedule(
  'onemuslim-ai-agent-daily',
  '0 0 * * *',
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
