-- OPTIONAL: run after migration 003. Replace the email below with an existing
-- classroom account you own. This does not create Auth users or touch profiles.
-- Fictional examples are saved as drafts; review them before publishing.
begin;
do $$
declare demo_owner uuid;
begin
  select id into demo_owner from auth.users where email = 'REPLACE_WITH_YOUR_DEMO_EMAIL';
  if demo_owner is null then raise exception 'Replace REPLACE_WITH_YOUR_DEMO_EMAIL with an existing demo account email'; end if;
  insert into public.listings (owner_id, title, description, address, city, hourly_rate_paise, vehicle_types, parking_type, facilities, status)
  select demo_owner, s.title, s.description, s.address, s.city, s.price, s.vehicles, s.parking, s.facilities, 'draft'
  from (values
    ('Demo: Covered campus space', 'Fictional classroom example: covered parking with lighting near the campus entrance.', 'Demo Plot A, Campus Lane', 'Pune', 5000, array['car','motorcycle']::text[], 'covered', array['lighting','cctv']::text[]),
    ('Demo: EV-friendly parking', 'Fictional classroom example: open parking with an EV charging facility.', 'Demo Plot B, Learning Road', 'Bengaluru', 12550, array['car']::text[], 'open', array['ev_charging','lighting']::text[]),
    ('Demo: Two-wheeler space', 'Fictional classroom example: a compact covered space for motorcycles and bicycles.', 'Demo Plot C, College Street', 'Chennai', 2000, array['motorcycle','bicycle']::text[], 'covered', array['security']::text[])
  ) as s(title, description, address, city, price, vehicles, parking, facilities)
  where not exists (select 1 from public.listings l where l.owner_id = demo_owner and l.title = s.title);
end $$;
commit;
