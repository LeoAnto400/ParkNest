import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";

test("migrations preserve history and enforce profile, listing, photo and booking security", async () => {
  // Isolated PostgreSQL test runtime only. The application always uses Supabase.
  // Minimal Supabase Auth/Storage scaffolding; not a replacement for service E2E.
  const db = new PGlite({ extensions: { btree_gist } });
  try {
    await db.exec(`
      create role anon;
      create role authenticated;
      create schema auth;
      create schema storage;
      create schema extensions;
      grant usage on schema public, auth, storage to anon, authenticated;
      create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
      $$;
      create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
      create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
      alter table storage.objects enable row level security;
      grant select, insert, delete on storage.objects to authenticated;
      grant select on storage.objects to anon;
      create function storage.foldername(name text) returns text[] language sql immutable as $$
        select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1)-1];
      $$;
    `);
    for (const file of [
      "../supabase/migrations/202610220001_profiles.sql",
      "../supabase/migrations/202610220002_demo_parking.sql",
      "../supabase/tests/profiles.sql",
      "../supabase/tests/demo_parking.sql",
    ]) await db.exec(await readFile(new URL(file, import.meta.url), "utf8"));
    // An existing demo listing/photo/booking must survive the upgrade.
    await db.exec(`
      insert into auth.users (id,email) values
        ('99111111-1111-4111-8111-111111111111','migration-owner@example.test'),
        ('99222222-2222-4222-8222-222222222222','migration-driver@example.test');
      insert into public.listings (id,owner_id,title,address,description,hourly_rate_paise,available_from,available_until,photo_path)
      values ('99333333-3333-4333-8333-333333333333','99111111-1111-4111-8111-111111111111','Existing listing','Existing address','Existing description',5050,now()+interval '1 day',now()+interval '2 days','99111111-1111-4111-8111-111111111111/original');
      select set_config('request.jwt.claim.sub','99222222-2222-4222-8222-222222222222',false);
      insert into public.bookings (listing_id,driver_id,starts_at,ends_at)
      values ('99333333-3333-4333-8333-333333333333',auth.uid(),now()+interval '25 hours',now()+interval '26 hours');
      select set_config('request.jwt.claim.sub','',false);
    `);
    await db.exec(await readFile(new URL("../supabase/migrations/202610230003_owner_listings.sql", import.meta.url), "utf8"));
    const { rows: [legacy] } = await db.query("select status,photo_paths,hourly_rate_paise from public.listings where id='99333333-3333-4333-8333-333333333333'");
    assert.equal(legacy.status, "draft");
    assert.equal(legacy.hourly_rate_paise, 5050);
    assert.deepEqual(legacy.photo_paths, ["99111111-1111-4111-8111-111111111111/original"]);
    assert.equal((await db.query("select count(*)::int as n from public.bookings")).rows[0].n, 1);
    await db.exec(await readFile(new URL("../supabase/tests/owner_listings.sql", import.meta.url), "utf8"));
    const seed = (await readFile(new URL("../supabase/seeds/optional_listings.sql", import.meta.url), "utf8")).replaceAll("REPLACE_WITH_YOUR_DEMO_EMAIL", "migration-owner@example.test");
    await db.exec(seed);
    await db.exec(seed);
    assert.equal((await db.query("select count(*)::int as n from public.listings where title like 'Demo:%' and status='draft'")).rows[0].n, 3);
  } finally { await db.close(); }
});
