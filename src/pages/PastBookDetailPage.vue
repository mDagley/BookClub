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
          </div>
        </div>
      </section>

      <!-- Full description -->
      <section v-if="book.fullDescription" class="card description-section">
        <p class="section-title">About the Book</p>
        <p class="description-text">{{ book.fullDescription }}</p>
      </section>

      <!-- Supplemental materials -->
      <SupplementalMaterials
        v-if="book.supplementalMaterials?.length"
        :materials="book.supplementalMaterials"
      />

      <!-- Discord discussion -->
      <section v-if="book.discordSummary || book.discordThreadUrl" class="book-section card">
        <p class="section-title">Community Discussion</p>
        <p v-if="book.discordSummary" class="discord-summary">{{ book.discordSummary }}</p>
        <a
          v-if="book.discordThreadUrl"
          :href="book.discordThreadUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="discord-thread-link"
        >💬 View Full Discussion on Discord →</a>
      </section>

      <!-- Spoiler filter (only shown when there's character or timeline data) -->
      <SpoilerFilter
        v-if="book.characters?.length || book.timeline?.length"
        :current-chapter="currentChapter"
        @update="currentChapter = $event"
      />

      <CharacterGrid
        v-if="book.characters?.length"
        :characters="book.characters"
        :current-chapter="currentChapter"
        :is-visible="isVisible"
      />

      <TimelineSection
        v-if="book.timeline?.length"
        :timeline="book.timeline"
        :current-chapter="currentChapter"
        :is-visible="isVisible"
      />
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { usePastBooks } from '../composables/usePastBooks.js'
import { useSpoilerFilter } from '../composables/useSpoilerFilter.js'
import SpoilerFilter from '../components/book/SpoilerFilter.vue'
import CharacterGrid from '../components/book/CharacterGrid.vue'
import TimelineSection from '../components/book/TimelineSection.vue'
import SupplementalMaterials from '../components/book/SupplementalMaterials.vue'

const route = useRoute()
const { pastBooks, loading } = usePastBooks()

const book = computed(() => pastBooks.value.find(b => b.id === route.params.id) ?? null)

const spoilerKey = computed(() => `bookclub_spoiler_past_${String(route.params.id ?? '')}`)
const { currentChapter, isVisible } = useSpoilerFilter(spoilerKey)
function formatDate(dateRead) {
  if (!dateRead) return ''
  const d = typeof dateRead.toDate === 'function' ? dateRead.toDate() : new Date(dateRead)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}
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

.discord-summary {
  color: var(--text-secondary);
  line-height: 1.75;
  font-size: 0.95rem;
  white-space: pre-line;
  margin-bottom: 0.85rem;
}

.discord-thread-link {
  display: inline-block;
  color: #7289da;
  font-size: 0.9rem;
  text-decoration: none;
  font-family: var(--font-sans);
}

.discord-thread-link:hover {
  text-decoration: underline;
  color: var(--gold);
}


@media (max-width: 640px) {
  .book-header { flex-direction: column; }
  .cover-img { width: 120px; }
  .book-title { font-size: 1.4rem; }
}
</style>
