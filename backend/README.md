# ParkNest backend

Supabase provides the real backend: Auth, PostgreSQL, Storage, and the database API. This folder owns the schema, triggers, permissions, and Row Level Security policies.

```text
supabase/
  migrations/202610220001_profiles.sql
  migrations/202610220002_demo_parking.sql
  tests/profiles.sql
  tests/demo_parking.sql
```

Run the migrations once in the order above in Supabase SQL Editor. Skip the first if it is already applied; do not drop existing profiles. Then run both test scripts in a development project. Their transactions roll back fixtures. Exact classroom settings and the click-by-click demo are in the [root README](../README.md). Email confirmation is OFF; SMTP and email templates are unnecessary.

There is no separate Node server to start. Next.js's cookie/session adapters and Server Actions stay with the app in `frontend/`, where they run server-side. Database access is enforced here with RLS; no service-role key is used by the app.

The second migration stores one fixed availability window per listing, enforces ownership via RLS, and prevents overlapping bookings with a GiST exclusion constraint. A database trigger validates dates, rejects self-bookings, calculates the total, and forces simulated payment. Client updates/deletes are not granted. Private listing photos are stored in `listing-photos` with upload/read policies.

Both contributors should add future schema changes as new migrations here. Listings and bookings use the existing `auth.users.id` / `profiles.id` UUID. No localStorage or hardcoded demo records are used.

Run `npm ci` then `npm test` in this folder (or `npm run setup` then `npm test` at the repository root) to execute the migrations and SQL assertions in an isolated PGlite PostgreSQL runtime. This development-only test harness supplies minimal Auth/Storage schema scaffolding; it does not replace Supabase in the app or test hosted Auth/email/Storage services. It does not connect to your project.
