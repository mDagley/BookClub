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
    admin/         AdminCurrentBook, AdminSuggestions, AdminPastBooks, AdminAudiobook
    suggestions/   CoverCard, CoverGrid, ListView, SuggestModal, SuggestionsToolbar, CommentPanel
    shared/        CoverUpload (cover image upload component)
    dashboard/     HeroSection, TopSuggestions, MeetingCard, PastBooksWidget, AudiobookWidget
    book/          CharacterGrid, TimelineSection, SupplementalMaterials, SpoilerFilter, DiscordThreads
    layout/        AppNav, AppFooter
  composables/     useSuggestions, usePastBooks, useConfig, useVoting, useComments, useAuthStore (Pinia)
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
- `config/main` — app config (current book, discord webhook URL, discord guild ID, audiobookServer, familyMembers)
- `suggestions` — book suggestions; sorted by `votes DESC, createdAt DESC` (requires composite index)
  - Each doc has: `title, author, genres, description, publishedDate, coverUrl, suggestedBy, votes, votedUsers, alreadyRead, createdAt`
  - `votedUsers` — map of `{ [uid]: 1 | -1 }` for auth-based voting
  - `alreadyRead` — array of Discord usernames who have read the book
  - Subcollection `comments/{id}` — `{ userId, displayName, avatarUrl, content, createdAt }`
- `pastBooks` — historical books with synopsis, characters, timeline, supplemental materials

### Auth Flow
1. User clicks "Login with Discord" in admin panel
2. Frontend redirects to Discord OAuth with `VITE_DISCORD_CLIENT_ID`
3. Discord redirects back to `/admin?code=...`
4. `AdminPage.vue` POSTs code to `/api/discord-auth`
5. Server exchanges code for Discord user, checks guild membership, creates Firebase custom token
6. Frontend signs in with the custom token → `auth.currentUser` populated
7. Auth state available via `useAuthStore` — `user.uid`, `user.discordUsername`, `user.photoURL`

### Voting System
- Auth-based: requires Discord login; vote buttons are disabled (not hidden) when not logged in
- `useSuggestions.voteOnSuggestion(id, uid, direction)` — Firestore transaction updating `votedUsers[uid]` and net `votes` counter
- Direction `1` = upvote, `-1` = downvote; same direction again toggles off
- `CoverCard` shows ▲ / count / ▼ stacked at top-left of cover; `ListView` shows same in the vote column

### Mark as Read
- Logged-in users can toggle their Discord username in a suggestion's `alreadyRead` array
- `useSuggestions.toggleAlreadyRead(id, username, isCurrentlyRead)` — uses `arrayUnion` / `arrayRemove`
- `CoverCard`: hover-revealed 📖 button at bottom-left; green ✓ when marked
- `ListView`: always-visible button in the row
- `SuggestModal`: "I've already read this" checkbox uses auth Discord username

### Comments
- `useComments(suggestionId)` — realtime listener on `suggestions/{id}/comments` subcollection
- `CommentPanel.vue` — slide-in right panel, requires login to post, own comments deletable
- Opened from the 💬 hover button on CoverCard (grid view only for now)
- Panel state managed at `SuggestionsPage` level (`commentSuggestion` ref)

### Cover Images
`CoverUpload.vue` calls `uploadCoverImage()` from `src/utils/uploadCover.js`.  
Upload POSTs multipart to `/api/upload` → Express saves to `/app/public/covers/` → returns `{ url: '/covers/filename' }`.  
Used in: SuggestModal, AdminSuggestions (edit), AdminCurrentBook, AdminPastBooks (edit + add).  
Firebase Storage is fully removed from the project.

### Published Date
`fetchBookMetadata()` returns `publishedDate` (e.g. `"2021-03-15"`). Stored on suggestion docs.  
Displayed formatted (e.g. "March 2021") on CoverCard below author, in AdminSuggestions table, and editable in admin inline edit form.

### Genre System
16 genres defined in `src/utils/genres.js`. Fantasy, SciFi, Horror, Mystery have custom PNG icons in `public/genres/`. Others use emoji. Genre detection in `googleBooks.js` scans both API categories and description text.

### Google Books Integration
`src/utils/googleBooks.js` — `fetchBookMetadata(title, author)` returns:
- `coverUrl`, `synopsis`, `fullDescription`, `genres`, `publishedDate`
- Falls back to Open Library if Google Books fails

### Audiobook Server
- `AudiobookWidget.vue` on dashboard — shows description, "Sign in" link, and "Request Access" form
- Request Access POSTs name + message to `/api/send-webhook` → server fetches webhook URL from `config/main.discordWebhookUrl` and sends to Discord
- Admin configures webhook URL and server URL via Admin → Audiobook Server tab

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
| `VITE_DISCORD_REDIRECT_URI` | Discord OAuth redirect (e.g. `http://localhost:5199/admin`) |
| `VITE_GOOGLE_BOOKS_API_KEY` | Google Books API |
| `FIREBASE_SERVICE_ACCOUNT` | Base64-encoded service account JSON (server only) |
| `DISCORD_CLIENT_ID` | Discord OAuth (server only) |
| `DISCORD_CLIENT_SECRET` | Discord OAuth (server only) |

## CSS / Styling Notes
- `src/styles/base.css` — `:root { font-size: 17px }` (set for readability for older family members; all sizing is rem-based so this scales everything)
- `src/styles/components.css` — component-level styles
- Genre icon tooltips: CSS `::after` pseudo-element tooltips were removed because `overflow: hidden` on the cover container clips them. Native `title` attribute tooltips remain.
- Hover overlays on `CoverCard.vue` show book description on hover (`.hover-overlay` fades in)
- CoverCard hover also reveals: 💬 comments button (bottom-right), 📖 mark-as-read toggle (bottom-left)

## Firestore Indexes
Suggestions require a composite index: `votes DESC, createdAt DESC`  
(Firebase will show an error link in the console to create it if missing)
