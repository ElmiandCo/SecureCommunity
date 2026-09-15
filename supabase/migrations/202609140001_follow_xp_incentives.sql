-- Follow XP incentives
-- 500 XP for the person who follows; 1,000 XP for the person who gains a follower.
-- Each follower/following pair can earn each award only once, even after unfollow/refollow.

create or replace function public.award_follow_xp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.award_social_xp(
    new.follower_id,
    'follow_given:' || new.following_id::text,
    500
  );

  perform public.award_social_xp(
    new.following_id,
    'follow_received:' || new.follower_id::text,
    1000
  );

  return new;
end;
$$;

revoke all on function public.award_follow_xp() from public;

drop trigger if exists profile_follow_xp on public.profile_follows;
create trigger profile_follow_xp
after insert on public.profile_follows
for each row
execute function public.award_follow_xp();
