import test from "node:test";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";

test("profile and demo migrations enforce SQL security and booking constraints", async () => {
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
  } finally { await db.close(); }
});
