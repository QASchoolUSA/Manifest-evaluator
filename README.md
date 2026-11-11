# Manifest Evaluator

Public web app to import Advance Auto **B-Stock CSV manifests** as **separate lots**, inspect products and vehicle fitment, and estimate real market value (eBay sold → RockAuto → Amazon, with retail heuristics as fallback). Enrich resolves Advance Auto **product pages** + shelf prices via Advance’s API when reachable, otherwise Serper Google search (`site:shop.advanceautoparts.com/p …`).

**No login.** Anyone can open the site, see previously uploaded lots, and open each lot for the full evaluation. Uploads are shared and visible to everyone.

## Quick start (local)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without Turso env vars, the app uses a local libSQL file at `data/manifest-evaluator.db`.

- Upload one or more CSV manifests (each file = its own lot)
- Or click **Load 3 sample Advance Auto lots**
- Open a lot → **Price SKUs** to enrich market values
- Use **Compare** for side-by-side deal summaries
- **Export enriched CSV** from any lot detail page

## Deploy on Vercel

1. Create a free [Turso](https://turso.tech) database and copy the URL + auth token.
2. Import this GitHub repo into Vercel (or `vercel` CLI).
3. Set project environment variables:

   - `TURSO_DATABASE_URL` = `libsql://…`
   - `TURSO_AUTH_TOKEN` = your token
   - `EBAY_APP_ID` (recommended) — sold comps via Finding API; free-tier limits fall back to HTML/RockAuto/Amazon/heuristic
   - `SERPER_API_KEY` (**required for Advance product pages**) — free key at [serper.dev](https://serper.dev). Without it, Advance links fall back to Google site-search. Enrich uses small batches + a 45s budget to avoid Vercel 60s timeouts.

4. Deploy. Schema tables are created automatically on first request.
5. Open the site — load samples or upload manifests. Lots persist in Turso and are public.

Copy `.env.example` → `.env.local` for local Turso testing.

```bash
# optional: push schema with drizzle-kit
npm run db
```

## Stack

Next.js App Router · Turso/libSQL (`@libsql/client`) + Drizzle · TanStack Table + Virtual · Papa Parse

## Samples

CSV manifests live in `/samples` and can be seeded via `POST /api/seed`.
