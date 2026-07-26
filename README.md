# Practice Deadline Tracker — setup guide

A shared, browser-based tracker for your practice. Everyone on the team logs in
and sees the same client and deadline list. It works out priority from today's
date, and (Phase 2) emails the team each morning with what's due.

- **Front end:** one static page, hosted free on **GitHub Pages**.
- **Shared database + login:** **Supabase** (free tier is plenty for a small firm).
- **Daily email:** a scheduled Supabase function (Phase 2, optional).

You do **not** need to be a developer, but you do need to follow the steps
carefully. Budget about 30–40 minutes for Phase 1.

---

## Phase 1 — Get the shared app live

### 1. Create a Supabase project
1. Go to https://supabase.com and sign up (free).
2. **New project** → give it a name and a strong database password → create.
3. Wait a minute for it to finish setting up.

### 2. Create the tables
1. In your project: **SQL Editor** → **New query**.
2. Open `schema.sql` from this folder, copy everything, paste it in, **Run**.
   You should see success with no errors.

### 3. Lock down who can sign in (important)
By default anyone could request a login link. For a private team tool:
1. **Authentication** → **Providers** → **Email**: keep it enabled.
2. **Authentication** → **Sign In / Providers** (or **Settings**): turn
   **"Allow new users to sign up"** to **OFF**.
3. Add your team under **Authentication** → **Users** → **Add user** (one per
   colleague, using their work email). Only these people can get in.

> Note: the exact menu labels in Supabase change from time to time. If a label
> here doesn't match, look for the nearest equivalent, or check Supabase's own
> docs — I can't guarantee current wording.

### 4. Get your two keys
1. **Project Settings** → **API**.
2. Copy the **Project URL** and the **anon / public** key.
3. The anon key is *meant* to be public — it's safe in the page. Your data is
   protected by the login + policies from `schema.sql`. Never paste the
   **service_role** key into `index.html`.

### 5. Put the keys into the app
1. Open `index.html` in a text editor.
2. Near the top of the `<script>` find the CONFIG block and replace:
   ```js
   const SUPABASE_URL      = "https://YOUR-PROJECT-REF.supabase.co";
   const SUPABASE_ANON_KEY = "YOUR-ANON-PUBLIC-KEY";
   ```
   with your real values. Save.

### 6. Publish on GitHub Pages
1. Create a free account at https://github.com if you don't have one.
2. **New repository** → name it e.g. `practice-tracker` → **Private** is fine →
   Create.
3. Upload `index.html` (drag-and-drop via **Add file → Upload files** → Commit).
4. **Settings** → **Pages** → under **Build and deployment**, Source =
   **Deploy from a branch**, Branch = **main**, folder = **/ (root)** → Save.
5. After a minute, Pages shows your live URL, like
   `https://YOURNAME.github.io/practice-tracker/`. That's the link you and the
   team bookmark.

### 7. Allow the login redirect
1. Back in Supabase: **Authentication** → **URL Configuration**.
2. Set **Site URL** to your Pages URL.
3. Add the same URL under **Redirect URLs**. Save.
   (Without this, the sign-in link won't complete.)

### 8. Test
1. Open your Pages URL. Enter a team email that you added in step 3.
2. Click the link in the email → you're in.
3. Add a client, add a job. Open the page on another device / colleague's login
   — the same data is there, and updates appear live.

**Done — that's the reliable, shared team tool.**

---

## Everyday use
- **Deadlines tab:** everything sorted by urgency — Overdue → This week →
  Rest of this month → Next month → Later. The counters at the top are clickable
  filters.
- **Clients tab:** add/onboard clients, see each one's open jobs and next deadline.
- **Recurring jobs** (monthly payroll, quarterly VAT, annual accounts): tick one
  complete and the next period is created automatically.
- The tool tracks the dates **you** enter. It does **not** calculate statutory
  deadlines — always set each from Companies House / HMRC / the Charity
  Commission record, and verify against the primary source before acting.

## Adding or removing job types
1. Open `index.html`, find the `JOB_TYPES` list near the top of the script.
2. Add or remove a line (keep the quotes and commas). Save, re-upload to GitHub.
3. `CLIENT_TYPES` just below works the same way.
No database change is needed — these are just labels.

---

## Phase 2 — Daily email digest (optional)

GitHub Pages can't send scheduled emails (it's just static files), so the daily
"what's due" email runs inside Supabase.

1. **Get an email sender:** sign up at https://resend.com (free tier), verify a
   sending domain or address, and create an API key.
2. **Install the Supabase CLI:** https://supabase.com/docs/guides/cli
3. **Deploy the function** (from this folder):
   ```bash
   supabase login
   supabase link --project-ref YOUR-PROJECT-REF
   supabase functions deploy daily-digest
   supabase secrets set RESEND_API_KEY=... DIGEST_FROM="Severn Accounting <alerts@yourdomain.co.uk>" DIGEST_TO="you@…,colleague@…"
   ```
4. **Schedule it** to run each weekday morning. In Supabase **SQL Editor**,
   using the Cron / pg_cron feature:
   ```sql
   select cron.schedule(
     'daily-deadline-digest',
     '0 7 * * 1-5',                          -- 07:00, Mon–Fri
     $$
     select net.http_post(
       url     := 'https://YOUR-PROJECT-REF.supabase.co/functions/v1/daily-digest',
       headers := jsonb_build_object('Authorization','Bearer YOUR-SERVICE-ROLE-KEY')
     );
     $$
   );
   ```
   (Enable the `pg_cron` and `pg_net` extensions first under
   **Database → Extensions** if prompted.)

Times are UTC — adjust for BST if you want a fixed local time.

---

## What I couldn't verify for you
- Exact Supabase menu names and current free-tier limits change over time —
  check Supabase's own docs if a label here doesn't match.
- Anything about your Claude/Cowork plan limits belongs at
  https://support.claude.com.
- Deadline *dates* are yours to set and verify against HMRC / Companies House /
  the Charity Commission — the tool never invents them.
