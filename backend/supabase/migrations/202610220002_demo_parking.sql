begin;

create extension if not exists btree_gist with schema extensions;
set local search_path = public, extensions;

-- A demo listing has one fixed availability window. It is stored in PostgreSQL.
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  title text not null check (char_length(trim(title)) between 3 and 100),
  address text not null check (char_length(trim(address)) between 5 and 250),
  description text not null default '' check (char_length(description) <= 1000),
  hourly_rate_paise integer not null check (hourly_rate_paise between 100 and 1000000),
  available_from timestamptz not null,
  available_until timestamptz not null,
  photo_path text,
  created_at timestamptz not null default now(),
  constraint valid_availability check (isfinite(available_from) and isfinite(available_until) and available_until > available_from),
  constraint own_photo_path check (photo_path is null or split_part(photo_path, '/', 1) = owner_id::text)
);
create index listings_owner_idx on public.listings(owner_id);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id),
  driver_id uuid not null references auth.users(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  total_paise bigint not null,
  payment_status text not null default 'simulated' check (payment_status = 'simulated'),
  created_at timestamptz not null default now(),
  constraint valid_booking_period check (isfinite(starts_at) and isfinite(ends_at) and ends_at > starts_at and ends_at <= starts_at + interval '30 days'),
  constraint positive_total check (total_paise > 0),
  -- Half-open intervals allow one booking to start when the previous one ends.
  -- PostgreSQL checks every row, even rows hidden by RLS, and concurrent inserts.
  constraint bookings_no_overlap exclude using gist
    (listing_id with =, tstzrange(starts_at, ends_at, '[)') with &&)
);
create index bookings_driver_idx on public.bookings(driver_id);

alter table public.listings enable row level security;
alter table public.bookings enable row level security;
revoke all on public.listings, public.bookings from anon, authenticated;
grant select on public.listings, public.bookings to authenticated;
grant insert (owner_id, title, address, description, hourly_rate_paise, available_from, available_until, photo_path) on public.listings to authenticated;
grant insert (listing_id, driver_id, starts_at, ends_at) on public.bookings to authenticated;

create policy "Signed in users browse listings" on public.listings
  for select to authenticated using (true);
create policy "Owners create their own listings" on public.listings
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "Drivers and owners read their bookings" on public.bookings
  for select to authenticated using (
    driver_id = (select auth.uid()) or exists (
      select 1 from public.listings l where l.id = listing_id and l.owner_id = (select auth.uid())
    )
  );
create policy "Drivers create their own bookings" on public.bookings
  for insert to authenticated with check (driver_id = (select auth.uid()));

-- A direct Data API call receives the same checks as the UI. Price/payment are
-- assigned here, never trusted from form input. No update/delete grants: demo
-- availability and confirmed reservations cannot be silently rewritten.
create function public.validate_demo_booking() returns trigger
language plpgsql security definer set search_path = '' as $$
declare space public.listings%rowtype;
begin
  if auth.uid() is null or new.driver_id <> auth.uid() then
    raise exception 'Sign in as the booking driver' using errcode = '42501';
  end if;
  select * into space from public.listings where id = new.listing_id;
  if not found then raise exception 'Space not found' using errcode = '23503'; end if;
  if space.owner_id = new.driver_id then
    raise exception 'You cannot book your own space' using errcode = '23514';
  end if;
  if not isfinite(new.starts_at) or not isfinite(new.ends_at)
     or new.starts_at < statement_timestamp() or new.ends_at <= new.starts_at
     or new.ends_at > new.starts_at + interval '30 days'
     or new.starts_at < space.available_from or new.ends_at > space.available_until then
    raise exception 'Choose a future time within the availability window (maximum 30 days)' using errcode = '23514';
  end if;
  new.total_paise = ceil(extract(epoch from (new.ends_at - new.starts_at)) / 3600 * space.hourly_rate_paise)::bigint;
  new.payment_status = 'simulated';
  return new;
end;
$$;
create trigger validate_booking before insert on public.bookings
  for each row execute function public.validate_demo_booking();
revoke all on function public.validate_demo_booking() from public, anon, authenticated;

-- Private photos: authenticated readers use short-lived signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-photos', 'listing-photos', false, 524288, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
create policy "Upload own demo photos" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'listing-photos' and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "Read listed demo photos or own uploads" on storage.objects
  for select to authenticated using (
    bucket_id = 'listing-photos' and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or exists (select 1 from public.listings where photo_path = name)
    )
  );
create policy "Remove own unlisted demo uploads" on storage.objects
  for delete to authenticated using (
    bucket_id = 'listing-photos' and (storage.foldername(name))[1] = (select auth.uid())::text
    and not exists (select 1 from public.listings where photo_path = name)
  );

commit;
