# NOIR FASHION — webshop

**CURATED LUXURY. TIMELESS STYLE.**

A Dutch luxury resale webshop with catalogue, cart, order submission **without online payment**, and a secure admin dashboard.
Built with Next.js 16, TypeScript, Tailwind CSS 4 and Supabase. Hosted on Vercel.

---

## What's inside

| Customer side (Dutch) | Admin dashboard (`/admin`, Dutch) |
|---|---|
| Homepage, Collectie with search + filters (brand, category, size, price, availability) and sorting | Overview with order and stock counters |
| Brand overview + a page per brand | Products: add, edit, hide/publish, sold out, delete |
| Product pages: gallery with zoom, sizes, condition, stock, quantity, related products | Photo upload (auto-resized), reorder, main photo |
| Cart (drawer + page), checkout with **only name + phone required** | Stock per size, prices + sale prices (also per size) |
| Confirmation page: order submitted, not yet paid or confirmed | Brands and categories |
| Contact, FAQ, Over ons, Verzending, Retourneren, Privacy, Voorwaarden, Maattabel, Authenticiteit | Orders: statuses, mark paid/completed, cancel, internal notes |
| SEO: titles, descriptions, sitemap, robots.txt, social image, product structured data | Customer list, settings, editable info pages, new-order counter + pop-up |

**How an order works:** the customer submits name + phone (Snapchat, email, notes optional). The database checks everything, prices every item from *your* prices (never from the browser), reserves the stock, gives a number like `NF-261101-7K3Q`, and the order shows up in your dashboard. You contact the customer and arrange Tikkie/cash and delivery/pickup yourself. Cancelling an order puts the stock back. Deleting a product never deletes order history.

**Security:** customers can never read any order (database Row Level Security). Only accounts in `admin_users` can change products, prices or orders. Passwords are hashed by Supabase Auth. No secret keys are used in the website code.

---

## Launch it — step by step

You need: a free [GitHub](https://github.com) account, a free [Supabase](https://supabase.com) account, a free [Vercel](https://vercel.com) account, and [Node.js 20.9+](https://nodejs.org) on your computer.

### 1. Supabase (database, login, photos)
1. supabase.com → **New project**. Pick region **Europe (Frankfurt/West EU)**. Save the database password somewhere safe.
2. Left menu → **SQL Editor** → **New query** → paste all of `supabase/schema.sql` → **Run**.
3. New query again → paste `supabase/content.sql` → **Run** (starting text for the info pages).
4. **Authentication → Sign In / Providers → Email**: turn **off** "Allow new users to sign up" (only you need an account).
5. **Project Settings → API** (Data API): copy the **Project URL**, the **anon / public key**, and the **service_role key** (keep the last one secret).

### 2. Run it on your computer
```bash
npm install
cp .env.example .env.local     # Windows: copy .env.example .env.local
```
Fill in `.env.local` with the Project URL, anon key, and (only here) the service_role key. Then:
```bash
npm run create-admin -- you@example.com "a-strong-password"
npm run dev
```
Open http://localhost:3000 (shop) and http://localhost:3000/admin (dashboard).

### 3. Put it on GitHub
1. github.com → **New repository** → name `noir-fashion` → **Private** → Create.
2. In the project folder:
```bash
git init
git add .
git commit -m "NOIR FASHION webshop"
git branch -M main
git remote add origin https://github.com/YOUR-NAME/noir-fashion.git
git push -u origin main
```
`.env.local` is ignored by git, so your keys never reach GitHub.

### 4. Deploy on Vercel
1. vercel.com → **Add New → Project** → import the `noir-fashion` repo.
2. **Environment Variables** — add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` = your Vercel address, e.g. `https://noir-fashion.vercel.app`
   - *(optional, email alerts)* `RESEND_API_KEY`, `ORDER_NOTIFICATION_EMAIL`, `ORDER_NOTIFICATION_FROM`
   - **Do not** add `SUPABASE_SERVICE_ROLE_KEY` to Vercel.
3. **Deploy.** Every `git push` redeploys automatically.

### 5. Your first products
`/admin` → log in → **Product toevoegen**: name, brand, category, condition, your price, sizes + stock, photos → **Product opslaan**. It's live straight away (switch "Online in de webshop" off to prepare it hidden).

Then go to **Instellingen**: fill in WhatsApp / Instagram / Snapchat / email, and open each page marked **Aanvullen** to replace the yellow `[IN TE VULLEN …]` placeholders.

### 6. Connect a domain later
Buy a domain (e.g. at TransIP or Cloudflare) → Vercel project → **Settings → Domains** → add it and follow the DNS instructions → change `NEXT_PUBLIC_SITE_URL` to `https://yourdomain.nl` → **Redeploy**.

### Optional: email on every new order
New orders always appear in the dashboard (counter + pop-up while it's open). For email too: create a free account at [resend.com](https://resend.com), make an API key, and set `RESEND_API_KEY` and `ORDER_NOTIFICATION_EMAIL` on Vercel. Without your own verified domain, Resend only sends from `onboarding@resend.dev` to the email address of your Resend account. **Place a test order to confirm the email arrives** — this part could not be tested before your keys exist.

---

## Your admin account (only you)
Customers never need an account: they browse, use the cart and order as guests. The dashboard is only for you, at **/admin**.

**Create your login (no command line needed):**
1. Supabase → **Authentication → Sign In / Providers → Email**: turn **off** "Allow new users to sign up". Nobody can create an account from the website.
2. Supabase → **Authentication → Users → Add user → Create new user**: your email + a strong password (12+ characters), tick **Auto Confirm User**.
3. Open `supabase/create-admin.sql`, put your email in it, paste it in the **SQL Editor** → **Run**. The last line should show your email.
4. Go to `/admin`, log in, done. (Alternative for developers: `npm run create-admin`.)

**How it is protected (several layers):**
- `/admin` without being logged in → redirected to `/admin/login` before any page loads (`src/proxy.ts`).
- Every dashboard page and every admin action checks again that you are logged in **and** listed as admin. A normal account, even with a correct password, is refused and logged out.
- The database itself (Row Level Security) only lets admins read orders/customer data or change products, prices, brands, stock and settings, and only admins can upload photos. Visitors can only read published products and submit an order through one checked function.
- Nobody can make themselves admin from the website: the admin list can only be changed in the Supabase SQL Editor.
- Passwords are stored hashed by Supabase Auth, and Supabase limits repeated login attempts. The service_role key is never used by the website.
- Dashboard pages are never indexed by search engines or cached.

To remove admin rights later, see the bottom of `supabase/create-admin.sql`. To change your password: Supabase → Authentication → Users → your user → **Send password recovery**, or set it there directly.

## Update 2 — brand pages & brand management
1. Upload the new files to GitHub (they replace the old ones) → Vercel redeploys automatically.
2. Supabase → **SQL Editor** → paste `supabase/update-2-merken.sql` → **Run** (once). It adds the brand header photo, changes the Essentials URL to `/merken/essentials` (the old URL redirects) and makes sure all 10 brands exist. Products, prices and orders are not touched.
3. Dashboard → **Merken beheren**: add/rename/delete brands, upload a header photo, set the order with ▲ ▼.

Every brand automatically has a page at `/merken/<webadres>`. A product appears there as soon as you pick that brand in the product form and the product is online. Brands you add later get their page immediately.

## Update 3 — homepage button & discount codes
1. The homepage button now says **Bekijk de merken** and goes to the brand overview. The old "Collectie"/"Shop nu" page is gone (`/collectie` redirects to `/merken`); search, "Nieuw binnen" and category links use `/zoeken`.
2. Supabase → **SQL Editor** → run `supabase/update-3-kortingscodes.sql` once (adds the discount-code table and updates the order function; products and orders are untouched).
3. Dashboard → **Kortingscodes**: create codes (name, percentage or fixed euro amount, maximum number of uses), see how often each was used, edit or delete them. A code expires automatically when its maximum is reached; cancelling an order gives the use back.
4. Customers fill in the code at checkout; the discount is calculated by the database, never by the browser. Orders keep the code name and the discount they received.

## Before you go live — please check
- **Legal texts are drafts, not legal advice.** Privacy, Voorwaarden and Retourneren contain marked placeholders. Have them checked.
- **Registration:** in the Netherlands, selling regularly with the aim of making a profit usually means you must register with the KvK, and consumer rights such as the 14-day withdrawal right for distance sales then apply. Check this at kvk.nl. The site deliberately makes no claim that NOIR FASHION is registered.
- **Brands:** the site uses brand *names* only (no brand logos) and states it is not an official seller or partner. Use only your own photos of your own items.
- **Placeholders:** products show "Foto volgt" until you upload photos; contact channels show "Volgt binnenkort" until you fill them in.

---

## Project structure
```
supabase/schema.sql      tables, security policies, order + status functions, brands & categories
supabase/content.sql     starting text for the info pages (Dutch)
src/app/(shop)/          customer pages (Dutch)
src/app/admin/           dashboard + all admin server actions (actions.ts)
src/components/          shop + admin components
src/lib/                 pricing, catalogue queries, validation, formatting, Supabase clients
src/proxy.ts             keeps the admin login fresh
scripts/create-admin.mjs creates/promotes an admin account
public/brand/            your original logo (+ background-free version)
```
Prices: one function decides the selling price, in both the database (`effective_price`) and the site (`src/lib/pricing.ts`): a size's own price (with its own sale price) if set, otherwise the product price with the size's or product's sale price. Nothing is ever calculated or invented.
