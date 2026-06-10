# 4iMart

A full-stack e-commerce app for a Bangladeshi everything-store, built with
**Next.js (App Router) + TypeScript**, deployed to **Cloudflare Workers** via the
**OpenNext Cloudflare adapter**, backed by **Cloudflare D1** (SQLite) through
**Drizzle ORM**.

The customer-facing and admin UI is the exported design prototype, ported verbatim
(unchanged visuals). All data is now real: products/categories from D1, customer
auth + sessions, guest & logged-in checkout, a manual bKash/Nagad/COD payment flow,
support messages, and a full admin panel (orders, payments, category & product CRUD).

> The original design bundle (HTML/CSS/JS prototype + design chat transcript) is
> preserved under [`project/`](project/) and [`chats/`](chats/) for reference, and a
> standalone single-file build at [`4iGadgets.html`](4iGadgets.html).

---

## Tech stack

| Concern        | Choice                                                        |
| -------------- | ------------------------------------------------------------- |
| Framework      | Next.js 15 (App Router, TypeScript)                           |
| Hosting        | Cloudflare Workers via `@opennextjs/cloudflare`               |
| Database       | Cloudflare D1 (SQLite)                                        |
| ORM            | Drizzle ORM + drizzle-kit (migrations)                        |
| Auth           | Web Crypto **PBKDF2** password hashing + **HS256 JWT** cookies (no bcrypt, no Node crypto — Workers-safe) |
| Payments       | Manual bKash / Nagad (transaction-ID + admin verification) / Cash on Delivery |
| Styling        | The prototype's original CSS, unchanged (`app/globals.css`)   |

## Project layout

```
app/
  layout.tsx, page.tsx, globals.css   # shell + the client app mount
  api/                                # all backend route handlers
    catalog, products/[slug]          # public reads
    auth/{register,login,logout,me}   # customer auth
    orders                            # checkout (guest + user) + history
    support                           # customer support thread
    admin/{login,logout,me}           # admin auth (predefined creds)
    admin/{categories,products}[/id]  # admin CRUD
    admin/orders[/id]                 # list/filter, status, confirm payment
    admin/support                     # list + reply
components/StoreApp.jsx               # the ported prototype UI (client)
lib/
  db/{schema.ts,index.ts,id.ts}       # Drizzle schema + D1 connection
  auth/{password.ts,jwt.ts,session.ts}# PBKDF2, JWT, cookie sessions
  payments.ts                         # manual payment flow (gateway-ready seam)
  serialize.ts                        # DB rows -> UI shapes
drizzle/
  migrations/                         # SQL migrations (wrangler-applied)
  seed.sql                            # sample categories + products
scripts/gen-seed.mjs                  # regenerates seed.sql
wrangler.jsonc                        # worker config + D1 binding
open-next.config.ts, next.config.ts   # OpenNext adapter wiring
drizzle.config.ts                     # drizzle-kit config
```

---

## Environment variables & Cloudflare secrets

These are **secrets** (not committed). Locally they live in `.dev.vars`
(gitignored — copy from `.dev.vars.example`). In production set them with
`wrangler secret put <NAME>` or in the Cloudflare dashboard.

| Name             | Purpose                                                        |
| ---------------- | -------------------------------------------------------------- |
| `AUTH_SECRET`    | Signs session JWTs (HS256). Use a long random string: `openssl rand -base64 48` |
| `ADMIN_EMAIL`    | Admin panel login email (separate from customer accounts)      |
| `ADMIN_PASSWORD` | Admin panel login password                                     |
| `BKASH_NUMBER`   | Merchant bKash number shown at checkout                        |
| `NAGAD_NUMBER`   | Merchant Nagad number shown at checkout                        |

**Bindings** (in `wrangler.jsonc`, not secrets):

- `DB` — the D1 database binding.
- `ASSETS` — static assets (managed by OpenNext).

---

## 1) Local development

```bash
npm install

# Create your local secrets file
cp .dev.vars.example .dev.vars        # then edit values

# Create the LOCAL D1 schema + sample data (stored under .wrangler/)
npm run db:migrate:local
npm run db:seed:local

# Run the app (Next dev server, with local D1 bindings)
npm run dev                           # http://localhost:3000
```

Admin panel: open the app, top bar → **Admin**, log in with `ADMIN_EMAIL` /
`ADMIN_PASSWORD` from your `.dev.vars`.

To run the app exactly as it will run on Cloudflare (Workers runtime + local D1):

```bash
npm run preview                       # builds with OpenNext and serves via workerd
```

---

## 2) Create the production D1 database

```bash
npx wrangler login                    # one-time, opens browser

npx wrangler d1 create 4igadgets-db
```

Copy the printed `database_id` into **`wrangler.jsonc`** → `d1_databases[0].database_id`
(replacing `REPLACE_WITH_YOUR_D1_DATABASE_ID`).

## 3) Apply migrations + seed (production)

```bash
npm run db:migrate:remote
npm run db:seed:remote                # optional sample catalog
```

(Need to change the schema later? Edit `lib/db/schema.ts`, run `npm run db:generate`
to create a new migration, then `npm run db:migrate:remote`.)

---

## 4) Deploy

You can deploy directly, or connect GitHub for automatic deploys.

### Option A — deploy from your machine

```bash
# Set production secrets (run once each; you'll be prompted for the value)
npx wrangler secret put AUTH_SECRET
npx wrangler secret put ADMIN_EMAIL
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put BKASH_NUMBER
npx wrangler secret put NAGAD_NUMBER

npm run deploy                        # builds with OpenNext and deploys the Worker
```

### Option B — push to GitHub + connect to Cloudflare (auto-deploy)

```bash
git init && git add -A && git commit -m "4iMart full-stack app"
git branch -M main
git remote add origin https://github.com/<you>/4igadgets.git
git push -u origin main
```

Then in the **Cloudflare dashboard** → **Workers & Pages** → **Create** →
**Connect to Git**, pick the repo, and:

1. **Build command:** `npx opennextjs-cloudflare build`
2. **Deploy command:** `npx opennextjs-cloudflare deploy`
   (or leave Cloudflare's Next.js preset, which detects OpenNext).
3. **Settings → Bindings:** add a **D1 database** binding named `DB` pointing to
   `4igadgets-db` (the dashboard mirrors what's in `wrangler.jsonc`).
4. **Settings → Variables and Secrets:** add `AUTH_SECRET`, `ADMIN_EMAIL`,
   `ADMIN_PASSWORD`, `BKASH_NUMBER`, `NAGAD_NUMBER` as **encrypted** secrets.

Every push to `main` now builds and deploys automatically.

### Custom domain

After the first deploy, attach a custom domain in the dashboard under your Worker →
**Settings → Domains & Routes → Add → Custom Domain** (Cloudflare provisions the
certificate). This can be done at any time.

---

## Data model (D1 / Drizzle)

`users`, `categories`, `products`, `orders`, `order_items`, `support_messages`
— see [`lib/db/schema.ts`](lib/db/schema.ts). Enums (payment method/status, order
status) are stored as TEXT (SQLite has no native enums) and mapped to the UI in
[`lib/serialize.ts`](lib/serialize.ts).

## Payments (manual, gateway-ready)

- **bKash / Nagad:** checkout shows the merchant number, collects a transaction ID,
  and sets `paymentStatus = PENDING_VERIFICATION`. An admin confirms it (→ `PAID`)
  from **Admin → Orders**.
- **Cash on Delivery:** no online step; stays `UNPAID` until delivery.
- `lib/payments.ts` isolates this logic behind a small interface, with a documented
  `verifyGatewayPayment()` seam where a real bKash/Nagad gateway would slot in later.

## Product images

Admins paste a public **image URL** when creating/editing a product (no paid storage
required). Where a URL is present it renders; otherwise the original styled
placeholder shows. See the comment in `components/StoreApp.jsx` /
`app/api/admin/products/route.ts` for where **Cloudflare R2** could later back direct
uploads.

## Notes

- Passwords are hashed with PBKDF2 via Web Crypto; sessions are HS256 JWTs in
  httpOnly cookies — all Workers-runtime compatible (no native bcrypt / Node crypto).
- The homepage marketing banner and the Desktop/Mobile + Hero toggles are UI-only
  prototype controls (session state), intentionally not persisted.
