# ParkNest frontend

The Next.js App Router app: email/password signup, private profiles, public published listings, owner drafts and editing, multiple photos/main-photo selection, and an owner dashboard. Existing demo booking history remains. Server Actions and route handlers execute on the Next.js server, not in the browser. All application data is saved in Supabase.

From this folder:

```sh
npm ci
```

Copy `.env.example` to `.env.local` here and configure Supabase using the [root setup guide](../README.md). Then run:

```sh
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
```

Use `frontend/` as the root directory when deploying the Next.js app. Database migrations and policies live in `../backend/supabase/`.

For the classroom demo, turn Supabase Confirm email off. Email recovery is deferred. Follow the root guide for all three migrations, Storage settings, and the listing verification steps. The root `npm test` command also runs isolated PostgreSQL security tests from `backend/`.
