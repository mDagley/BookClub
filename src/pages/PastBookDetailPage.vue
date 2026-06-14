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
      <section id="overview" class="book-header card">
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

      <!-- Subnav -->
      <nav v-if="navSections.length" class="subnav card">
        <a
          v-for="s in navSections"
          :key="s.id"
          :href="`#${s.id}`"
          class="subnav-link"
          :class="{ active: activeSection === s.id }"
          @click.prevent="scrollTo(s.id)"
        >{{ s.label }}</a>
      </nav>

      <!-- Full description -->
      <section v-if="book.fullDescription" id="about" class="card description-section">
        <p class="section-title">About the Book</p>
        <p
          v-for="(para, i) in book.fullDescription.split('\n\n')"
          :key="i"
          class="description-text"
        >{{ para }}</p>
      </section>

      <!-- Quotes carousel -->
      <section v-if="book.quotes?.length" id="quotes">
        <QuotesCarousel :quotes="book.quotes" />
      </section>

      <!-- Supplemental materials -->
      <section v-if="book.supplementalMaterials?.length" id="materials">
        <SupplementalMaterials :materials="book.supplementalMaterials" />
      </section>

      <!-- Discord discussion -->
      <section v-if="book.discordSummary || book.discordThreadUrl" id="discussion" class="book-section card">
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

      <!-- Spoiler filter -->
      <SpoilerFilter
        v-if="book.characters?.length || book.timeline?.length"
        id="characters"
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
        id="timeline"
        :timeline="book.timeline"
        :current-chapter="currentChapter"
        :is-visible="isVisible"
      />
    </template>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePastBooks } from '../composables/usePastBooks.js'
import { useSpoilerFilter } from '../composables/useSpoilerFilter.js'
import SpoilerFilter from '../components/book/SpoilerFilter.vue'
import CharacterGrid from '../components/book/CharacterGrid.vue'
import TimelineSection from '../components/book/TimelineSection.vue'
import SupplementalMaterials from '../components/book/SupplementalMaterials.vue'
import QuotesCarousel from '../components/book/QuotesCarousel.vue'

const route = useRoute()
const { pastBooks, loading } = usePastBooks()

const book = computed(() => pastBooks.value.find(b => b.id === route.params.id) ?? null)

const spoilerKey = computed(() => `bookclub_spoiler_past_${String(route.params.id ?? '')}`)
const { currentChapter, isVisible } = useSpoilerFilter(spoilerKey)

const navSections = computed(() => {
  if (!book.value) return []
  const b = book.value
  const sections = []
  if (b.fullDescription) sections.push({ id: 'about', label: 'About' })
  if (b.quotes?.length) sections.push({ id: 'quotes', label: 'Quotes' })
  if (b.supplementalMaterials?.length) sections.push({ id: 'materials', label: 'Materials' })
  if (b.discordSummary || b.discordThreadUrl) sections.push({ id: 'discussion', label: 'Discussion' })
  if (b.characters?.length) sections.push({ id: 'characters', label: 'Characters' })
  if (b.timeline?.length) sections.push({ id: 'timeline', label: 'Timeline' })
  return sections
})

const activeSection = ref('')

function scrollTo(id) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

let observer = null
onMounted(() => {
  observer = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (e.isIntersecting) activeSection.value = e.target.id
    }
  }, { rootMargin: '-30% 0px -60% 0px' })

  setTimeout(() => {
    navSections.value.forEach(s => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })
  }, 100)
})
onUnmounted(() => observer?.disconnect())

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

/* Subnav */
.subnav {
  position: sticky;
  top: 3.75rem;
  z-index: 10;
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  padding: 0.55rem 0.75rem;
}

.subnav-link {
  font-family: var(--font-sans);
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-muted);
  text-decoration: none;
  padding: 0.3rem 0.65rem;
  border-radius: var(--radius-sm);
  transition: color 0.15s, background 0.15s;
  white-space: nowrap;
}

.subnav-link:hover { color: var(--text-primary); background: var(--surface-subtle); }
.subnav-link.active { color: var(--gold); background: rgba(200, 150, 60, 0.1); }

/* Book header */
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

/* Description */
.description-section .description-text {
  color: var(--text-secondary);
  line-height: 1.8;
  font-size: 0.95rem;
  margin-bottom: 0.9rem;
}

.description-section .description-text:last-child { margin-bottom: 0; }

/* Discord discussion */
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
