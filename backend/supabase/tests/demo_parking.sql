-- Run after both migrations in a development project. No fixture data persists.
begin;
insert into auth.users (id, email) values
 ('aa111111-1111-4111-8111-111111111111', 'demo-owner@example.test'),
 ('bb222222-2222-4222-8222-222222222222', 'demo-driver-a@example.test'),
 ('cc333333-3333-4333-8333-333333333333', 'demo-driver-b@example.test');
insert into public.listings (id, owner_id, title, address, hourly_rate_paise, available_from, available_until)
values ('dd444444-4444-4444-8444-444444444444', 'aa111111-1111-4111-8111-111111111111', 'Test space', 'Test campus address', 5000, now() + interval '1 day', now() + interval '2 days');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'bb222222-2222-4222-8222-222222222222', true);
insert into storage.objects (bucket_id, name) values ('listing-photos', 'bb222222-2222-4222-8222-222222222222/test-photo');
do $$
begin
  begin
    insert into storage.objects (bucket_id, name) values ('listing-photos', 'aa111111-1111-4111-8111-111111111111/forged-photo');
    raise exception 'Upload to another user folder accepted';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.listings (owner_id, title, address, hourly_rate_paise, available_from, available_until)
    values ('aa111111-1111-4111-8111-111111111111', 'Forged owner space', 'Test address', 5000, now() + interval '1 day', now() + interval '2 days');
    raise exception 'Listing ownership forgery accepted';
  exception when insufficient_privilege then null; end;
end $$;
insert into public.bookings (listing_id, driver_id, starts_at, ends_at)
values ('dd444444-4444-4444-8444-444444444444', auth.uid(), now() + interval '25 hours', now() + interval '26 hours');
do $$
begin
  if not exists (select 1 from public.bookings where driver_id = auth.uid() and total_paise = 5000 and payment_status = 'simulated') then
    raise exception 'Database price/payment assignment failed';
  end if;
  begin
    insert into public.bookings (listing_id, driver_id, starts_at, ends_at, payment_status)
    values ('dd444444-4444-4444-8444-444444444444', auth.uid(), now() + interval '27 hours', now() + interval '28 hours', 'paid');
    raise exception 'Client forged payment status';
  exception when insufficient_privilege then null; end;
  begin
    update public.listings set available_until = now() where id = 'dd444444-4444-4444-8444-444444444444';
    raise exception 'Client rewrote availability';
  exception when insufficient_privilege then null; end;
end $$;

select set_config('request.jwt.claim.sub', 'cc333333-3333-4333-8333-333333333333', true);
do $$
begin
  if exists (select 1 from storage.objects where name = 'bb222222-2222-4222-8222-222222222222/test-photo') then
    raise exception 'Unlisted private photo leaked';
  end if;
  if exists (select 1 from public.bookings where listing_id = 'dd444444-4444-4444-8444-444444444444') then
    raise exception 'Another driver can read private bookings';
  end if;
  begin
    insert into public.bookings (listing_id, driver_id, starts_at, ends_at)
    values ('dd444444-4444-4444-8444-444444444444', auth.uid(), now() + interval '25 hours 30 minutes', now() + interval '26 hours 30 minutes');
    raise exception 'Overlapping booking accepted';
  exception when exclusion_violation then null; end;
  begin
    insert into public.bookings (listing_id, driver_id, starts_at, ends_at)
    values ('dd444444-4444-4444-8444-444444444444', auth.uid(), now() + interval '49 hours', now() + interval '50 hours');
    raise exception 'Booking outside availability accepted';
  exception when check_violation then null; end;
  begin
    insert into public.bookings (listing_id, driver_id, starts_at, ends_at)
    values ('dd444444-4444-4444-8444-444444444444', auth.uid(), now() - interval '2 hours', now() - interval '1 hour');
    raise exception 'Past booking accepted';
  exception when check_violation then null; end;
  begin
    insert into public.bookings (listing_id, driver_id, starts_at, ends_at)
    values ('dd444444-4444-4444-8444-444444444444', 'bb222222-2222-4222-8222-222222222222', now() + interval '28 hours', now() + interval '29 hours');
    raise exception 'Booking another driver identity accepted';
  exception when insufficient_privilege then null; end;
end $$;
-- Adjacent windows are allowed.
insert into public.bookings (listing_id, driver_id, starts_at, ends_at)
values ('dd444444-4444-4444-8444-444444444444', auth.uid(), now() + interval '26 hours', now() + interval '27 hours');

select set_config('request.jwt.claim.sub', 'aa111111-1111-4111-8111-111111111111', true);
do $$
begin
  if (select count(*) from public.bookings where listing_id = 'dd444444-4444-4444-8444-444444444444') <> 2 then
    raise exception 'Owner cannot read incoming reservations';
  end if;
  begin
    insert into public.bookings (listing_id, driver_id, starts_at, ends_at)
    values ('dd444444-4444-4444-8444-444444444444', auth.uid(), now() + interval '28 hours', now() + interval '29 hours');
    raise exception 'Owner booked own space';
  exception when check_violation then null; end;
end $$;
set local role anon;
do $$
begin
  begin
    perform * from public.listings;
    raise exception 'Anonymous reads allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
