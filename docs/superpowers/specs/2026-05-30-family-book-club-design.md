# The Family That Reads Together — Design Spec

**Date:** 2026-05-30  
**Status:** Approved

---

## Overview

A family book club website called "The Family That Reads Together." Serves as a central hub replacing scattered Discord messages and Goodreads links. Non-technical family members must be able to update all content through a built-in admin panel. The site has a cozy fantasy aesthetic using an Enchanted Forest color palette (dark forest greens, amber gold accents).

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | Vue 3 + Vite |
| Styling | Plain CSS (no component library) |
| Backend / Database | Firebase Firestore |
| Auth | Firebase Auth + Discord OAuth2 |
| Hosting | Firebase Hosting |

**Why this stack:** The user is comfortable with Vue. Firebase handles auth and data in one place with a generous free tier. Discord OAuth is a natural fit since the whole family already uses the family Discord server — access control is tied to server membership, no separate passwords needed.

---

## Authentication

- **Discord OAuth** for admin login only. Family members click "Login with Discord," authorize, and are granted admin access if they are a member of the configured family Discord server (checked via Discord API on login).
- A Firebase Cloud Function bridges Discord OAuth → Firebase custom token.
- The public site (all non-admin pages) requires no login.
- A single Firestore document stores the configured Discord Guild ID used for membership checks.

---

## Pages & Routes

| Route | Page | Auth |
|-------|------|------|
| `/` | Dashboard | Public |
| `/suggestions` | Full Suggestions List | Public |
| `/past-books` | Past Books Archive | Public |
| `/admin` | Admin Panel | Discord login required |

---

## Page Designs

### `/` — Dashboard

**Hero section (full width):**
- Book cover image (auto-fetched from Google Books API by title + author; admin can override with a custom URL)
- "Now Reading" eyebrow label
- Title, author, genre chips
- Short synopsis
- "Discussion Thread" button → links to Discord thread URL for this book
- "View on Goodreads" button → links to Goodreads page for this book
- **Meeting info card** (right side of hero, one meeting per book):
  - Date and time
  - Location (text, e.g. "Mom & Dad's")
  - "Via Discord voice" label
  - "Join Voice" button → links to Discord voice channel

**Dashboard grid (3-column on desktop, 1-column on mobile):**

1. **Top Suggestions** (wide column, 2fr):
   - Shows top 3 suggestions ranked by vote count
   - Each row: rank number, small cover thumbnail, title, author, genre chip, vote count
   - "23 total suggestions" count + "View all & filter →" link to `/suggestions`
   - "+ Suggest" link (opens suggestion form modal)

2. **Past Books** (1fr):
   - List of most recent 3 past books: small cover, title, author, date read, "💬 Discord thread →" link
   - "View all →" link to `/past-books`

3. **Audiobook Server** (1fr):
   - Explanation of the family Audiobookshelf server
   - "Sign in →" link for existing users
   - "Request Access →" button: opens a small form (name + optional message) that POSTs to a configured Discord webhook, sending the request to a designated channel

**Footer:** Discord Server link · Goodreads Group link · Audiobookshelf Server link

---

### `/suggestions` — Full Suggestions List

**"I am" selector (top of page):**
A simple dropdown of family member names (stored in Firestore config, editable in admin). Selection is persisted in `localStorage`. Enables the "I haven't read" filter. No login required.

**Toolbar:**
- Filter chips: All / Not read by anyone / I haven't read (hidden if no name selected)
- Genre dropdown (Fantasy, Sci-Fi, Mystery, Historical, etc.)
- Sort dropdown: Most votes / Newest / A–Z
- "+ Suggest a book" action
- View toggle: **Cover view** ⊞ / **List view** ☰

**Cover view (default):**
- Grid of book covers, `minmax(160px, 1fr)`
- Each cover card:
  - Cover image (full 2:3 aspect ratio card, fetched from Google Books API or uploaded)
  - Vote badge overlay (top-left): amber border, "▲ N"
  - "N read" badge overlay (top-right, only shown if ≥1 family member has read it): green border
  - Genre icon strip (bottom, gradient fade): emoji icons with tooltip labels on hover
  - Below the cover: title, author

**List view:**
- Horizontal cards: narrow cover thumbnail on the left, then title, author, description, genre chips, "Read by: Name, Name" — vote button on the right

**Suggestion form (modal):**
- Book title (required)
- Author (required)
- Genre tags (multi-select from predefined list)
- Short description (required, 1–3 sentences)
- "I've already read this" checkbox (adds the submitter's name to the "already read" list)
- Submitter name (required, free text — no login needed to suggest)
- Submit button saves to Firestore

**Voting:**
- Any visitor can upvote a suggestion (one vote per browser session, tracked via localStorage)
- Vote count stored in Firestore, updated in real time

---

### `/past-books` — Past Books Archive

- Grid or list of all past books the club has read, sorted newest first
- Each entry: cover image, title, author, genre chips, date read, "💬 View Discord Discussion →" link
- No pagination needed initially (add if list grows large)

---

### `/admin` — Admin Panel

Protected by Discord login. Sections:

**Current Book:**
- Set title, author, genre tags, synopsis — cover fetched automatically from Google Books API; admin can paste a custom URL to override
- Set Goodreads URL and Discord discussion thread URL
- Set meeting: date, time, location, Discord voice URL

**Archive a Book:**
- One-click "Move to Past Books" — takes the current book and appends it to the past books list, then clears the current book fields

**Past Books:**
- List of past books with edit / delete per entry
- Manually add a past book (for books read before the site existed)

**Suggestions:**
- Table of all suggestions with vote counts
- Admin can delete a suggestion (e.g. duplicates)
- Admin can mark a suggestion as "selected" to promote it to Current Book

**Audiobook Server:**
- Edit the server description text shown on the dashboard
- Edit the Audiobookshelf server URL shown in the footer

---

## Data Model (Firestore)

```
/config
  currentBook: {
    title, author, coverUrl, genres[], synopsis,
    goodreadsUrl, discordThreadUrl,
    meeting: { date, time, location, discordVoiceUrl }
  }
  audiobookServer: { description, url }
  discordGuildId: string
  discordServerId: string
  goodreadsGroupUrl: string
  audiobookServerUrl: string
  familyMembers: string[]    // names shown in "I am" dropdown on /suggestions
  discordWebhookUrl: string  // for audiobook access requests

/suggestions (collection)
  {
    title, author, coverUrl, genres[],
    description, suggestedBy,
    alreadyRead: string[],   // family member names
    votes: number,
    createdAt: timestamp
  }

/pastBooks (collection)
  {
    title, author, coverUrl, genres[],
    dateRead: timestamp,
    discordThreadUrl
  }
```

---

## Visual Design

**Palette:**
| Role | Color |
|------|-------|
| Page background | `#111d14` |
| Surface (cards) | `#1a2d1f` |
| Subtle surface | `#0f1f12` |
| Border | `#2d5a35` |
| Border hover | `#4a8a52` |
| Accent (nav, buttons) | `#2d5a35` |
| Gold (titles, highlights) | `#c8963c` |
| Text primary | `#c8e6c9` |
| Text secondary | `#a8c4a8` |
| Text muted | `#7a9c7a` / `#5a8a5a` |
| Discord blue | `#5865F2` |

**Typography:** Georgia / Times New Roman serif for headings and book titles; system sans-serif for UI labels, metadata, and body text.

**Motion:** Subtle `translateY(-3px)` lift + border color change on card hover. No heavy animations.

**Responsive:** 3-column dashboard grid collapses to 1 column on mobile. Cover grid uses `auto-fill` with `minmax(160px, 1fr)` — naturally wraps on smaller screens. Hero stacks vertically on mobile.

---

## Integrations

| Service | How Used |
|---------|----------|
| Discord | OAuth login for admin; links to discussion threads and voice channels |
| Goodreads | Link only (no API — Goodreads API is deprecated) |
| Audiobookshelf | Link only (URL stored in Firestore config) |
| Google Books API | Fetch cover images by ISBN or title+author search (no API key required for basic use) |

---

## Out of Scope

- In-site discussion (discussions happen on Discord)
- User accounts for non-admin visitors (voting is anonymous via localStorage)
- Email notifications
- Book ratings
- Reading progress tracking
