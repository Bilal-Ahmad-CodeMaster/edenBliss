# Eden Bliss

Eden Bliss is a luxury clothing storefront. Customers browse the collection, keep a wishlist, and place cash-on-delivery orders. The house is run from a private atelier desk at `/admin`.

## Run it locally

1. Copy `.env.example` to `.env.local`.
2. Set `MONGODB_URI` to a real MongoDB database.
3. Replace every secret (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CSRF_SECRET`, `WEBHOOK_SECRET`, `INTERNAL_JOB_QUEUE_SECRET`) with a long random value. `openssl rand -base64 64` works.
4. Set `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD`. These are used only by the seed script.
5. Leave `REDIS_URL` empty to use the in-memory cache, or point it at Upstash.
6. Install and start:

```bash
npm install
npm run seed
npm run dev
```

The store opens at [http://localhost:3000](http://localhost:3000). `npm run seed` creates store settings, sizes S–XXL, sample categories and pieces, and one admin account. If that email already exists, the seed keeps the account and makes sure its role is `ADMIN`. It does not overwrite a password that is already set.

## How an admin uses the site

Anyone who is not signed in as an admin gets a 404 on `/admin`. The desk is not listed in the public header.

1. Open [http://localhost:3000/login](http://localhost:3000/login).
2. Sign in with `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD` from `.env.local`.
3. Go to [http://localhost:3000/admin](http://localhost:3000/admin).

On a wide screen the desk has a left rail. On a phone, open it with the menu button. Every change is written to the audit log.

| Desk | Address | What you do there |
| --- | --- | --- |
| Overview | `/admin` | Registered clients, who was active in the last 15 minutes, revenue, orders by status, sizes with three pieces or fewer, and the latest orders. |
| Categories | `/admin/categories` | Add, rename, and retire rails. A category can sit under a parent (for example Shirts under Ready to wear). |
| Sizes | `/admin/sizes` | Keep the size chart. Measurements are stored in metres and shown to customers in centimetres or inches. |
| Pieces | `/admin/products` | Create and edit cloth: story, fabric and care, photos, category, stock per size, base price, and discount. The selling price is calculated on the server. |
| Orders | `/admin/orders` | Search cash-on-delivery orders and move them through Pending, Confirmed, Processing, Shipped, Delivered, or Cancelled. Fit notes from checkout appear on the order. |
| Clients | `/admin/users` | See who has an account. Block or unblock a customer. Reset a customer password or delete a customer only after you type your own atelier password. Admin accounts cannot be deleted from this list. |
| Profile | `/admin/profile` | Update your name, phone, and password. Changing the password requires the current one. |
| Settings | `/admin/settings` | Store name, support email and phone, currency symbol, shipping rate, free-shipping threshold, tax, and the announcement bar at the top of the shop. |
| Audit | `/admin/audit` | Read-only history of desk actions: who did it, from which address, and what changed. |

Customers still use the public shop. They sign up at `/login`, edit `/profile`, and check out at `/checkout`. Payment is cash on delivery only. Prices, discounts, and shipping are read from the database at checkout, so a client cannot send their own totals.

## Notes

- Keep `ENABLE_SEED_ENDPOINT` set to `false`. Seeding is a local script, not a public URL.
- Uploaded portraits and product files are checked by their file header, limited to 2MB, and stored outside the public folder.
- Unknown shop addresses return to the home page. `/admin` stays a 404 until an admin session is present.
