# ParkNest classroom demo

Next.js App Router, React, TypeScript, Tailwind/shadcn UI, and a **real Supabase backend**. Accounts, profiles, spaces, availability, and reservations persist in PostgreSQL; optional space photos persist in Supabase Storage. Refreshing or using another browser does not erase data. There is no localStorage database, seeded listing data, payment gateway, or card collection.

```text
frontend/                  Next.js app, server-side auth adapters, UI, tests
backend/supabase/migrations Database schema, RLS, triggers, Storage policies
backend/supabase/tests      SQL checks (fixtures roll back)
package.json               Root commands forwarding to frontend
```

## 1. Supabase dashboard settings

Use a Supabase project dedicated to the classroom demo.

1. **Authentication → Sign In / Providers**: allow new user signups; enable **Email** with email/password sign-in; turn **Confirm email OFF**. Set the minimum password length to **8**. Anonymous and phone sign-in are not needed. Leave CAPTCHA off for this demo; the app does not include a CAPTCHA widget.
2. **Authentication → URL Configuration**: set **Site URL** to `http://localhost:3000` (or your deployed HTTPS app origin). No email callback redirect allowlist is required for this password-only demo.
3. **Email Templates / SMTP**: no custom templates or SMTP setup is required. Existing template settings can remain; this demo does not use confirmation or reset emails. Old confirmation/reset routes return to login with an explanation.
4. Use **new demo emails after switching Confirm email off**. Previously unconfirmed users may still be unable to log in; use fresh demo accounts instead. Existing confirmed users and profile data remain valid.
5. **Database → Extensions**: the migration enables `btree_gist` automatically. Keep it enabled: the database uses it to reject overlapping reservations, even from concurrent requests or another browser.
6. **Storage**: migration 002 creates a **private** `listing-photos` bucket. Verify it allows JPEG/PNG/WebP with a **512 KB** limit and stays private. No manually public bucket is needed. RLS permits uploads under the uploader's user-ID folder and signed-in reads of photos attached to listings.
7. Keep **Row Level Security enabled** on `profiles`, `listings`, and `bookings`. Keep the Supabase Data API enabled with `public` exposed (the default). Do not add permissive policies or service-role credentials to the app.

With Confirm email disabled, Supabase returns a session from signup and the app signs in immediately. This is a demo setting, not email-ownership verification. [Supabase Auth configuration](https://supabase.com/docs/guides/auth/general-configuration).

## 2. SQL migrations (in order)

Run each file's entire contents in **Supabase → SQL Editor**:

1. [`202610220001_profiles.sql`](backend/supabase/migrations/202610220001_profiles.sql) — existing profile table, account-creation/email-sync triggers, and own-profile RLS. **Skip if already applied. This file is unchanged; do not drop or recreate existing profiles.**
2. [`202610220002_demo_parking.sql`](backend/supabase/migrations/202610220002_demo_parking.sql) — spaces with a fixed availability window, bookings, RLS, database booking validation and overlap protection, private photo bucket and Storage policies.

These are one-time migrations, not repeatable seed scripts. If a migration fails, its transaction rolls back; fix the reported issue before retrying. No demonstration accounts or listings are inserted by migrations.

Optional verification in a **development** project, after both migrations: run [`profiles.sql`](backend/supabase/tests/profiles.sql), then [`demo_parking.sql`](backend/supabase/tests/demo_parking.sql). Both roll back their fixtures. They check profile isolation, booking privacy, owner visibility, simulated totals, forbidden writes, self-booking rejection, availability bounds, overlapping bookings, and adjacent bookings.

## 3. Environment variables

Keep your existing `frontend/.env.local`. If starting fresh, copy `frontend/.env.example` to `frontend/.env.local` and fill in only:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
```

Find these in the project's **Connect** dialog / **Settings → API Keys**. A legacy `anon` key also works in the publishable-key variable. Never use a `service_role` or secret key. No database password, SMTP key, Razorpay key, or `NEXT_PUBLIC_SITE_URL` is needed. An existing `NEXT_PUBLIC_SITE_URL` value is harmless but unused. `.env.local` is ignored by Git; do not commit it.

## 4. Install and start

Node.js **22.16+** is required. From the repository root:

```sh
npm run setup
npm run dev
```

Open `http://localhost:3000`. On PowerShell with restricted scripts, use `npm.cmd` instead of `npm`. Restart the server after changing environment variables. There is no separate backend process; both browsers must use the same Supabase project. Deploy the app with **`frontend/` as the application root** and the two environment variables above.

Checks and production preview:

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run start
```

Stop the dev server before running the production preview on the same port.

## 5. Click-by-click classroom demo

Use a normal browser for the owner and an incognito window or second browser for the driver. Pick times **tomorrow**, not in the past. Form inputs use the device's local time zone; saved times are displayed explicitly in **IST**.

1. Click **Get started**. Enter a new demo email and an 8+ character password. Click **Create account**. You land on the dashboard immediately, without email.
2. Open **My profile**, add the owner's name/optional phone, and **Save changes**. Refresh to show persistence.
3. Click **Share a space**. Enter a title, address, description, and rate such as ₹50/hour. Set availability tomorrow from 09:00 to 18:00. Optionally choose a JPEG/PNG/WebP smaller than 512 KB. Click **Save space**.
4. In the second browser, create a different driver account. Click **Spaces**, open the saved space, and see the same availability/photo. No separate owner/driver account type is required.
5. Choose tomorrow from 10:00 to 11:00 inside the window. Click **Confirm booking · Simulated payment**. **My bookings** shows a confirmed reservation, ₹50, and **Simulated payment — no money charged**. No card or gateway screen appears.
6. Refresh **My bookings**; the reservation remains. Refresh the owner's **Dashboard**; it appears under **Incoming reservations**. Log in as the driver in another browser to show the same saved booking.
7. In the driver window, log out and create a third account. Open the same space and attempt 10:30–11:30. The app reports that the space is already booked. This rejection comes from PostgreSQL, not browser state. Try 11:00–12:00 instead; adjacent bookings are allowed.
8. Log out and visit `/bookings` or `/dashboard` directly. Login is required, and signing back in returns to the intended page.

## Security and demo limits

- Profiles remain private to their user. Listings/availability are visible to signed-in users. Bookings are visible only to the driver and listing owner. Every write verifies the signed-in user and is also restricted in PostgreSQL.
- Booking price and payment status are assigned by a database trigger. The database rejects self-bookings, past/invalid/out-of-window bookings, and stays longer than 30 days. A GiST exclusion constraint rejects overlapping `[start, end)` ranges for the same listing, including concurrent inserts. [PostgreSQL range constraints](https://www.postgresql.org/docs/current/rangetypes.html).
- Payments are **simulated only**. No Razorpay integration, real charge, card details, refund, or payout exists.
- The minimal demo supports creating spaces, one fixed availability window per space, browsing details/photos, making reservations, viewing personal bookings, and viewing incoming reservations. Editing/deleting spaces, recurring availability, cancellations, maps, advanced search, and realtime updates are **not implemented**. Refresh to see another user's changes. Existing reservations cannot be rewritten through the client.
- Password recovery/email confirmation are deferred. Remember demo passwords or create another demo account; there is no insecure password-reset bypass.
- Photos use private Storage and one-hour signed URLs; refresh if a URL expires. Upload and listing creation are separate service calls. Failed listing inserts attempt to remove unused uploads; an interrupted network can leave an orphan photo for later admin cleanup.
- `npm test` runs seven app tests plus the SQL migrations/assertions in a development-only, isolated PGlite PostgreSQL runtime. This tests RLS, Storage policies, and booking constraints with minimal Auth/Storage schema scaffolding; it does not test hosted Supabase services or concurrent network requests. Live cross-browser/Auth/Storage verification must be performed against your configured project. No remote settings or migrations are applied automatically by this repository.

The earlier dependency audit reported a development-only `braces` advisory through Next.js ESLint tooling. No forced incompatible downgrade was applied.

Verified for this revision: lint, typecheck, seven app tests, the isolated SQL security test suite, production build, and HTTP checks for the simplified signup form, hidden recovery link, Spaces navigation, and protected-page redirects. Hosted Supabase settings, migrations, and the cross-browser demo still need to be applied/checked in your project using the steps above.
