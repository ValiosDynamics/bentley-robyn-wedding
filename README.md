# Bentley & Robyn — Wedding Website

## Deploy in ~10 minutes (free)

### 1. Push to GitHub
- Create a new repo at github.com (e.g. `bentley-robyn-2027`)
- Upload this entire folder, or use `git push`

### 2. Deploy on Vercel
- Go to vercel.com → sign in with GitHub
- Click "Add New Project" → import your repo
- Framework: **Vite** (auto-detected)
- Hit Deploy — you'll get a URL like `bentley-robyn-2027.vercel.app`

### 3. Set up RSVPs (Formspree — free, 50/month)
- Go to formspree.io → create a free account
- Click "New Form" → name it "Wedding RSVP"
- Copy your Form ID (looks like `xpwzabcd`)
- Open `src/App.jsx` and replace `YOUR_FORM_ID` with it
- Every RSVP emails you automatically

### 4. Get a custom domain (optional, ~$15/yr)
- Buy `bentleyandrobyn.com` at Namecheap or Cloudflare
- In Vercel → Settings → Domains → add your domain
- Follow the DNS instructions (5 min)

### 5. Update content as things lock in
All the easy-to-change bits are at the top of `src/App.jsx`:

```js
const WEDDING_DATE = new Date("2027-06-19T17:00:00-07:00"); // ← your date
const VENUE_NAME   = "Kelowna, BC";                          // ← hall name
const VENUE_SUB    = "Venue TBD — stay tuned";               // ← address
const DOORS_TIME   = "5:00 PM";                              // ← start time
```

### Admin panel
Click `···` in the footer 5 times fast to see who's RSVPd.
RSVPs are stored in the browser's localStorage, so you need to check
on the same device/browser you submitted from, OR just use Formspree's
dashboard which shows all submissions.

## Local dev
```bash
npm install
npm run dev
```
