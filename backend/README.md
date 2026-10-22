# ParkNest backend

Supabase provides the backend: Auth, PostgreSQL, and the database API. This folder owns the database schema, profile triggers, permissions, and Row Level Security policies.

```text
supabase/
  migrations/202610220001_profiles.sql
  tests/profiles.sql
```

Run the migration once in your Supabase project's SQL Editor, then run the test script in a development project. The test transaction rolls back its fixtures. Full Auth, email template, redirect URL, and environment setup is in the [root README](../README.md).

There is no separate Node server to start. Next.js's cookie/session adapters and Server Actions stay with the app in `frontend/`, where they run server-side. Database access is enforced here with RLS; no service-role key is used by the app.

Both contributors should add future schema changes as new migrations here. Use the existing `auth.users.id` / `profiles.id` UUID for ownership and future bookings.
