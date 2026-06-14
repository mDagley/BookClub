<template>
  <div class="changelog-page">
    <h1 class="page-title">Changelog</h1>
    <p class="page-subtitle">What's new in the family book club.</p>

    <div class="releases">
      <section v-for="release in releases" :key="release.date + release.label" class="release card">
        <div class="release-header">
          <span class="release-date">{{ release.date }}</span>
          <span v-if="release.label" class="release-label">{{ release.label }}</span>
        </div>
        <ul class="entry-list">
          <li v-for="(entry, i) in release.entries" :key="i" class="entry">
            <span class="entry-badge" :class="`badge-${entry.type}`">
              {{ entry.type === 'feature' ? 'New' : 'Fix' }}
            </span>
            <span class="entry-text">{{ entry.text }}</span>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup>
const releases = [
  {
    date: 'June 2026',
    entries: [
      { type: 'feature', text: 'Admin can now create a Discord channel for a new book in one click — sets up forum tags (General, Characters, Background, Spoilers, chapter ranges) and creates starter threads automatically. Optionally moves the previous book\'s channel to the Finished category.' },
      { type: 'fix',     text: '"I haven\'t read" filter now correctly hides books you\'ve marked as read via the read button, not just ones set through the admin panel.' },
      { type: 'feature', text: 'Spoiler filter on past book pages — set your current chapter to hide characters and timeline events you haven\'t reached yet.' },
      { type: 'feature', text: 'Current book page now hides all characters and timeline events by default. Enter your chapter number to reveal content up to that point.' },
      { type: 'feature', text: 'Gideon the Ninth character list and full story timeline added to the current book page.' },
    ],
  },
  {
    date: 'May 2026',
    label: 'Discord & Past Books',
    entries: [
      { type: 'feature', text: 'Past book pages now pull their Discord discussion thread directly from the server, so you can jump straight to the conversation.' },
      { type: 'feature', text: 'Goodreads links on the current book page and all past book pages.' },
      { type: 'feature', text: 'Admin can now set character lists, story timelines, and supplemental reading materials for any past book.' },
      { type: 'feature', text: 'Discord notification sent to the server whenever a new book is suggested.' },
      { type: 'fix',     text: 'Discord handles now resolve to display names everywhere — in the "Read by" list, admin table, and top suggestions.' },
    ],
  },
  {
    date: 'April 2026',
    label: 'Suggestions Upgrades',
    entries: [
      { type: 'feature', text: '"I am…" selector auto-fills from your Discord login so the "I haven\'t read" filter works right away.' },
      { type: 'feature', text: 'Book title autocomplete in the suggest form and admin panel — pulls metadata from Google Books automatically.' },
      { type: 'feature', text: 'Filter suggestions by genre using a multi-select chip panel.' },
      { type: 'feature', text: 'Sort suggestions by most votes, newest, or A–Z.' },
      { type: 'feature', text: '"I haven\'t read" filter — select your name and see only books you haven\'t marked as read.' },
      { type: 'feature', text: 'Comments panel — click the chat bubble on any suggestion to read and post comments.' },
      { type: 'feature', text: 'Upvote and downvote suggestions. Voting requires Discord login.' },
      { type: 'feature', text: 'Mark suggestions as already read. Your name appears in the "Read by" tooltip.' },
      { type: 'feature', text: 'Cover images can be uploaded directly from the suggest form and admin panel.' },
      { type: 'fix',     text: 'Placeholder covers from Google Books are now detected and swapped for a real cover from Open Library when available.' },
    ],
  },
  {
    date: 'March 2026',
    label: 'Launch',
    entries: [
      { type: 'feature', text: 'Dashboard with the current book, upcoming meeting details, top suggestions, and a Discord access request widget.' },
      { type: 'feature', text: 'Current book page with synopsis, characters, story timeline, spoiler filter, and supplemental reading materials.' },
      { type: 'feature', text: 'Suggestions page — browse all book suggestions in grid or list view.' },
      { type: 'feature', text: 'Past books gallery with detail pages for every book the club has read.' },
      { type: 'feature', text: 'Admin panel — manage the current book, suggestions, past books, member profiles, and the audiobook server.' },
      { type: 'feature', text: 'Discord login — sign in with Discord to vote, suggest books, and mark books as read.' },
      { type: 'feature', text: 'Audiobookshelf widget on the dashboard with a one-click access request form.' },
      { type: 'feature', text: 'Member profiles — maps Discord usernames to display names across the whole site.' },
      { type: 'feature', text: 'Fantasy forest theme with custom genre icons, book art, and gold/midnight-blue color palette.' },
    ],
  },
]
</script>

<style scoped>
.changelog-page {
  max-width: 760px;
  margin: 0 auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-title {
  font-family: var(--font-serif);
  font-size: 2rem;
  color: var(--gold);
  line-height: 1.2;
}

.page-subtitle {
  font-family: var(--font-sans);
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-top: -0.75rem;
}

.releases {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.release-header {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  margin-bottom: 0.85rem;
}

.release-date {
  font-family: var(--font-serif);
  font-size: 1.1rem;
  color: var(--text-primary);
}

.release-label {
  font-family: var(--font-sans);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-dim);
}

.entry-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.entry {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  font-size: 0.88rem;
  line-height: 1.5;
}

.entry-badge {
  flex-shrink: 0;
  font-family: var(--font-sans);
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 0.1rem 0.45rem;
  border-radius: 10px;
  border: 1px solid;
}

.badge-feature {
  border-color: #5865F2;
  color: #8891f7;
}

.badge-fix {
  border-color: #7ab87a;
  color: #7ab87a;
}

.entry-text {
  color: var(--text-secondary);
}
</style>
