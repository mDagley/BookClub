<template>
  <div class="past-book-detail">
    <!-- Back link -->
    <RouterLink to="/past-books" class="back-link">← Past Books</RouterLink>

    <div v-if="loading" class="detail-loading">
      <div class="skeleton" style="height: 300px; border-radius: var(--radius-md);" />
    </div>

    <div v-else-if="!book" class="detail-empty">
      <p>Book not found.</p>
      <RouterLink to="/past-books" class="btn">Back to Past Books</RouterLink>
    </div>

    <template v-else>
      <!-- Header -->
      <section class="book-header card">
        <div class="cover-area">
          <img
            v-if="book.coverUrl"
            :src="book.coverUrl"
            :alt="book.title"
            class="cover-img"
          />
          <div v-else class="cover-placeholder">
            <img src="/book-icon.svg" class="placeholder-book" alt="" />
          </div>
        </div>

        <div class="book-info">
          <div class="genre-chips">
            <span v-for="g in book.genres" :key="g" class="chip">{{ g }}</span>
          </div>
          <h1 class="book-title">{{ book.title }}</h1>
          <p class="book-author">{{ book.author }}</p>
          <p class="book-date">Read in {{ formatDate(book.dateRead) }}</p>

          <p v-if="book.synopsis" class="book-synopsis">{{ book.synopsis }}</p>

          <div class="book-actions">
            <a
              v-if="book.goodreadsUrl"
              :href="book.goodreadsUrl"
              target="_blank"
              rel="noopener"
              class="btn"
            >View on Goodreads</a>
            <a
              v-if="book.discordThreadUrl"
              :href="book.discordThreadUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="btn btn-discord"
            >💬 View Discord Discussion →</a>
          </div>
        </div>
      </section>

      <!-- Full description -->
      <section v-if="book.fullDescription" class="card description-section">
        <p class="section-title">About the Book</p>
        <p class="description-text">{{ book.fullDescription }}</p>
      </section>

      <!-- Supplemental materials -->
      <section v-if="book.supplementalMaterials?.length" class="card">
        <p class="section-title">Supplemental Materials</p>
        <ul class="materials-list">
          <li v-for="m in book.supplementalMaterials" :key="m.url" class="material-row">
            <span class="type-badge" :class="`type-${m.type}`">{{ m.type }}</span>
            <a :href="m.url" target="_blank" rel="noopener" class="material-link">{{ m.title }}</a>
          </li>
        </ul>
      </section>

      <!-- Characters -->
      <section v-if="book.characters?.length" class="card">
        <p class="section-title">Characters</p>
        <div class="character-grid">
          <div v-for="char in sortedCharacters" :key="char.name" class="character-card">
            <p class="char-name">{{ char.name }}</p>
            <p class="char-desc">{{ char.description }}</p>
            <p class="char-chapter">Introduced in Chapter {{ char.firstAppearanceChapter }}</p>
          </div>
        </div>
      </section>

      <!-- Timeline -->
      <section v-if="book.timeline?.length" class="card">
        <p class="section-title">Timeline</p>
        <div class="timeline">
          <div
            v-for="(group, gi) in groupedTimeline"
            :key="gi"
          >
            <div class="chapter-divider">Chapter {{ group.chapter }}</div>
            <div v-for="event in group.events" :key="event.label" class="timeline-item">
              <div class="timeline-marker">
                <span class="timeline-dot" />
              </div>
              <div class="timeline-content">
                <p class="timeline-label">{{ event.label }}</p>
                <p v-if="event.note" class="timeline-note">{{ event.note }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { usePastBooks } from '../composables/usePastBooks.js'

const route = useRoute()
const { pastBooks, loading } = usePastBooks()

const book = computed(() => pastBooks.value.find(b => b.id === route.params.id) ?? null)

function formatDate(dateRead) {
  if (!dateRead) return ''
  const d = typeof dateRead.toDate === 'function' ? dateRead.toDate() : new Date(dateRead)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

const sortedCharacters = computed(() => {
  if (!book.value?.characters) return []
  return [...book.value.characters].sort((a, b) => {
    if (a.isMajor && !b.isMajor) return -1
    if (!a.isMajor && b.isMajor) return 1
    return (a.firstAppearanceChapter ?? 0) - (b.firstAppearanceChapter ?? 0)
  })
})

const groupedTimeline = computed(() => {
  if (!book.value?.timeline) return []
  const sorted = [...book.value.timeline].sort((a, b) => (a.chapter ?? 0) - (b.chapter ?? 0))
  const groups = []
  let lastChapter = null
  for (const event of sorted) {
    if (event.chapter !== lastChapter) {
      groups.push({ chapter: event.chapter, events: [] })
      lastChapter = event.chapter
    }
    groups[groups.length - 1].events.push(event)
  }
  return groups
})
</script>

<style scoped>
.past-book-detail {
  max-width: 900px;
  margin: 0 auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.back-link {
  color: var(--text-muted);
  font-family: var(--font-sans);
  font-size: 0.85rem;
  text-decoration: none;
}
.back-link:hover { color: var(--gold); }

.detail-loading,
.detail-empty {
  text-align: center;
  padding: 4rem 1.5rem;
}

.book-header {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
}

.cover-area { flex-shrink: 0; }

.cover-img {
  width: 160px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  display: block;
}

.cover-placeholder {
  width: 160px;
  aspect-ratio: 2/3;
  background: var(--surface-subtle);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-book {
  width: 60%;
  opacity: 0.55;
  filter: drop-shadow(0 2px 8px rgba(232, 168, 40, 0.35));
}

.book-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.genre-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.book-title {
  font-family: var(--font-serif);
  font-size: 1.8rem;
  color: var(--gold);
  line-height: 1.2;
}

.book-author {
  font-family: var(--font-sans);
  font-size: 0.95rem;
  color: var(--text-secondary);
}

.book-date {
  font-family: var(--font-sans);
  font-size: 0.85rem;
  color: var(--text-muted);
  font-style: italic;
}

.book-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  align-items: center;
  margin-top: 0.25rem;
}

.book-synopsis {
  color: var(--text-secondary);
  line-height: 1.7;
  font-size: 0.95rem;
}

.description-section .description-text {
  color: var(--text-secondary);
  line-height: 1.8;
  font-size: 0.95rem;
  white-space: pre-line;
}

.materials-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.material-row { display: flex; align-items: center; gap: 0.6rem; }
.type-badge {
  font-family: var(--font-sans);
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 0.15rem 0.45rem;
  border-radius: 10px;
  border: 1px solid var(--border);
  color: var(--text-muted);
  white-space: nowrap;
}
.type-article  { border-color: #5865F2; color: #8891f7; }
.type-video    { border-color: #c8963c; color: var(--gold); }
.type-podcast  { border-color: #7ab87a; color: #7ab87a; }
.type-map      { border-color: #4a8a52; color: #7ab87a; }
.material-link { font-size: 0.9rem; color: var(--text-primary); text-decoration: none; }
.material-link:hover { color: var(--gold); text-decoration: underline; }

.character-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
}
.character-card {
  background: var(--surface-subtle);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.char-name { font-family: var(--font-serif); font-size: 0.95rem; color: var(--gold); }
.char-desc { font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5; }
.char-chapter { font-family: var(--font-sans); font-size: 0.7rem; color: var(--text-dim); margin-top: auto; }

.timeline { display: flex; flex-direction: column; position: relative; }
.timeline::before {
  content: '';
  position: absolute;
  left: 6px; top: 12px; bottom: 12px;
  width: 1px;
  background: var(--border);
}
.chapter-divider {
  font-family: var(--font-sans);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-dim);
  padding: 0.5rem 0 0.25rem 1.5rem;
}
.timeline-item { display: flex; gap: 1rem; padding-bottom: 1.25rem; position: relative; }
.timeline-marker { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; padding-top: 3px; }
.timeline-dot {
  width: 13px; height: 13px;
  border-radius: 50%;
  background: var(--border-hover);
  border: 2px solid var(--surface);
  z-index: 1;
}
.timeline-content { flex: 1; display: flex; flex-direction: column; gap: 0.2rem; }
.timeline-label { font-size: 0.9rem; color: var(--text-primary); line-height: 1.4; }
.timeline-note { font-size: 0.8rem; color: var(--text-secondary); line-height: 1.5; }

@media (max-width: 640px) {
  .book-header { flex-direction: column; }
  .cover-img { width: 120px; }
  .book-title { font-size: 1.4rem; }
}
</style>
