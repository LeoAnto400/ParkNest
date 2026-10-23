# ParkNest backend

Supabase provides the real backend: Auth, PostgreSQL, Storage, and the database API. This folder owns the schema, triggers, permissions, and Row Level Security policies.

```text
supabase/
  migrations/202610220001_profiles.sql
  migrations/202610220002_demo_parking.sql
  migrations/202610230003_owner_listings.sql
  tests/profiles.sql
  tests/demo_parking.sql
  tests/owner_listings.sql
  seeds/optional_listings.sql
```

Run each unapplied migration once in the order above. Do not drop existing profiles or listings. After 003, run `profiles.sql` and `owner_listings.sql` for verification; `demo_parking.sql` tests the old 002 baseline and is executed before 003 by the automated harness. Exact Storage settings, migration steps, and examples are in the [root README](../README.md).

There is no separate Node server to start. Next.js's cookie/session adapters and Server Actions stay with the app in `frontend/`, where they run server-side. Database access is enforced here with RLS; no service-role key is used by the app.

Migration 003 extends the earlier demo: drafts/published listings, metadata, multiple photos/main photo, owner update privileges, public published-only reads, and soft deletion. Old records become private drafts. New listings require no availability window. Earlier booking constraints/history are preserved, with a guard against booking unpublished, deleted, or unscheduled listings. Private photos stay in `listing-photos`; read policies now allow published photos for visitors and draft photos only for the owner.

Both contributors should add future schema changes as new migrations here. Listings and bookings use the existing `auth.users.id` / `profiles.id` UUID. No localStorage or hardcoded demo records are used.

Run `npm ci` then `npm test` in this folder (or `npm run setup` then `npm test` at the repository root) to execute the migrations and SQL assertions in an isolated PGlite PostgreSQL runtime. This development-only test harness supplies minimal Auth/Storage schema scaffolding; it does not replace Supabase in the app or test hosted Auth/email/Storage services. It does not connect to your project.
