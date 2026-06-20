<template>
  <div class="past-books-page">
    <h1 class="page-title">Past Books</h1>

    <!-- Loading state: 6 skeleton cards -->
    <div v-if="loading" class="books-grid">
      <div v-for="n in 6" :key="n" class="skeleton-card">
        <div class="skeleton cover-skeleton" />
        <div class="skeleton-meta">
          <div class="skeleton text-skeleton title-skeleton" />
          <div class="skeleton text-skeleton author-skeleton" />
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="pastBooks.length === 0" class="empty-state">
      <span class="empty-icon">📚</span>
      <p class="empty-text">No past books yet. Check back after your first meeting!</p>
    </div>

    <!-- Books grid -->
    <div v-else class="books-grid">
      <RouterLink
        v-for="book in pastBooks"
        :key="book.id"
        :to="`/past-books/${book.id}`"
        class="book-card"
      >
        <!-- Cover image area -->
        <div class="cover-wrap">
          <img
            v-if="book.coverUrl"
            :src="book.coverUrl"
            :alt="book.title || 'Book cover'"
            class="cover-img"
            loading="lazy"
            @error="e => e.target.style.display = 'none'"
          />
          <div class="cover-placeholder">
            <img src="/book-icon.svg" class="placeholder-book" alt="" />
          </div>

          <!-- Read date badge -->
          <p v-if="book.dateRead" class="book-date">Read {{ formatDate(book.dateRead) }}</p>

          <!-- Genre icon strip -->
          <div v-if="(book.genres || []).length > 0" class="genre-strip">
            <span
              v-for="genre in (book.genres || []).slice(0, 3)"
              :key="genre"
              class="genre-icon"
              :title="genre"
              :aria-label="genre"
            >
              <img v-if="GENRE_ICONS[genre]?.img" :src="GENRE_ICONS[genre].img" :alt="genre" class="genre-icon-img" />
              <template v-else>{{ GENRE_ICONS[genre]?.icon ?? '📖' }}</template>
            </span>
          </div>
        </div>

        <!-- Meta below cover -->
        <div class="book-meta">
          <p class="book-title">{{ book.title }}</p>
          <p class="book-author">{{ book.author }}</p>

          <!-- Genre chips -->
          <div v-if="book.genres && book.genres.length > 0" class="genre-chips">
            <span
              v-for="genre in book.genres"
              :key="genre"
              class="chip"
            >{{ genre }}</span>
          </div>

          <!-- Discord discussion link -->
          <a
            v-if="primaryThreadUrl(book)"
            :href="primaryThreadUrl(book)"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-discord discord-btn"
            title="View Discord Discussion"
            aria-label="View Discord Discussion"
          >
            <img src="/discord-icon.svg" class="discord-btn-icon" alt="" />
            <span class="discord-btn-text">View Discord Discussion →</span>
          </a>
        </div>
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
import { usePastBooks } from '../composables/usePastBooks.js'
import { GENRE_ICONS } from '../utils/genres.js'
import { primaryThreadUrl } from '../utils/discordThreads.js'

const { pastBooks, loading } = usePastBooks()

function formatDate(dateRead) {
  if (!dateRead) return ''
  const d = typeof dateRead.toDate === 'function' ? dateRead.toDate() : new Date(dateRead)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function visibleGenres(book) {
  return (book.genres || []).slice(0, 3)
}
</script>

<style scoped>
.past-books-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-title {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--gold);
  margin: 0;
}

.past-books-page {
  animation: fadeUp 0.45s ease both;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Grid ── */
.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(200px, 44%), 1fr));
  gap: 1.5rem;
}

@media (max-width: 480px) {
  .books-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
}

/* ── Book card ── */
.book-card {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  text-decoration: none;
  color: inherit;
}

/* ── Cover wrap ── */
.cover-wrap {
  position: relative;
  aspect-ratio: 2 / 3;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--surface-subtle);
  border: 1px solid var(--border);
  transition: border-color 0.2s, transform 0.15s;
}

.book-card:hover .cover-wrap {
  border-color: var(--border-hover);
  transform: translateY(-2px);
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--surface), var(--surface-subtle));
}

.placeholder-book {
  width: 52%;
  opacity: 0.55;
  filter: drop-shadow(0 2px 6px rgba(232, 168, 40, 0.35));
}

/* ── Meta below cover ── */
.book-meta {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0 2px;
}

.book-title {
  font-family: var(--font-serif);
  font-size: 0.88rem;
  color: var(--text-primary);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0;
}

.book-author {
  font-family: var(--font-sans);
  font-size: 0.75rem;
  color: var(--text-muted);
  margin: 0;
}

.genre-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.book-date {
  position: absolute;
  top: 0.4rem;
  left: 0.4rem;
  z-index: 3;
  font-family: var(--font-sans);
  font-size: 0.58rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(15, 7, 0, 0.9);
  background: linear-gradient(105deg,
    rgba(130, 88, 8, 1) 0%,
    rgba(210, 162, 30, 1) 30%,
    rgba(255, 218, 70, 0.98) 52%,
    rgba(218, 168, 32, 1) 72%,
    rgba(145, 98, 10, 1) 100%
  );
  border-radius: 100px;
  padding: 0.18rem 0.5rem;
  margin: 0;
  text-shadow: 0 1px 1px rgba(255, 240, 150, 0.3);
  white-space: nowrap;
}

.discord-btn {
  font-size: 0.75rem;
  padding: 0.35rem 0.75rem;
  text-decoration: none;
  align-self: flex-start;
  gap: 0.4rem;
}

.discord-btn-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  filter: brightness(0) invert(1);
}

@media (max-width: 480px) {
  .discord-btn {
    align-self: stretch;
    justify-content: center;
    padding: 0.5rem;
  }

  .discord-btn-text {
    display: none;
  }

  .discord-btn-icon {
    width: 20px;
    height: 20px;
  }
}

/* ── Skeleton loading ── */
.skeleton-card {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.cover-skeleton {
  aspect-ratio: 2 / 3;
  border-radius: var(--radius-sm);
}

.skeleton-meta {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0 2px;
}

.text-skeleton {
  height: 0.85rem;
  border-radius: var(--radius-sm);
}

.title-skeleton {
  width: 85%;
}

.author-skeleton {
  width: 60%;
}

/* ── Empty state ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 4rem 2rem;
  text-align: center;
}

.empty-icon {
  font-size: 3rem;
  opacity: 0.4;
}

.empty-text {
  font-family: var(--font-sans);
  font-size: 1rem;
  color: var(--text-muted);
  margin: 0;
}
</style>
