# BookClub — Claude Context

Family book club web app for tracking current/past books, managing suggestions, and voting.

## Architecture

**Frontend:** Vue 3 (Composition API, `<script setup>`) + Vite  
**Backend:** Express.js server (`server/index.js`) — serves the built SPA and exposes API routes  
**Database:** Firebase Firestore (realtime listeners via `onSnapshot`)  
**Auth:** Discord OAuth via Firebase custom tokens (server exchanges Discord code → Firebase token)  
**Deployment:** Docker multi-stage build on Easy Panel; all `VITE_*` vars passed as build args  
**Cover storage:** Server-side via `POST /api/upload` (multer), saved to `/app/public/covers/`, served at `/covers/`. Easy Panel mounts a persistent volume at `/app/public/covers/`.

## Worktree Workflow

Active development happens in a git worktree at:
- **Worktree:** `C:\Users\panda\Claude\BookClub\.claude\worktrees\implement\` (branch: `worktree-implement`)
- **Main repo:** `C:\Users\panda\Claude\BookClub\` (branch: `master`)

Work in the worktree, commit there, then cherry-pick commits to master.

## Project Structure

```
src/
  pages/           DashboardPage, BookPage, SuggestionsPage, PastBooksPage, PastBookDetailPage, AdminPage
  components/
    admin/         AdminCurrentBook, AdminSuggestions, AdminPastBooks, AdminAudiobook, AdminMembers
    suggestions/   CoverCard, CoverGrid, ListView, SuggestModal, SuggestionsToolbar, CommentPanel
    shared/        CoverUpload (cover image upload component)
    dashboard/     HeroSection, TopSuggestions, MeetingCard, PastBooksWidget, AudiobookWidget
    book/          CharacterGrid, TimelineSection, SupplementalMaterials, SpoilerFilter, DiscordThreads
    layout/        AppNav, AppFooter
  composables/     useSuggestions, usePastBooks, useConfig, useVoting, useComments, useMemberProfiles
  utils/           googleBooks.js, genres.js, uploadCover.js
  stores/          auth.js
  router/          index.js
server/
  index.js         Express: /api/discord-auth, /api/send-webhook, /api/upload, static SPA + /covers serve
```

## Routes

| Path | Page |
|------|------|
| `/` | Dashboard |
| `/book` | Current book detail |
| `/suggestions` | Suggestion voting page |
| `/past-books` | Past books grid |
| `/past-books/:id` | Past book detail page |
| `/admin` | Admin panel (requires Discord auth) |

## Key Technical Details

### Firestore Collections
- `config/main` — app config: `currentBook`, `audiobookServer`, `familyMembers`, `memberProfiles`, `discordWebhookUrl`, `discordGuildId`
- `suggestions` — sorted by `votes DESC, createdAt DESC` (requires composite index)
  - Fields: `title, author, genres, description, publishedDate, coverUrl, suggestedBy, votes, votedUsers, alreadyRead, createdAt`
  - `votedUsers` — `{ [uid]: 1 | -1 }` for auth-based bidirectional voting
  - `alreadyRead` — array of Discord handles who have read the book
  - Subcollection `comments/{id}` — `{ userId, displayName, avatarUrl, content, createdAt }`
- `pastBooks` — historical books with synopsis, characters, timeline, supplemental materials

### Auth Flow
1. "Login with Discord" button in AppNav (top-right) saves current path to `sessionStorage.loginReturnTo`, then redirects to Discord OAuth
2. Discord redirects back to `/admin?code=...`
3. `AdminPage.vue` exchanges the code via `POST /api/discord-auth`
4. Server creates a Firebase custom token with claims: `discordId`, `discordUsername`, `discordAvatar`
5. Client signs in with the token; `onAuthStateChanged` calls `getIdTokenResult()` to read the claims (NOTE: `firebaseUser.displayName` is NOT set for custom-token users — always use ID token claims)
6. After login, AdminPage redirects to `sessionStorage.loginReturnTo` if set
7. Auth state: `useAuthStore` exposes `user.uid`, `user.discordUsername`, `user.photoURL`

### Member Profiles
- `config/main.memberProfiles` — array of `{ name: "Melissa", handle: "melly2024" }` entries
- Maps Discord handles → display names for all "already read" displays across the app
- Admin UI: **Admin → Members** tab (AdminMembers.vue)
- `useMemberProfiles()` composable — builds a handle→name map, exposes `resolveName(handle)` and `resolveNames(handles[])`
- Used in: CoverCard read badge tooltip, ListView "Read by:", TopSuggestions read chip

### Voting System
- Requires Discord login; buttons are disabled (not hidden) when logged out
- `useSuggestions.voteOnSuggestion(id, uid, direction)` — Firestore transaction updating `votedUsers[uid]` and net `votes` counter
- Direction `1` = upvote, `-1` = downvote; same direction again toggles off
- Available on: CoverCard (▲/count/▼ at top-left of cover image), ListView vote column, TopSuggestions card rows

### Mark as Read
- Logged-in users toggle their Discord handle in a suggestion's `alreadyRead` array
- `useSuggestions.toggleAlreadyRead(id, username, isCurrentlyRead)` — `arrayUnion` / `arrayRemove`
- CoverCard: "Mark as read" / "✓ I've read this" text button in `cover-meta` (always visible, grayed when logged out)
- ListView: same button always visible in each row
- TopSuggestions: text button inside the suggestion-info column below genre badges
- SuggestModal: "I've already read this" checkbox uses auth Discord username

### Comments
- `useComments(suggestionId)` — realtime listener on `suggestions/{id}/comments` subcollection
- `CommentPanel.vue` — slide-in right panel, requires login to post, own comments deletable
- Opened via 💬 hover button on CoverCard (bottom-right, grid view)
- Panel state managed at `SuggestionsPage` level (`commentSuggestion` ref)

### Google Books / Cover Images
`fetchBookMetadata(title, author)` in `src/utils/googleBooks.js`:
- Fetches from Google Books first, Open Library as fallback; merges best data from both
- Returns: `coverUrl`, `synopsis`, `fullDescription`, `genres`, `publishedDate`
- **Placeholder detection:** Google's generic "no cover" image is ≤128px wide at any zoom. After getting a cover URL, it's loaded in a hidden `Image` element; if `naturalWidth ≤ 128 && naturalHeight ≤ 200`, the URL is discarded so Open Library's cover is used instead
- `publishedDate` formatted as "March 2021" (month + year) in CoverCard, AdminSuggestions

### Cover Upload
`CoverUpload.vue` → `uploadCoverImage()` in `src/utils/uploadCover.js` → `POST /api/upload` (multer) → saved to `/app/public/covers/` → returns `{ url: '/covers/filename' }`.  
Used in: SuggestModal, AdminSuggestions (edit), AdminCurrentBook, AdminPastBooks (edit + add).  
Firebase Storage fully removed.

### TopSuggestions Dashboard Card
Shows top 3 suggestions with: cover thumbnail, title, author, description (2-line clamp), all genres, "X read" chip, "Mark as read" text button, ▲/▼ vote buttons. All interactive features require Discord login (disabled otherwise). Receives `uid`, `authUsername`, `voteOnSuggestion`, `toggleAlreadyRead` props from `DashboardPage`.

### Audiobook Server
- `AudiobookWidget.vue` on dashboard — shows description, "Sign in" link, "Request Access" form
- Request POSTs to `/api/send-webhook` → Discord webhook from `config/main.discordWebhookUrl`
- Configure via Admin → Audiobook Server tab

### Environment Variables
**Local:** `.env` (not committed)  
**Production:** Build args in Easy Panel

| Variable | Purpose |
|----------|---------|
| `VITE_FIREBASE_API_KEY` | Firebase client config |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase client config |
| `VITE_FIREBASE_PROJECT_ID` | Firebase client config |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase client config (auth domain only, Storage not used) |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase client config |
| `VITE_FIREBASE_APP_ID` | Firebase client config |
| `VITE_DISCORD_CLIENT_ID` | Discord OAuth app ID |
| `VITE_DISCORD_REDIRECT_URI` | Discord OAuth redirect (must be `{origin}/admin`) |
| `VITE_GOOGLE_BOOKS_API_KEY` | Google Books API |
| `FIREBASE_SERVICE_ACCOUNT` | Base64-encoded service account JSON (server only) |
| `DISCORD_CLIENT_ID` | Discord OAuth (server only) |
| `DISCORD_CLIENT_SECRET` | Discord OAuth (server only) |

## CSS / Styling Notes
- `src/styles/base.css` — `:root { font-size: 17px }` for readability; all sizing is rem-based
- Genre icon tooltips: native `title` attribute only — CSS `::after` tooltips were removed because `overflow: hidden` on cover containers clips them
- CoverCard hover reveals: 💬 comments button (bottom-right of cover image)
- Mark-as-read is always visible text below the card (not hover-dependent)

## Firestore Indexes
Suggestions require a composite index: `votes DESC, createdAt DESC`  
(Firebase will show a console error link to create it if missing)
