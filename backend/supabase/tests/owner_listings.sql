-- Run after migration 003; tests roll back all fixtures.
begin;
insert into auth.users (id, email) values
 ('a1111111-1111-4111-8111-111111111111', 'listing-owner@example.test'),
 ('b2222222-2222-4222-8222-222222222222', 'listing-other@example.test');
insert into public.listings (id, owner_id, title, address, description, city, hourly_rate_paise, photo_paths, photo_path)
values ('d4444444-4444-4444-8444-444444444444', 'a1111111-1111-4111-8111-111111111111', 'Private draft', '12 Campus Road', 'Covered parking near the gate.', 'Pune', 12345,
 array['a1111111-1111-4111-8111-111111111111/photo-a', 'a1111111-1111-4111-8111-111111111111/photo-b'], 'a1111111-1111-4111-8111-111111111111/photo-b');
insert into storage.objects (bucket_id, name) values
 ('listing-photos', 'a1111111-1111-4111-8111-111111111111/photo-a'),
 ('listing-photos', 'a1111111-1111-4111-8111-111111111111/photo-b');

set local role anon;
do $$ begin
  if exists (select 1 from public.listings where id = 'd4444444-4444-4444-8444-444444444444') then raise exception 'Anonymous read draft'; end if;
  if exists (select 1 from storage.objects where name like 'a1111111-1111-4111-8111-111111111111/%') then raise exception 'Anonymous read draft photos'; end if;
end $$;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b2222222-2222-4222-8222-222222222222', true);
do $$ declare n integer; begin
  if exists (select 1 from public.listings where id = 'd4444444-4444-4444-8444-444444444444') then raise exception 'Other user read draft'; end if;
  update public.listings set title = 'Hacked title' where id = 'd4444444-4444-4444-8444-444444444444';
  get diagnostics n = row_count; if n <> 0 then raise exception 'Other user edited draft'; end if;
  update public.listings set deleted_at = now() where id = 'd4444444-4444-4444-8444-444444444444';
  get diagnostics n = row_count; if n <> 0 then raise exception 'Other user deleted draft'; end if;
  delete from storage.objects where name = 'a1111111-1111-4111-8111-111111111111/photo-a';
  get diagnostics n = row_count; if n <> 0 then raise exception 'Other user deleted photo'; end if;
end $$;

select set_config('request.jwt.claim.sub', 'a1111111-1111-4111-8111-111111111111', true);
do $$ declare n integer; begin
  if not exists (select 1 from public.listings where id = 'd4444444-4444-4444-8444-444444444444' and available_from is null) then raise exception 'Owner cannot view unscheduled draft'; end if;
  update public.listings set status = 'published', hourly_rate_paise = 1001 where id = 'd4444444-4444-4444-8444-444444444444' and revision = 1;
  get diagnostics n = row_count; if n <> 1 then raise exception 'Owner could not publish'; end if;
  update public.listings set title = 'Stale change' where id = 'd4444444-4444-4444-8444-444444444444' and revision = 1;
  get diagnostics n = row_count; if n <> 0 then raise exception 'Stale revision overwrote listing'; end if;
  begin
    update public.listings set owner_id = 'b2222222-2222-4222-8222-222222222222' where id = 'd4444444-4444-4444-8444-444444444444';
    raise exception 'Owner identity mutable';
  exception when insufficient_privilege then null; end;
  begin
    update public.listings set photo_paths = array['b2222222-2222-4222-8222-222222222222/private'], photo_path = 'b2222222-2222-4222-8222-222222222222/private' where id = 'd4444444-4444-4444-8444-444444444444';
    raise exception 'Foreign photo attached';
  exception when check_violation then null; end;
  begin
    update public.listings set photo_path = null where id = 'd4444444-4444-4444-8444-444444444444';
    raise exception 'Main photo missing from nonempty gallery';
  exception when check_violation then null; end;
  begin
    update public.listings set vehicle_types = array['airplane'] where id = 'd4444444-4444-4444-8444-444444444444';
    raise exception 'Invalid vehicle type';
  exception when check_violation then null; end;
end $$;

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
do $$ begin
  if not exists (select 1 from public.listings where id = 'd4444444-4444-4444-8444-444444444444' and hourly_rate_paise = 1001) then raise exception 'Published listing not public or price changed'; end if;
  if (select count(*) from storage.objects where name like 'a1111111-1111-4111-8111-111111111111/%') <> 2 then raise exception 'Published gallery not readable'; end if;
end $$;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b2222222-2222-4222-8222-222222222222', true);
do $$ declare n integer; begin
  update public.listings set title = 'Hacked published' where id = 'd4444444-4444-4444-8444-444444444444';
  get diagnostics n = row_count; if n <> 0 then raise exception 'Other user edited public listing'; end if;
  begin
    insert into public.bookings (listing_id, driver_id, starts_at, ends_at)
    values ('d4444444-4444-4444-8444-444444444444', auth.uid(), now() + interval '1 day', now() + interval '25 hours');
    raise exception 'Unscheduled new listing accepted a booking';
  exception when check_violation then null; end;
end $$;

select set_config('request.jwt.claim.sub', 'a1111111-1111-4111-8111-111111111111', true);
update public.listings set status = 'draft' where id = 'd4444444-4444-4444-8444-444444444444';
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
do $$ begin
  if exists (select 1 from public.listings where id = 'd4444444-4444-4444-8444-444444444444') then raise exception 'Unpublished listing still visible'; end if;
  if exists (select 1 from storage.objects where name like 'a1111111-1111-4111-8111-111111111111/%') then raise exception 'Unpublished photos still readable'; end if;
end $$;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1111111-1111-4111-8111-111111111111', true);
do $$ declare n integer; begin
  delete from storage.objects where name = 'a1111111-1111-4111-8111-111111111111/photo-a';
  get diagnostics n = row_count; if n <> 0 then raise exception 'Attached draft photo deleted'; end if;
  update public.listings set deleted_at = now(), status = 'draft' where id = 'd4444444-4444-4444-8444-444444444444';
  update public.listings set deleted_at = null where id = 'd4444444-4444-4444-8444-444444444444';
  get diagnostics n = row_count; if n <> 0 then raise exception 'Deleted listing restored through API'; end if;
  delete from storage.objects where name like 'a1111111-1111-4111-8111-111111111111/%';
  get diagnostics n = row_count; if n <> 2 then raise exception 'Deleted listing photos not cleanable'; end if;
end $$;
reset role;
rollback;
