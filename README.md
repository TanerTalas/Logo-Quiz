# Logo Quiz

A brand logo starts out blurred and sharpens over eight seconds. Name it before it comes into focus — the faster you answer, the more it's worth. Three lives, and the round runs the whole category.

<p>
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white">
  <img alt="React" src="https://img.shields.io/badge/React-19-087EA4?logo=react&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white">
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white">
  <img alt="Drizzle" src="https://img.shields.io/badge/Drizzle-ORM-C5F74F?logo=drizzle&logoColor=black">
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white">
</p>

**365 logos · 10 categories · answers verified server-side**

---

## How it plays

Pick a category — or Mixed, which draws from everything — and the round begins after a short `Ready? / Go` countdown.

Each question shows one blurred logo and four brand names. The points badge counts down from **100 to 20** as the blur clears, so an early guess is worth five times a late one. After the logo is fully sharp you get four more seconds at the minimum score. Guess wrong or run out of time and you lose a life.

Rounds are built to ramp: questions run easiest to hardest, and the three wrong options are drawn from the answer's **own category**. Across a catalog this varied, options pulled at random would give the game away — *Ferrari, Spotify, HSBC, Ryanair* is not a question.

| Category | Logos |
| --- | ---: |
| Tech & Apps | 61 |
| Automotive | 47 |
| Finance & Payments | 44 |
| Travel & Airlines | 44 |
| Streaming & Music | 36 |
| Fashion & Retail | 33 |
| Gaming | 32 |
| Social Media | 31 |
| Food & Drink | 23 |
| Sports & Fitness | 14 |
| **Mixed** | **50 drawn from all 365** |

---

## How the answers stay secret

A quiz whose answers sit in the page source isn't a quiz. Everything that decides a question lives on the server, and hiding it took more than not sending the answer:

**The round never leaves the server.** Starting a round stores the chosen logo IDs in a signed, `httpOnly` cookie. The browser receives four option labels per question and nothing that marks which is correct. Guesses go to `POST /api/guess`, which looks up what that question actually was and returns only a verdict plus the points earned.

**The image URL would have leaked it.** Linking straight to `cdn.simpleicons.org/spotify` hands the answer to anyone with the network tab open. The mystery logo is proxied by its **position in the round** instead — `/api/logo-image/3` — and the server resolves that position through the cookie.

**So would the SVG itself.** SimpleIcons ships every icon with `<title>Spotify</title>` for screen readers, so the file spells out the answer even behind a neutral URL. That markup is stripped before the bytes are served.

**Stale URLs are rejected.** Each round carries a random tag on its image URLs, which scopes them to that round — enough to let the browser cache them and preload the next question, while a URL left over from an earlier round returns `409` rather than the wrong logo.

> **Known limit:** elapsed time is measured in the browser, so a crafted request claiming zero elapsed time always scores the maximum. *Which* option is correct is still decided server-side — only the speed bonus is takeable. That is an accepted trade while scores live in the player's own `localStorage`. Adding a shared leaderboard would mean timestamping each question as it is served.

---

## Tech stack

| | |
| --- | --- |
| **Framework** | Next.js 16 (App Router, React 19, TypeScript) |
| **Styling** | Tailwind CSS 4 with CSS custom properties for the design tokens |
| **Database** | PostgreSQL 17 on Supabase |
| **ORM** | Drizzle |
| **Logo images** | [SimpleIcons](https://simpleicons.org) CDN, proxied during rounds |
| **Audio** | Web Audio API — sound effects synthesised at runtime, no audio files |

Catalog pages (`/categories`, `/logos`) are Server Components reading straight from Postgres, so no logo data ships as JSON. Only the gameplay screen, the intro curtain and the home page globe run on the client.

---

## Getting started

### Prerequisites

- Node.js 20 or newer
- A free [Supabase](https://supabase.com) project

### 1. Install

```bash
git clone https://github.com/TanerTalas/Logo-Quiz.git
cd Logo-Quiz
npm install
```

### 2. Create the database

In the Supabase dashboard: **New project**, pick a region close to your users, and save the database password it generates — it is shown only once.

Then open **Connect → Connection String → Session pooler** and copy the URI.

> Supabase's *Direct connection* is IPv6-only on the free tier, which fails on many home networks. The **Session pooler** is IPv4 and works for both migrations and the app.

### 3. Configure the environment

```bash
cp .env.example .env.local
```

Fill in both values:

```ini
# Replace [YOUR-PASSWORD] with the password from step 2
DATABASE_URL=postgresql://postgres.xxxx:PASSWORD@aws-0-eu-central-1.pooler.supabase.com:5432/postgres

# Any long random string — signs the round cookie
ROUND_SECRET=...
```

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

`.env.local` is gitignored and never leaves your machine.

### 4. Create the tables and load the catalog

```bash
npm run db:check   # confirms the connection and reports query latency
npm run db:push    # creates the categories and logos tables
npm run db:seed    # loads 10 categories and 365 logos
```

### 5. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run db:check` | Verify `DATABASE_URL` and measure round-trip latency |
| `npm run db:push` | Apply the Drizzle schema to the database |
| `npm run db:seed` | Load the catalog — safe to re-run, it upserts |
| `npm run db:studio` | Browse the data in Drizzle Studio |

---

## Project structure

```
src/
├── app/
│   ├── api/
│   │   ├── round/            # Starts a round, sets the signed cookie
│   │   ├── guess/            # Checks one answer, returns the verdict
│   │   └── logo-image/       # Proxies the mystery logo by question position
│   ├── categories/           # Category grid (Server Component)
│   ├── logos/                # Full catalog gallery (Server Component)
│   ├── game/                 # Mixed round and /game/[category]
│   ├── gameover/             # Round summary
│   ├── not-found.tsx         # 404
│   └── layout.tsx
├── components/
│   ├── QuizGameClient.tsx    # The gameplay loop
│   ├── IntroOverlay.tsx      # Opening curtain animation
│   ├── LogoGlobe.tsx         # Rotating 3D logo sphere on the home page
│   └── SoundLink.tsx         # Link wrapper that plays the click sound
├── db/
│   ├── schema.ts             # Drizzle tables
│   ├── queries.ts            # Every database read, server-only
│   ├── catalog.ts            # The curated logo list, seed source
│   └── seed.ts               # Seeding script
└── lib/
    ├── roundSession.ts       # Signed round cookie
    ├── scoring.ts            # Timing and points rules, shared client/server
    ├── soundEffects.ts       # Web Audio synthesiser
    └── storage.ts            # localStorage for high score and mute
```

---

## Adding logos

Add the brand's [SimpleIcons](https://simpleicons.org) slug to the right category in `src/db/catalog.ts`, then re-seed:

```bash
npm run db:seed
```

The display name and brand colour come from the `simple-icons` package at seed time, so an unknown slug fails the seed rather than shipping a broken image. The seed also refuses a category with fewer than ten logos, and reports any slug listed in two categories.

> SimpleIcons removes brands whose licence does not permit redistribution, so not every name is available — Pizza Hut, Pepsi, Gucci and Real Madrid are among the missing. The `image_url` column holds a plain URL, so another source can be mixed in without a schema change.

---

## Deployment

Deploys to [Vercel](https://vercel.com) from the repository. Add the environment variables under **Settings → Environment Variables** for Production, Preview and Development:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Supabase **transaction pooler** URI (port 6543) |
| `ROUND_SECRET` | A long random string |

Three things about latency and connection limits, each of which costs a confusing afternoon to discover:

**Keep the functions in the same region as the database.** Vercel runs functions in Washington (`iad1`) by default. With the database in Frankfurt, every query would cross the Atlantic. `vercel.json` pins them to `fra1` — change it if your database lives elsewhere.

```json
{ "regions": ["fra1"] }
```

**Pick a database region near your users.** The same query measured 340 ms from Turkey to Supabase's Sydney region and 50 ms to Frankfurt. Region cannot be changed after a Supabase project is created, so getting it wrong means starting over.

**Use the transaction pooler in production.** Supabase's free tier allows 15 concurrent clients across the whole project, and a connection pool is created per process — one per serverless instance, so the count climbs with traffic. Session mode holds a connection for the entire session; transaction mode hands it back after each transaction and serves far more clients from the same budget.

Schema changes still need a session that outlives a single transaction. Once `DATABASE_URL` points at the transaction pooler, set `MIGRATION_DATABASE_URL` to the session pooler URI in `.env.local` — `db:push` and `db:seed` pick it up automatically.

---

## Credits

Designed and coded by **Taner Talas**.

Brand marks from [SimpleIcons](https://simpleicons.org), used under their respective trademark holders' rights for identification purposes.
