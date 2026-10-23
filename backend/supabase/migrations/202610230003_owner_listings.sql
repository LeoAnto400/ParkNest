begin;

-- Preserve existing rows and historical bookings. Owners review old listings
-- before explicitly publishing them to anonymous visitors.
alter table public.listings
  alter column available_from drop not null,
  alter column available_until drop not null,
  add column city text not null default '',
  add column vehicle_types text[] not null default array['car']::text[],
  add column parking_type text not null default 'open',
  add column facilities text[] not null default '{}'::text[],
  add column status text not null default 'draft',
  add column photo_paths text[] not null default '{}'::text[],
  add column deleted_at timestamptz,
  add column revision integer not null default 1;

update public.listings set photo_paths = array[photo_path] where photo_path is not null;
alter table public.listings
  add constraint city_length check (char_length(city) <= 100),
  add constraint known_listing_status check (status in ('draft', 'published')),
  add constraint known_parking_type check (parking_type in ('covered', 'open')),
  add constraint known_vehicle_types check (cardinality(vehicle_types) between 1 and 3 and vehicle_types <@ array['car','motorcycle','bicycle']::text[] and array_position(vehicle_types, null) is null),
  add constraint known_facilities check (cardinality(facilities) <= 5 and facilities <@ array['ev_charging','cctv','security','lighting','accessible']::text[] and array_position(facilities, null) is null),
  add constraint published_details check (status <> 'published' or (char_length(trim(city)) >= 2 and char_length(trim(description)) >= 10 and deleted_at is null)),
  add constraint paired_legacy_availability check ((available_from is null) = (available_until is null));

-- Validates every photo path, including requests sent straight to the Data API.
create function public.validate_listing_changes() returns trigger
language plpgsql set search_path = '' as $$
declare path text;
begin
  if cardinality(new.photo_paths) > 6 or array_position(new.photo_paths, null) is not null then
    raise exception 'Choose at most six photos' using errcode = '23514';
  end if;
  if cardinality(new.photo_paths) <> (select count(distinct x) from unnest(new.photo_paths) x) then
    raise exception 'Duplicate photo paths' using errcode = '23514';
  end if;
  foreach path in array new.photo_paths loop
    if split_part(path, '/', 1) <> new.owner_id::text or char_length(path) > 250 then
      raise exception 'Photo belongs to another owner' using errcode = '23514';
    end if;
  end loop;
  if (cardinality(new.photo_paths) = 0 and new.photo_path is not null)
     or (cardinality(new.photo_paths) > 0 and (new.photo_path is null or not new.photo_path = any(new.photo_paths))) then
    raise exception 'Main photo must be one of the listing photos' using errcode = '23514';
  end if;
  if tg_op = 'UPDATE' then new.revision = old.revision + 1; end if;
  return new;
end;
$$;
create trigger validate_listing_changes before insert or update on public.listings
  for each row execute function public.validate_listing_changes();
revoke all on function public.validate_listing_changes() from public, anon, authenticated;

drop policy "Signed in users browse listings" on public.listings;
create policy "Public reads published listings" on public.listings
  for select to anon, authenticated using (status = 'published' and deleted_at is null);
create policy "Owners read their own listings" on public.listings
  for select to authenticated using (owner_id = (select auth.uid()));
create policy "Owners update their active listings" on public.listings
  for update to authenticated using (owner_id = (select auth.uid()) and deleted_at is null)
  with check (owner_id = (select auth.uid()));
grant select on public.listings to anon;
grant insert (city, vehicle_types, parking_type, facilities, status, photo_paths) on public.listings to authenticated;
grant update (title, description, address, city, hourly_rate_paise, vehicle_types, parking_type, facilities, status, photo_path, photo_paths, deleted_at) on public.listings to authenticated;
-- No grants to alter owner/id, scheduling, creation time or revision. Soft
-- deletion preserves booking FKs and cannot be undone via the authenticated API.

drop policy "Read listed demo photos or own uploads" on storage.objects;
drop policy "Remove own unlisted demo uploads" on storage.objects;
create policy "Read published photos or own uploads" on storage.objects
  for select to anon, authenticated using (
    bucket_id = 'listing-photos' and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or exists (select 1 from public.listings l where l.status = 'published' and l.deleted_at is null and name = any(l.photo_paths))
    )
  );
create policy "Remove own unattached photos" on storage.objects
  for delete to authenticated using (
    bucket_id = 'listing-photos' and (storage.foldername(name))[1] = (select auth.uid())::text
    and not exists (select 1 from public.listings l where l.deleted_at is null and name = any(l.photo_paths))
  );
update storage.buckets set public = false, file_size_limit = 524288,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'] where id = 'listing-photos';

-- Compatibility safeguard only: new listings do not have a schedule. Preserve
-- the existing booking validator and overlap constraint from migration 002.
create function public.guard_legacy_booking_listing() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.listings where id = new.listing_id
    and status = 'published' and deleted_at is null
    and available_from is not null and available_until is not null
    for share;
  if not found then raise exception 'This listing is not available for reservations' using errcode = '23514'; end if;
  return new;
end;
$$;
create trigger guard_legacy_booking_listing before insert on public.bookings
  for each row execute function public.guard_legacy_booking_listing();
revoke all on function public.guard_legacy_booking_listing() from public, anon, authenticated;

commit;
