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

## Project structure

```
src/
  pages/
    DashboardPage.vue       Home — current book hero, meeting card, top suggestions, widgets
    BookPage.vue            Current book detail — synopsis, characters, timeline, spoiler filter
    SuggestionsPage.vue     Browse and vote on book suggestions
    PastBooksPage.vue       Grid of all past books
    PastBookDetailPage.vue  Past book detail — synopsis, characters, timeline, spoiler filter
    AdminPage.vue           Admin panel (requires Discord login)
    ChangelogPage.vue       Public changelog
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
      SupplementalMaterials.vue
      DiscordThreads.vue
    dashboard/
      HeroSection.vue
      MeetingCard.vue
      TopSuggestions.vue
      PastBooksWidget.vue
      AudiobookWidget.vue   Audiobookshelf access request form
    suggestions/
      SuggestionsToolbar.vue  Filter, sort, view toggle, genre picker
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
```

---

## Admin panel

Navigate to `/admin` and log in with Discord. The server validates that you are a member of the configured Discord guild (`DISCORD_GUILD_ID`).

From the admin panel you can:

- **Current Book** — set title, author, cover, genres, synopsis, Goodreads link, meeting details, Discord thread links, supplemental materials, characters, and story timeline; **Discord Channel Setup** button creates a forum channel with standard tags and starter threads, and optionally moves the previous book's channel to the Finished category (requires `DISCORD_BOT_TOKEN`, `DISCORD_GUILD_ID`, `DISCORD_CURRENT_CATEGORY_ID`)
- **Past Books** — add, edit, and delete past books; same fields as current book plus date read
- **Suggestions** — edit or delete any suggestion; promote a suggestion directly to the current book
- **Members** — map Discord usernames to display names shown across the site
- **Audiobook Server** — configure the Audiobookshelf description and Discord webhook URL for access requests
