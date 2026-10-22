# ParkNest frontend

The Next.js App Router app: pages, components, auth forms, and the server-side adapters required for Supabase SSR cookies. Server Actions and route handlers execute on the Next.js server, not in the browser.

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
