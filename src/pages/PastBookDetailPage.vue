<template>
  <div class="past-book-detail">
    <!-- Top bar: back link + neighbour nav -->
    <div class="top-bar">
      <RouterLink to="/past-books" class="back-btn">← Past Books</RouterLink>
      <div v-if="newerBook || olderBook" class="top-nav">
        <RouterLink
          v-if="newerBook"
          :to="`/past-books/${newerBook.id}`"
          class="top-nav-link"
          :title="newerBook.title"
        >← {{ newerBook.title }}</RouterLink>
        <RouterLink
          v-if="olderBook"
          :to="`/past-books/${olderBook.id}`"
          class="top-nav-link"
          :title="olderBook.title"
        >{{ olderBook.title }} →</RouterLink>
      </div>
    </div>

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
      <div v-if="book.discordSummary || discussionThreads.length" id="discussion" class="discussion-sections">
        <section v-if="book.discordSummary" class="book-section card">
          <p class="section-title">Community Discussion</p>
          <p class="discord-summary">{{ book.discordSummary }}</p>
        </section>
        <DiscordThreads v-if="discussionThreads.length" :threads="discussionThreads" />
      </div>

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

      <!-- Bottom book navigation -->
      <nav v-if="newerBook || olderBook" class="book-nav">
        <RouterLink
          v-if="newerBook"
          :to="`/past-books/${newerBook.id}`"
          class="book-nav-card book-nav-prev"
        >
          <img v-if="newerBook.coverUrl" :src="newerBook.coverUrl" :alt="newerBook.title" class="nav-cover" />
          <div v-else class="nav-cover nav-cover-placeholder"><img src="/book-icon.svg" class="nav-placeholder-icon" alt="" /></div>
          <div class="nav-book-info">
            <span class="nav-direction">← More recent</span>
            <span class="nav-title">{{ newerBook.title }}</span>
            <span class="nav-date">{{ formatDate(newerBook.dateRead) }}</span>
          </div>
        </RouterLink>

        <RouterLink
          v-if="olderBook"
          :to="`/past-books/${olderBook.id}`"
          class="book-nav-card book-nav-next"
        >
          <div class="nav-book-info nav-book-info-right">
            <span class="nav-direction">Older read →</span>
            <span class="nav-title">{{ olderBook.title }}</span>
            <span class="nav-date">{{ formatDate(olderBook.dateRead) }}</span>
          </div>
          <img v-if="olderBook.coverUrl" :src="olderBook.coverUrl" :alt="olderBook.title" class="nav-cover" />
          <div v-else class="nav-cover nav-cover-placeholder"><img src="/book-icon.svg" class="nav-placeholder-icon" alt="" /></div>
        </RouterLink>
      </nav>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePastBooks } from '../composables/usePastBooks.js'
import { useSpoilerFilter } from '../composables/useSpoilerFilter.js'
import SpoilerFilter from '../components/book/SpoilerFilter.vue'
import CharacterGrid from '../components/book/CharacterGrid.vue'
import TimelineSection from '../components/book/TimelineSection.vue'
import SupplementalMaterials from '../components/book/SupplementalMaterials.vue'
import QuotesCarousel from '../components/book/QuotesCarousel.vue'
import DiscordThreads from '../components/book/DiscordThreads.vue'

const route = useRoute()
const { pastBooks, loading } = usePastBooks()

// pastBooks is already sorted descending (newest first) from usePastBooks
const currentIndex = computed(() => pastBooks.value.findIndex(b => b.id === route.params.id))
const book = computed(() => pastBooks.value[currentIndex.value] ?? null)

const discussionThreads = computed(() => {
  const b = book.value
  if (!b) return []
  const valid = b.discordThreads
    ?.filter(t => t.url?.trim())
    .map(t => ({ title: t.title?.trim() || 'Discussion', url: t.url.trim() }))
  if (valid?.length) return valid
  const legacy = b.discordThreadUrl?.trim()
  if (legacy) return [{ title: 'Discussion', url: legacy }]
  return []
})
const newerBook = computed(() => currentIndex.value > 0 ? pastBooks.value[currentIndex.value - 1] : null)
const olderBook = computed(() => {
  const i = currentIndex.value
  return i >= 0 && i < pastBooks.value.length - 1 ? pastBooks.value[i + 1] : null
})

const spoilerKey = computed(() => `bookclub_spoiler_past_${String(route.params.id ?? '')}`)
const { currentChapter, isVisible } = useSpoilerFilter(spoilerKey)

const navSections = computed(() => {
  if (!book.value) return []
  const b = book.value
  const sections = []
  if (b.fullDescription) sections.push({ id: 'about', label: 'About' })
  if (b.quotes?.length) sections.push({ id: 'quotes', label: 'Quotes' })
  if (b.supplementalMaterials?.length) sections.push({ id: 'materials', label: 'Materials' })
  if (b.discordSummary || discussionThreads.value.length) sections.push({ id: 'discussion', label: 'Discussion' })
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
  navSections.value.forEach(s => {
    const el = document.getElementById(s.id)
    if (el) observer.observe(el)
  })
})

watch(navSections, (sections, _, onCleanup) => {
  let cancelled = false
  onCleanup(() => { cancelled = true })
  if (!observer) return
  observer.disconnect()
  activeSection.value = ''
  nextTick(() => {
    if (cancelled) return
    sections.forEach(s => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })
  })
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

/* Top bar */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--text-muted);
  font-family: var(--font-sans);
  font-size: 0.85rem;
  text-decoration: none;
  padding: 0.3rem 0.65rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  transition: color 0.15s, border-color 0.15s;
}
.back-btn:hover { color: var(--gold); border-color: var(--gold); }

.top-nav {
  display: flex;
  gap: 1rem;
}

.top-nav-link {
  color: var(--text-muted);
  font-family: var(--font-sans);
  font-size: 0.8rem;
  text-decoration: none;
  max-width: 180px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.15s;
}
.top-nav-link:hover { color: var(--gold); }

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
  display: inline-block;
  font-family: var(--font-sans);
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(15, 7, 0, 0.9);
  background: linear-gradient(105deg,
    rgba(130, 88, 8, 1) 0%,
    rgba(210, 162, 30, 1) 30%,
    rgba(255, 218, 70, 0.98) 52%,
    rgba(218, 168, 32, 1) 72%,
    rgba(145, 98, 10, 1) 100%
  );
  border-radius: 100px;
  padding: 0.2rem 0.7rem;
  text-shadow: 0 1px 1px rgba(255, 240, 150, 0.3);
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
.discussion-sections {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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

/* Bottom book navigation */
.book-nav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.book-nav-card {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.85rem 1rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  text-decoration: none;
  transition: border-color 0.15s, background 0.15s;
  min-width: 0;
}

.book-nav-card:hover {
  border-color: var(--gold);
  background: rgba(200, 150, 60, 0.04);
}

.book-nav-next {
  justify-content: flex-end;
}

.nav-cover {
  flex-shrink: 0;
  width: 44px;
  height: 62px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
}

.nav-cover-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-subtle);
}

.nav-placeholder-icon {
  width: 55%;
  opacity: 0.4;
}

.nav-book-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.nav-book-info-right {
  text-align: right;
}

.nav-direction {
  font-family: var(--font-sans);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.nav-title {
  font-family: var(--font-serif);
  font-size: 0.95rem;
  color: var(--gold);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-date {
  font-family: var(--font-sans);
  font-size: 0.75rem;
  color: var(--text-muted);
}

@media (max-width: 640px) {
  .book-header { flex-direction: column; }
  .cover-img { width: 120px; }
  .book-title { font-size: 1.4rem; }

  .top-nav { display: none; }

  .book-nav { grid-template-columns: 1fr; }
  .book-nav-next { justify-content: flex-start; flex-direction: row-reverse; }
  .nav-book-info-right { text-align: left; }
}
</style>
