# ParkNest

Authentication foundation for a two-person parking-space sharing app. Built with Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui components, Supabase Auth, and PostgreSQL. Includes signup, email confirmation, login/logout, password recovery, an editable profile, and a protected dashboard. One user can drive and host; there are no account roles. Listings, search, maps, bookings, and payments are intentionally future work.

## Project structure

```text
ParkNest/
  frontend/            # Next.js app, auth adapters, components, and app tests
    src/
    public/
    tests/
    .env.example
    package.json
  backend/             # Supabase backend schema, RLS, triggers, and SQL tests
    supabase/
      migrations/
      tests/
  package.json         # Convenience commands that run the frontend scripts
  README.md
```

Supabase is the backend service. Next.js Server Actions, route handlers, and cookie/session helpers remain inside `frontend/` because they run in the Next.js server runtime. See [frontend notes](frontend/README.md) and [backend notes](backend/README.md).

## Local setup

1. Install Node.js **22.16 or newer** and npm. From the repository root run `npm run setup` (equivalent to `npm --prefix frontend ci`) (PowerShell with restricted scripts: use `npm.cmd` instead of `npm`).
2. Create a Supabase project. In **SQL Editor**, execute the complete file `backend/supabase/migrations/202610220001_profiles.sql` once. It creates `profiles`, RLS policies, profile creation/email-sync triggers, and backfills existing Auth users. It does not require any application service-role key.
3. In **Authentication → Sign In / Providers → Email**, enable Email sign-in, allow new user signups, and enable **Confirm email**. Set minimum password length to **8**. Disable phone-only/anonymous signups for this email-based app.
4. In **Authentication → URL Configuration**, set **Site URL** to `http://localhost:3000`. Add this **Redirect URL**: `http://localhost:3000/auth/confirm**` (the wildcard includes the query string). Use `localhost` consistently, not `127.0.0.1`.
5. In **Authentication → Email Templates**, replace the action links with the following. These custom token-hash links are required; the default `ConfirmationURL` uses a different callback flow.

   **Confirm signup:**

   ```html
   <h2>Welcome to ParkNest</h2>
   <p>
     <a href="{{ .RedirectTo }}&amp;token_hash={{ .TokenHash }}&amp;type=email"
       >Confirm your email</a
     >
   </p>
   ```

   **Reset password:**

   ```html
   <h2>Reset your ParkNest password</h2>
   <p>
     <a
       href="{{ .RedirectTo }}&amp;token_hash={{ .TokenHash }}&amp;type=recovery"
       >Reset your password</a
     >
   </p>
   ```

   The app supplies `RedirectTo` with a `?next=...` query, so these links intentionally append `&amp;`. Users click **Continue** on the landing page to consume the token via POST, protecting against link-scanning bots. This flow supports opening the email on a different browser/device.

6. Configure **Authentication → Email / SMTP Settings** with your SMTP provider for sending to real users. Supabase's built-in test mail service restricts recipients and rate limits delivery; use an allowed team email when testing without custom SMTP. Keep SMTP credentials in Supabase, not this app.
7. Copy `frontend/.env.example` to `frontend/.env.local`:

   ```powershell
   Copy-Item frontend/.env.example frontend/.env.local
   ```

   Fill in:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

   Find the project URL and publishable key in the project's **Connect** dialog / **Settings → API Keys**. A legacy `anon` key can also be supplied in the publishable-key variable. **Never use `service_role` or a secret key.** The public key is safe to ship because PostgreSQL RLS and column grants enforce access. `.env.local` is ignored by Git.

8. Run `npm run dev`, open `http://localhost:3000`, and create an account. Restart after changing environment variables. Without configuration, public pages render a setup notice; authentication cannot connect.

For deployment, select `frontend/` as the application root directory and set the same three variables in your hosting environment, change `NEXT_PUBLIC_SITE_URL` and Supabase Site URL to your canonical HTTPS origin, and allow `https://YOUR_DOMAIN/auth/confirm**`. Keep localhost in the allowlist only if still developing against that project. Do not put authenticated responses behind a shared CDN cache. No database password or service-role key is needed by the app.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run start
```

`npm test` exercises redirect safety and input validation with Node's test runner. `npm run format` formats source files. After configuring Supabase, run `backend/supabase/tests/profiles.sql` in SQL Editor to verify own-profile reads/updates, cross-user isolation, and forbidden email/deletion changes; it rolls back all fixtures. Use a development Supabase project.

Manual integration checklist:

- Visit `/profile` while logged out; log in and verify you return to `/profile`. `/dashboard` must also redirect when logged out.
- Sign up, follow the email link, press Continue, and verify a matching profile row exists. Retry an expired/reused link and confirm the recovery page appears.
- Edit name and optional phone; reload and confirm persistence. Email is read-only.
- Request a password reset, follow the email link, set a new password, and log in with it. The old password should fail.
- Log out and attempt to revisit protected pages. Use two separate browser sessions to verify each user sees only their own data.
- Check forms at mobile widths, keyboard navigation, invalid input, incorrect password, and a disconnected network.

Live email delivery and database policies require your Supabase project and cannot be verified by the build alone. The initial dependency audit reports a development-only `braces` advisory through Next.js's ESLint tooling; npm's proposed fix downgrades Next.js tooling to v14, so no incompatible forced downgrade is applied.

Verified locally: lint, TypeScript, all 3 unit tests, production build, public-page HTTP responses, and Next.js redirect responses for signed-out protected pages. Production dependency audit reports zero vulnerabilities. A browser was unavailable in the implementation environment, so visual/browser integration checks remain on the checklist above.

## Shared foundation / ownership

- `frontend/src/lib/auth/user.ts`: server-only `getUser()` / `requireUser(next)` verify identity with Supabase; use `user.id` for future bookings and ownership. Never accept an owner/user ID from form input as authorization.
- `frontend/src/lib/supabase/server.ts` / `frontend/src/lib/supabase/client.ts`: typed cookie-based SSR/browser clients using only the publishable key. The browser helper is available for later interactive features; current mutations use Server Actions.
- `frontend/src/proxy.ts`: refreshes cookies and preserves the requested protected URL. Pages and mutations also independently verify users. RLS remains the database security boundary.
- `profiles.id = auth.users.id`; Auth owns email, the user edits only name/phone. Triggers create profiles atomically, sync email, and cascade deletion. Client inserts/deletes and changes to ID/email/timestamps are not granted.
- `frontend/src/app/auth/actions.ts`: validated account/profile mutations; `auth/confirm` and `auth/verify` handle email tokens. Local-only redirects prevent open redirects. Password-reset requests do not disclose whether an email exists.
- Person 1 can extend the owner dashboard/listings later. Person 2 should add booking tables referencing this same UUID and their own RLS policies. Do not add separate driver/owner accounts.

## File inventory

- Root: `package.json` (command wrappers), `.gitignore`, `README.md`.
- Frontend: `frontend/src/` (pages, auth, UI, and helpers), `frontend/tests/auth.test.mjs`, `frontend/public/`, and all Next.js, TypeScript, ESLint, shadcn/ui, npm, and environment configuration. The existing dependency lockfile is preserved in `frontend/package-lock.json`. Next.js guidance is in `frontend/AGENTS.md`.
- Backend: `backend/supabase/migrations/202610220001_profiles.sql`, `backend/supabase/tests/profiles.sql`, `backend/README.md`.

Implementation references: [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [password authentication](https://supabase.com/docs/guides/auth/passwords), [email templates](https://supabase.com/docs/guides/auth/auth-email-templates).
