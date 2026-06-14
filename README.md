# The Family That Reads Together

A family book club website. Track the current book, suggest and vote on future reads, browse past books, and manage everything through a Discord-authenticated admin panel.

**Stack:** Vue 3 + Vite · Firebase Firestore · Firebase Auth (Discord OAuth) · Express · Docker

---

## Setup

### 1. Firebase project

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Firestore** (production mode)
3. Enable **Authentication** (no sign-in provider needed — uses custom tokens)
4. Go to Project Settings → Your apps → Add web app → copy config values

### 2. Discord app

1. Create an application at [discord.com/developers/applications](https://discord.com/developers/applications)
2. Copy the **Application ID** (this is your client ID — it's numeric)
3. OAuth2 → reset and copy the **Client Secret**
4. OAuth2 → add redirect URI: `https://yourdomain.com/admin`
5. Under **Bot**, enable the **Message Content Intent** (required to read thread message text)

### 3. Environment variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

**Frontend (baked in at build time):**

| Variable | Description |
|----------|-------------|
| `VITE_FIREBASE_API_KEY` | From Firebase console |
| `VITE_FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Your Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | `your-project.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | From Firebase console |
| `VITE_FIREBASE_APP_ID` | From Firebase console |
| `VITE_DISCORD_CLIENT_ID` | Discord Application ID (numeric) |
| `VITE_DISCORD_REDIRECT_URI` | `https://yourdomain.com/admin` |
| `VITE_GOOGLE_BOOKS_API_KEY` | Google Books API key (for cover/metadata lookup) |

**Server (runtime only, never exposed to the browser):**

| Variable | Description |
|----------|-------------|
| `DISCORD_CLIENT_ID` | Same Discord Application ID |
| `DISCORD_CLIENT_SECRET` | Discord client secret |
| `DISCORD_BOT_TOKEN` | Bot token for reading Discord channels/threads |
| `DISCORD_GUILD_ID` | Your Discord server ID |
| `DISCORD_FINISHED_CATEGORY_ID` | Category ID for finished-book channels |
| `DISCORD_CURRENT_CATEGORY_ID` | Category ID for current/upcoming book channels |
| `DISCORD_SUGGESTIONS_WEBHOOK_URL` | Webhook URL for new-suggestion notifications |
| `FIREBASE_SERVICE_ACCOUNT` | Base64-encoded service account JSON (see below) |
| `PORT` | Server port (default: 3000) |

**Getting `FIREBASE_SERVICE_ACCOUNT`:**
Firebase console → Project Settings → Service accounts → Generate new private key → save the JSON, then encode it:
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("service-account.json")) | clip
```

**GitHub Actions secrets** (set via `gh secret set` or the repo Settings → Secrets UI — not needed for local dev):

| Secret | Description |
|--------|-------------|
| `DISCORD_CHANGELOG_WEBHOOK_URL` | Webhook for the `#website-updates` Discord channel — auto-posts when `ChangelogPage.vue` changes on master |
| `DISCORD_BOT_TOKEN` | Same bot token as above — used by the daily Discord sync workflow |
| `DISCORD_GUILD_ID` | Same guild ID — used by the daily Discord sync workflow |
| `FIREBASE_SERVICE_ACCOUNT` | Same base64 service account — used by the daily Discord sync workflow |

### 4. Deploy Firestore rules and indexes

```bash
firebase deploy --only firestore
```

The suggestions collection requires a composite index on `votes DESC, createdAt DESC` — Firebase will log a direct link to create it on first query if it's missing.

---

## Development

```bash
npm install
npm run dev
```

The frontend runs at `http://localhost:5173`. The Vite dev server proxies `/api/*` and `/covers/*` to the Express server on port 3000, so you'll want to run the server too:

```bash
cd server && npm install && node index.js
```

**Tests:**

```bash
npm test
```

Vitest is configured but there are no test files yet. Running `npm test` will exit immediately with no failures.

---

## Production (Docker / Easy Panel)

### Build and run locally

```bash
docker build \
  --build-arg VITE_FIREBASE_API_KEY=... \
  --build-arg VITE_FIREBASE_AUTH_DOMAIN=... \
  --build-arg VITE_FIREBASE_PROJECT_ID=... \
  --build-arg VITE_FIREBASE_STORAGE_BUCKET=... \
  --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID=... \
  --build-arg VITE_FIREBASE_APP_ID=... \
  --build-arg VITE_DISCORD_CLIENT_ID=... \
  --build-arg VITE_DISCORD_REDIRECT_URI=https://yourdomain.com/admin \
  --build-arg VITE_GOOGLE_BOOKS_API_KEY=... \
  -t family-book-club .

docker run -p 3000:3000 \
  -e DISCORD_CLIENT_ID=... \
  -e DISCORD_CLIENT_SECRET=... \
  -e DISCORD_BOT_TOKEN=... \
  -e DISCORD_GUILD_ID=... \
  -e DISCORD_FINISHED_CATEGORY_ID=... \
  -e DISCORD_CURRENT_CATEGORY_ID=... \
  -e DISCORD_SUGGESTIONS_WEBHOOK_URL=... \
  -e FIREBASE_SERVICE_ACCOUNT=... \
  family-book-club
```

### Easy Panel

1. Connect this GitHub repo, branch `master`
2. Build method: **Dockerfile**, published port **3000**
3. Set all `VITE_*` values as **build arguments**
4. Set `DISCORD_*`, `FIREBASE_SERVICE_ACCOUNT`, and `PORT=3000` as **environment variables**
5. Add a persistent volume mounted at `/app/public/covers/` for uploaded cover images
6. Add your domain, enable HTTPS, and deploy

---

## GitHub Actions

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `discord-changelog.yml` | Push to `master` touching `src/pages/ChangelogPage.vue` | Posts new changelog entries as a Discord embed to `#website-updates` |
| `discord-sync.yml` | Daily at 4 AM UTC · manual dispatch | Syncs quotes and supplemental materials from Discord threads to Firestore for all past books |

Both workflows require the GitHub Actions secrets listed above.

---

## Scripts

One-off and automation scripts live in `scripts/`. All use the `.cjs` extension because `package.json` sets `"type": "module"` — scripts that use `require()` must be CommonJS.

| Script | Usage | Purpose |
|--------|-------|---------|
| `post-changelog.cjs` | Run by `discord-changelog.yml` | Diffs `ChangelogPage.vue` across the push range and posts new entries to the Discord webhook |
| `sync-discord.cjs` | Run by `discord-sync.yml` | Scans Discord book channels for Quotes and resource threads; upserts quotes and supplemental materials to Firestore |
| `seed.cjs` | `node scripts/seed.cjs` | Seeds Firestore with the real club data (current book, past books, family members) |
| `seed-legacy.cjs` | `node scripts/seed-legacy.cjs` | Generic placeholder seed — useful when setting up a fresh project |
| `seed-suggestions.cjs` | `node scripts/seed-suggestions.cjs` | Seeds suggestion entries |
| `migrate.cjs` | `node scripts/migrate.cjs` | One-off data migrations |

**GitHub Actions scripts** (`post-changelog.cjs`, `sync-discord.cjs`) run in CI and read `FIREBASE_SERVICE_ACCOUNT` (base64 env var) and `DISCORD_BOT_TOKEN` / `DISCORD_GUILD_ID`.

**Manual scripts** (`seed.cjs`, `seed-legacy.cjs`, `seed-suggestions.cjs`, `migrate.cjs`) read a local `service-account.json` file in the project root (git-ignored), or fall back to `GOOGLE_APPLICATION_CREDENTIALS` if the file is absent.

---

## Project structure

```
src/
  pages/
    DashboardPage.vue       Home — current book hero, meeting card, top suggestions, widgets
    BookPage.vue            Current book detail — synopsis, characters, timeline, spoiler filter, subnav
    SuggestionsPage.vue     Browse and vote on book suggestions
    PastBooksPage.vue       Grid of all past books
    PastBookDetailPage.vue  Past book detail — description, quotes, materials, discussion, characters, timeline, subnav
    AdminPage.vue           Admin panel (requires Discord login)
    ChangelogPage.vue       Public changelog (source of truth for Discord #website-updates posts)
  components/
    layout/
      AppNav.vue            Sticky nav with Discord login button
      AppFooter.vue         Footer links
      ParticleLayer.vue     Animated background particles
      WelcomeModal.vue      First-visit tutorial for logged-out users
    book/
      SpoilerFilter.vue     Chapter-based spoiler control
      CharacterGrid.vue     Character cards filtered by spoiler chapter
      TimelineSection.vue   Story timeline filtered by spoiler chapter
      QuotesCarousel.vue    Auto-advancing quotes carousel for past book pages
      SupplementalMaterials.vue
      DiscordThreads.vue
    dashboard/
      HeroSection.vue
      MeetingCard.vue
      TopSuggestions.vue
      PastBooksWidget.vue
      AudiobookWidget.vue   Audiobookshelf access request form
    suggestions/
      SuggestionsToolbar.vue  Filter, sort, view toggle, genre picker, "I haven't read" filter
      CoverGrid.vue
      CoverCard.vue
      ListView.vue
      SuggestModal.vue      Suggest a book with Google Books autocomplete
      CommentPanel.vue      Slide-in comments panel
    admin/
      AdminCurrentBook.vue
      AdminPastBooks.vue
      AdminSuggestions.vue
      AdminAudiobook.vue
      AdminMembers.vue      Map Discord handles to display names
    shared/
      CoverUpload.vue       Cover image upload (used in suggest form and admin)
  composables/
    useConfig.js            Firestore config/main listener
    useSuggestions.js       Suggestions CRUD, voting, mark-as-read
    usePastBooks.js         Past books listener
    useComments.js          Per-suggestion comments subcollection
    useSpoilerFilter.js     Chapter spoiler state + localStorage persistence
    useMemberProfiles.js    Discord handle → display name resolution
  stores/
    auth.js                 Pinia store — Discord OAuth + Firebase custom token auth
  utils/
    googleBooks.js          Google Books + Open Library metadata fetch with cover fallback
    genres.js               Genre list and icon definitions
    uploadCover.js          Cover upload helper (POST /api/upload)
server/
  index.js                  Express: /api/discord-auth, /api/send-webhook, /api/upload, static SPA
scripts/
  post-changelog.cjs        Posts changelog updates to Discord (run by GitHub Actions)
  sync-discord.cjs          Syncs Discord quotes and materials to Firestore (run by GitHub Actions)
  seed.cjs                  Firestore seed data
  seed-suggestions.cjs      Additional suggestion seed data
  migrate.cjs               One-off data migrations
.github/
  workflows/
    discord-changelog.yml   Posts changelog entries to Discord on master push
    discord-sync.yml        Daily Discord → Firestore data sync
  instructions/
    copilot-review.instructions.md  Project-specific Copilot review rules
```

---

## Admin panel

Navigate to `/admin` and log in with Discord. The server validates that you are a member of the configured Discord guild (`DISCORD_GUILD_ID`).

From the admin panel you can:

- **Current Book** — set title, author, cover, genres, synopsis, Goodreads link, meeting details, Discord thread links, supplemental materials, characters, and story timeline; **Discord Channel Setup** button creates a forum channel with standard tags and starter threads, and optionally moves the previous book's channel to the Finished category (requires `DISCORD_BOT_TOKEN`, `DISCORD_GUILD_ID`, `DISCORD_CURRENT_CATEGORY_ID`)
- **Past Books** — add, edit, and delete past books; set full description, quotes, discussion summary, Discord thread URL, supplemental materials, characters, and story timeline
- **Suggestions** — edit or delete any suggestion; promote a suggestion directly to the current book
- **Members** — map Discord usernames to display names shown across the site
- **Audiobook Server** — configure the Audiobookshelf description and Discord webhook URL for access requests
