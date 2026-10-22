begin;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '' check (char_length(name) <= 100),
  email text not null,
  phone text check (phone is null or (char_length(phone) between 7 and 30 and phone ~ '^[+0-9() .-]+$')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (name, phone) on public.profiles to authenticated;

create policy "Users read their own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "Users update their own profile" on public.profiles
  for update to authenticated using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Profiles are created atomically with auth users, never by a browser insert.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, name, email, phone)
  values (
    new.id,
    left(trim(coalesce(new.raw_user_meta_data ->> 'name', '')), 100),
    coalesce(new.email, ''),
    case when trim(new.raw_user_meta_data ->> 'phone') ~ '^[+0-9() .-]{7,30}$'
      then trim(new.raw_user_meta_data ->> 'phone') else null end
  );
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Only Auth can change a profile's email; keep it synchronized if changed there.
create function public.sync_profile_email() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set email = coalesce(new.email, '') where id = new.id;
  return new;
end;
$$;
create trigger on_auth_email_updated after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function public.sync_profile_email();

create function public.touch_profile() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger on_profile_updated before update on public.profiles
  for each row execute function public.touch_profile();

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.sync_profile_email() from public, anon, authenticated;
revoke all on function public.touch_profile() from public, anon, authenticated;

-- Also support a project with pre-existing Auth users.
insert into public.profiles (id, name, email)
select id, left(trim(coalesce(raw_user_meta_data ->> 'name', '')), 100), coalesce(email, '')
from auth.users on conflict (id) do nothing;

commit;
