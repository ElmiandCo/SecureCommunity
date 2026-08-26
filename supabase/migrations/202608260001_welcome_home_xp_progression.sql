create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, display_name, first_name, last_name, username, bio, location, website, avatar_url
  )
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'display_name',''), split_part(coalesce(new.email,''),'@',1), 'Member'),
    coalesce(new.raw_user_meta_data->>'first_name',''),
    coalesce(new.raw_user_meta_data->>'last_name',''),
    lower(coalesce(nullif(new.raw_user_meta_data->>'username',''), 'member_' || left(new.id::text,8))),
    coalesce(new.raw_user_meta_data->>'bio',''),
    coalesce(new.raw_user_meta_data->>'location',''),
    coalesce(new.raw_user_meta_data->>'website',''),
    coalesce(new.raw_user_meta_data->>'avatar_url','')
  )
  on conflict (id) do nothing;
  insert into public.xp_events(user_id,source_type,source_id,points,description)
  values(new.id,'welcome','signup',100,'Welcome to SecureCommunity')
  on conflict (user_id,source_type,source_id) do nothing;
  return new;
end;
$$;

create or replace function public.award_profile_field_xp()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare f text; old_value text; new_value text;
begin
  foreach f in array array['bio','city','state','country','gender','x_handle','tiktok_username','instagram_handle','avatar_url'] loop
    new_value := case f
      when 'bio' then new.bio when 'city' then new.city when 'state' then new.state when 'country' then new.country
      when 'gender' then new.gender when 'x_handle' then new.x_handle when 'tiktok_username' then new.tiktok_username
      when 'instagram_handle' then new.instagram_handle when 'avatar_url' then new.avatar_url end;
    if tg_op = 'INSERT' then old_value := null; else old_value := case f
      when 'bio' then old.bio when 'city' then old.city when 'state' then old.state when 'country' then old.country
      when 'gender' then old.gender when 'x_handle' then old.x_handle when 'tiktok_username' then old.tiktok_username
      when 'instagram_handle' then old.instagram_handle when 'avatar_url' then old.avatar_url end;
    end if;
    if coalesce(trim(new_value),'') <> '' and coalesce(trim(old_value),'') = '' then
      insert into public.xp_events(user_id,source_type,source_id,points,description)
      values(new.id,'profile_field',f,100,'Completed profile field: '||initcap(replace(f,'_',' ')))
      on conflict (user_id,source_type,source_id) do nothing;
    end if;
  end loop;
  return new;
end;
$$;

create or replace function public.claim_daily_home_xp()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare uid uuid := auth.uid(); sid text := to_char(current_date,'YYYY-MM-DD'); inserted_count integer;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  insert into public.xp_events(user_id,source_type,source_id,points,description)
  values(uid,'home_daily',sid,10,'Daily Welcome Home check-in')
  on conflict (user_id,source_type,source_id) do nothing;
  get diagnostics inserted_count = row_count;
  return jsonb_build_object('awarded',inserted_count=1,'points',case when inserted_count=1 then 10 else 0 end);
end;
$$;
revoke all on function public.claim_daily_home_xp() from public;
grant execute on function public.claim_daily_home_xp() to authenticated;

insert into public.xp_events(user_id,source_type,source_id,points,description)
select id,'welcome','signup',100,'Welcome to SecureCommunity'
from public.profiles
where coalesce(xp_total,0)=0
on conflict (user_id,source_type,source_id) do nothing;
