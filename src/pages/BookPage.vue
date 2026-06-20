<template>
  <div class="book-page">
    <div v-if="configLoading" class="book-loading">
      <div class="skeleton" style="height: 200px; border-radius: var(--radius-md);" />
    </div>

    <div v-else-if="!currentBook" class="book-empty">
      <p class="section-title">No current book</p>
      <p>Check back when the next book is selected.</p>
    </div>

    <template v-else>
      <!-- Book header -->
      <section class="book-header card">
        <div class="book-header-cover">
          <img
            v-if="currentBook.coverUrl"
            :src="currentBook.coverUrl"
            :alt="currentBook.title"
            class="book-cover-img"
            @error="e => e.target.style.display = 'none'"
          />
          <div class="book-cover-placeholder">
            <img src="/book-icon.svg" class="placeholder-book" alt="" />
          </div>
        </div>
        <div class="book-header-body">
          <div class="genre-chips">
            <span v-for="g in currentBook.genres" :key="g" class="chip">{{ g }}</span>
          </div>
          <h1 class="book-title">{{ currentBook.title }}</h1>
          <p class="book-author">{{ currentBook.author }}</p>
          <p class="book-description">{{ currentBook.fullDescription || currentBook.synopsis }}</p>
          <div class="book-actions">
            <a
              v-if="currentBook.goodreadsUrl"
              :href="currentBook.goodreadsUrl"
              target="_blank"
              rel="noopener"
              class="btn"
            >View on Goodreads</a>
          </div>

          <div v-if="currentBook.meeting" class="book-meeting-summary">
            <span>📅 {{ currentBook.meeting.date }}</span>
            <span v-if="currentBook.meeting.location">· {{ currentBook.meeting.location }}</span>
            <a
              v-if="currentBook.meeting.discordVoiceUrl"
              :href="currentBook.meeting.discordVoiceUrl"
              target="_blank"
              rel="noopener"
              class="btn btn-discord btn-sm"
            >Join Voice</a>
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

      <!-- Sticky spoiler filter -->
      <SpoilerFilter :current-chapter="currentChapter" :hide-when-unset="true" @update="currentChapter = $event" />

      <!-- Collapsible sections -->
      <DiscordThreads
        v-if="currentBook.discordThreads?.length"
        id="discussion"
        :threads="currentBook.discordThreads"
      />

      <SupplementalMaterials
        v-if="currentBook.supplementalMaterials?.length"
        id="materials"
        :materials="currentBook.supplementalMaterials"
      />

      <CharacterGrid
        v-if="currentBook.characters?.length"
        id="characters"
        :characters="currentBook.characters"
        :current-chapter="currentChapter"
        :is-visible="isVisible"
      />

      <TimelineSection
        v-if="currentBook.timeline?.length"
        id="timeline"
        :timeline="currentBook.timeline"
        :current-chapter="currentChapter"
        :is-visible="isVisible"
      />
    </template>
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useConfig } from '../composables/useConfig.js'
import { useSpoilerFilter } from '../composables/useSpoilerFilter.js'
import SpoilerFilter from '../components/book/SpoilerFilter.vue'
import SupplementalMaterials from '../components/book/SupplementalMaterials.vue'
import CharacterGrid from '../components/book/CharacterGrid.vue'
import TimelineSection from '../components/book/TimelineSection.vue'
import DiscordThreads from '../components/book/DiscordThreads.vue'

const { currentBook, loading: configLoading } = useConfig()
const { currentChapter, isVisible } = useSpoilerFilter('bookclub_spoiler_chapter', { hideWhenUnset: true })

const navSections = computed(() => {
  if (!currentBook.value) return []
  const b = currentBook.value
  const sections = []
  if (b.discordThreads?.length) sections.push({ id: 'discussion', label: 'Discussion' })
  if (b.supplementalMaterials?.length) sections.push({ id: 'materials', label: 'Materials' })
  if (b.characters?.length) sections.push({ id: 'characters', label: 'Characters' })
  if (b.timeline?.length) sections.push({ id: 'timeline', label: 'Timeline' })
  return sections
})

const activeSection = ref('')

function scrollTo(id) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function observeSections(sections) {
  if (!observer) return
  observer.disconnect()
  activeSection.value = ''
  nextTick(() => {
    sections.forEach(s => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })
  })
}

let observer = null
onMounted(() => {
  observer = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (e.isIntersecting) activeSection.value = e.target.id
    }
  }, { rootMargin: '-30% 0px -60% 0px' })
  // Handle case where currentBook is already loaded before mount
  observeSections(navSections.value)
})

// Re-observe whenever sections change (currentBook loads async from Firestore)
watch(navSections, observeSections)

onUnmounted(() => observer?.disconnect())
</script>

<style scoped>
.book-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

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

.book-empty {
  text-align: center;
  padding: 4rem 1.5rem;
}

.book-header {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
}

.book-header-cover {
  flex-shrink: 0;
  position: relative;
  width: 160px;
  aspect-ratio: 2/3;
  overflow: hidden;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
}

.book-cover-img {
  position: relative;
  z-index: 1;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: var(--radius-sm);
}

.book-cover-placeholder {
  position: absolute;
  inset: 0;
  background: var(--surface-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-book {
  width: 60%;
  opacity: 0.55;
  filter: drop-shadow(0 2px 8px rgba(232, 168, 40, 0.35));
}

.book-header-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
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

.book-description {
  color: var(--text-secondary);
  line-height: 1.7;
  font-size: 0.95rem;
}

.book-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  align-items: center;
}

.book-meeting-summary {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  font-family: var(--font-sans);
  font-size: 0.85rem;
  color: var(--text-muted);
  padding-top: 0.25rem;
}

.btn-sm {
  padding: 0.25rem 0.6rem;
  font-size: 0.75rem;
}

@media (max-width: 640px) {
  .book-header { flex-direction: column; }
  .book-header-cover { width: 120px; }
  .book-title { font-size: 1.4rem; }
}
</style>
