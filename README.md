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

### 3. Environment variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

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

The Express server also needs these at runtime (not baked into the frontend):

| Variable | Description |
|----------|-------------|
| `DISCORD_CLIENT_ID` | Same Discord Application ID |
| `DISCORD_CLIENT_SECRET` | Discord client secret |
| `FIREBASE_SERVICE_ACCOUNT` | Base64-encoded service account JSON (see below) |
| `PORT` | Server port (default: 3000) |

**Getting `FIREBASE_SERVICE_ACCOUNT`:**
Firebase console → Project Settings → Service accounts → Generate new private key → save the JSON, then encode it:
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("service-account.json")) | clip
```

### 4. Seed the database

```bash
npm install firebase-admin --no-save
node scripts/seed.js
```

Requires `service-account.json` in the project root. Run once to populate `config/main`, sample suggestions, and past books.

### 5. Deploy Firestore rules and indexes

```bash
firebase deploy --only firestore
```

---

## Development

```bash
npm install
npm run dev
```

The frontend runs at `http://localhost:5173`. The `/api/*` routes are only served in production by the Express server. For local API testing, run the server separately:

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
  -t family-book-club .

docker run -p 3000:3000 \
  -e DISCORD_CLIENT_ID=... \
  -e DISCORD_CLIENT_SECRET=... \
  -e FIREBASE_SERVICE_ACCOUNT=... \
  family-book-club
```

### Easy Panel

1. Connect this GitHub repo, branch `worktree-implement`
2. Build method: **Dockerfile**, published port **3000**
3. Set all `VITE_*` values as **build arguments**
4. Set `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `FIREBASE_SERVICE_ACCOUNT`, `PORT=3000` as **environment variables**
5. Add your domain and enable HTTPS
6. Deploy

---

## Project structure

```
src/
  pages/          # DashboardPage, BookPage, SuggestionsPage, PastBooksPage, AdminPage
  components/
    layout/       # AppNav, AppFooter
    dashboard/    # HeroSection, MeetingCard, TopSuggestions, PastBooksWidget, AudiobookWidget
    book/         # SpoilerFilter, DiscordThreads, SupplementalMaterials, CharacterGrid, TimelineSection
    suggestions/  # SuggestionsToolbar, CoverGrid, CoverCard, ListView, SuggestModal
    admin/        # AdminCurrentBook, AdminPastBooks, AdminSuggestions, AdminAudiobook
  composables/    # useConfig, useSuggestions, usePastBooks, useVoting, useSpoilerFilter, useAuth
  stores/         # auth.js (Pinia)
  utils/          # googleBooks.js, genres.js
  styles/         # tokens.css, base.css, components.css
server/
  index.js        # Express: /api/discord-auth, /api/send-webhook, serves dist/
scripts/
  seed.js         # One-time Firestore seed (requires service-account.json)
```

---

## Admin panel

Navigate to `/admin` and log in with Discord. You must be a member of the configured Discord server (set `discordGuildId` in Firestore `config/main` to enforce this, or leave blank to allow any Discord user).

From the admin panel you can:
- Set the current book (title, author, cover, genres, synopsis, meeting details, Discord threads, supplemental materials, characters, timeline)
- Archive the current book to past books
- Manage past books (add, edit, delete)
- Delete suggestions or promote a suggestion to the current book
- Configure the audiobook server description and Discord webhook URL
