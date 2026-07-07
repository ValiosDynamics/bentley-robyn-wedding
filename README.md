# Bentley & Robyn — Wedding Site

## One-time Supabase setup
1. Supabase dashboard → SQL Editor → New query → paste the contents of `schema.sql` → Run.
2. That creates the `config`, `guests`, and `plus_one_requests` tables with your default password (`dancefloor2027`) and admin password (`bestfriends4eva`). Change these anytime via the admin panel (config) — the passwords live in the `config` table, editable directly in Supabase's Table Editor if you want to change them before launch.

## Deploying (Vercel)
1. In Vercel, import this GitHub repo.
2. Framework preset: Vite.
3. Add two Environment Variables in the Vercel project settings (Settings → Environment Variables):
   - `VITE_SUPABASE_URL` — your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` — your Supabase **publishable/anon** key only. Never put the secret/service_role key here or anywhere in this code.
4. Deploy. Every push to `main` auto-redeploys.

## How it works
- Guests see a public guest list. Clicking a name's RSVP button opens a popup asking for the shared guest password, then RSVP status, email (required), phone (optional), and a note.
- A guest can request a +1 from within their RSVP popup; it shows up in the admin panel for approval.
- Admin panel is at `/#admin`, gated by the admin password. From there: edit date/venue/photo link, add/remove guests, approve/deny +1 requests.

## Security note
This uses simple app-level passwords, not real user accounts — fine for a casual wedding site shared with people you trust, but anyone with the guest password can edit any guest's RSVP (not just their own), and the Supabase anon key allows broad read/write per the policies in `schema.sql`. That's an intentional tradeoff for simplicity here, not bank-grade security.
