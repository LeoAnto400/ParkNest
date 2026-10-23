# ParkNest — accounts and owner listings

Next.js App Router, React, TypeScript, Tailwind/shadcn UI, and Supabase Auth, PostgreSQL, and Storage. One account can own listings and act as a driver. All records and uploaded photos persist in Supabase.

Person 1's listing feature includes title, description, address and city, exact INR hourly pricing, supported vehicles, open/covered parking, facilities, up to six photos with a main photo, drafts, publishing/unpublishing, editing, and deletion. Visitors can browse published listings without logging in. Drafts are private to their owner.

```text
frontend/                    Next.js app, SSR auth, forms, pages, app tests
backend/supabase/migrations   PostgreSQL schema, RLS, triggers, Storage policies
backend/supabase/tests        SQL security tests
backend/supabase/seeds        Optional classroom examples
```

## Supabase setup and migrations

Keep your existing project and data. Run each **new** file in **Supabase Dashboard → SQL Editor**, in this order. Skip migrations already applied; do not rerun them or drop existing tables.

1. [`202610220001_profiles.sql`](backend/supabase/migrations/202610220001_profiles.sql): existing user profiles and private profile RLS. Unchanged.
2. [`202610220002_demo_parking.sql`](backend/supabase/migrations/202610220002_demo_parking.sql): existing listing/booking baseline and private photo bucket. Unchanged; required by migration 003 even when only demonstrating listings.
3. **[`202610230003_owner_listings.sql`](backend/supabase/migrations/202610230003_owner_listings.sql)**: owner listing fields, draft/published status, multiple photos, main-photo validation, owner update policies, public published reads, soft deletion, and revised Storage policies.

Migration 003 preserves existing listing rows, prices, photos, profiles, and booking history. **Existing listings become drafts** so their addresses/photos are not automatically made public. Open each old listing from the dashboard, enter its city and a useful description, then publish it. New listings do not require or create an availability schedule.

Leave RLS enabled on `profiles`, `listings`, and `bookings`. Keep the Data API enabled with the `public` schema exposed. Migration 003 permits anonymous reads only for published, undeleted listings. Owners may read their own drafts and update their own active listings. Owner IDs, revision numbers, scheduling fields, and creation timestamps cannot be changed by the client. Mutations derive ownership from the verified session; revision checks detect stale editor tabs.

### Storage: exact settings

After the migrations, open **Storage → listing-photos** and verify:

- Bucket ID/name: **`listing-photos`**.
- **Public bucket: OFF**. Do not create a second bucket or change this one to public.
- File size limit: **524288 bytes (512 KB)** per image.
- Allowed MIME types: **`image/jpeg`, `image/png`, `image/webp`**.
- The migration installs these policies on `storage.objects`: `Upload own demo photos` (existing owner-ID folder insert policy), `Read published photos or own uploads`, and `Remove own unattached photos`. The old demo read/delete policies are removed. Do not add a blanket read/write policy.

Uploads use `<authenticated-user-id>/<random-id>` paths. The form and server check size/type, and the server verifies JPEG/PNG/WebP content signatures. SVG and mismatched MIME/content are rejected. A listing holds at most six distinct photos; its main photo must belong to that gallery. Database checks reject another owner's photo paths.

The app issues **60-second signed URLs** for private bucket images using the viewer's normal Supabase client. Anonymous visitors can obtain URLs only for published photos; owners can preview their drafts. Unpublishing prevents new public reads immediately, but previously issued URLs remain usable until expiry, and already downloaded images cannot be recalled. Refresh an old page if a photo URL expires. [Supabase private buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals).

### Authentication settings for the classroom

In **Authentication → Sign In / Providers**, enable Email/password sign-in and new signups, set minimum password length to **8**, and turn **Confirm email OFF**. Signup signs users in immediately. Use fresh demo accounts if old accounts remain unconfirmed. No separate host accounts are created.

Set **Authentication → URL Configuration → Site URL** to `http://localhost:3000` (your HTTPS origin when deployed). Email templates, SMTP, phone/anonymous sign-in, and email callback redirects are not needed for this password-only demo. Password recovery is deferred. No CAPTCHA widget is implemented.

## Environment and commands

Keep your existing `frontend/.env.local`. If starting fresh, copy `frontend/.env.example` to `frontend/.env.local` and set:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
```

Get these from Supabase's **Connect** dialog / **Settings → API Keys**. The legacy `anon` key also works in the publishable-key variable. Never use a service-role/secret key. No Google Maps, payment, SMTP, or database-password variable is needed. `NEXT_PUBLIC_SITE_URL`, if left over from an older setup, is unused. Do not commit `.env.local`.

With Node.js **22.16+**, run from the repository root:

```sh
npm run setup
npm run dev
```

Open `http://localhost:3000`. Use `npm.cmd` on PowerShell if script execution is restricted. Restart after changing environment variables. For deployment, select `frontend/` as the application root and set the same two environment variables. Supabase runs the backend; there is no separate application backend process.

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run start
```

Stop the dev server before starting production on the same port. `npm test` runs frontend validation tests and isolated PostgreSQL migration/RLS/Storage-policy tests using development-only PGlite. It never connects to or alters your Supabase project. The harness tests the old demo at migration 002, then applies 003 and tests the listing feature. To verify on a development Supabase project after 003, run `backend/supabase/tests/profiles.sql` and `backend/supabase/tests/owner_listings.sql`; both roll back their fixtures. `demo_parking.sql` is a regression script for the **002 baseline**, not a post-003 setup step.

## Optional classroom listings

After creating a demo account, open [`optional_listings.sql`](backend/supabase/seeds/optional_listings.sql). Replace `REPLACE_WITH_YOUR_DEMO_EMAIL` with that existing account's email, then run the script in SQL Editor. It adds three fictional **drafts** with different cities, prices, vehicle types, and facilities; it does not create users, upload photos, or auto-publish. Re-running skips examples with the same owner/title. Add your own photos and publish from the dashboard. These examples are database rows, not hardcoded app data.

## Pages and actions to try

1. `/signup`: create an account with email/password; optionally add your name in `/profile`.
2. `/listings/new`: enter a title, description, usable address and city, price such as **123.45**, supported vehicles, parking type, and facilities. Select two small photos, choose the second as main, then **Save as draft**.
3. `/dashboard`: see the draft and its price **₹123.45**. Open its details and **Edit**; change fields, remove a photo or add another, change the main photo, and save.
4. Copy the draft's `/listings/<id>` URL into a logged-out/incognito browser. It should show not found. Sign in as a different user: the draft and its edit page should remain inaccessible.
5. In the owner dashboard, click **Publish**. Open `/listings` in incognito: see the published listing, main photo, details, vehicles, and facilities. Another account can view it but cannot edit/delete it, even with a copied edit URL.
6. Click **Unpublish** as the owner. Refresh the visitor's details URL and listing index: the listing disappears. The owner can still edit the draft.
7. Click **Delete**, then **Confirm delete**. The listing disappears from the dashboard and public pages. Refresh to confirm persistence. Historical booking references remain intact.
8. Try an oversized photo, a renamed SVG, a price with three decimals, no vehicle type, or publishing without a useful description. Each should be rejected. Open an editor in two tabs and save one; saving the stale tab should request a reload.

## Scope, deletion, and future integration

- This feature adds no scheduling, search, booking, payment, or map flow. The earlier classroom demo's booking records, overlap constraint, and history pages remain. Listing details now focus on listing information; new listings have no schedule, and a compatibility guard blocks reservations for drafts, deleted listings, or unscheduled listings.
- Deletion is **soft deletion**: `deleted_at` hides the listing from the app and public RLS reads, preserving foreign keys for existing booking history. Owners cannot restore or edit a deleted row through the normal API. A privileged administrator can still inspect retained rows. Profile RLS is unchanged.
- Removed/deleted photos are cleaned up through the Storage API only after the listing update succeeds. Policies protect photos still attached to a live listing. Supabase database writes and Storage calls are separate operations; interrupted uploads can leave orphan files. Cleanup failures are reported where known and do not undo a successful listing save.
- Prices are integer paise. Forms parse decimal INR strings with integer arithmetic; extra decimal places are rejected rather than rounded.
- Text address and city are the location source of truth. A later migration can add nullable `latitude`/`longitude` with range and paired-null checks, then geocode existing addresses. No coordinates or API keys are fabricated now.
- Drafts require a valid title, address, city, price, vehicle type, and parking type. Description can be empty until publishing; photos are optional.
- Automated SQL tests use minimal Supabase Auth/Storage schema scaffolding. Hosted upload/download behavior and the browser workflow should also be checked against your configured project after applying 003. No remote migrations or settings are applied automatically.

The earlier dependency audit reported a development-only `braces` advisory in Next.js ESLint tooling. No incompatible forced downgrade was applied.
