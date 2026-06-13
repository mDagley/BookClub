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
          />
          <div v-else class="book-cover-placeholder">
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

      <!-- Sticky spoiler filter -->
      <SpoilerFilter :current-chapter="currentChapter" :hide-when-unset="true" @update="currentChapter = $event" />

      <!-- Collapsible sections -->
      <DiscordThreads
        v-if="currentBook.discordThreads?.length"
        :threads="currentBook.discordThreads"
      />

      <SupplementalMaterials
        v-if="currentBook.supplementalMaterials?.length"
        :materials="currentBook.supplementalMaterials"
      />

      <CharacterGrid
        v-if="currentBook.characters?.length"
        :characters="currentBook.characters"
        :current-chapter="currentChapter"
        :is-visible="isVisible"
      />

      <TimelineSection
        v-if="currentBook.timeline?.length"
        :timeline="currentBook.timeline"
        :current-chapter="currentChapter"
        :is-visible="isVisible"
      />
    </template>
  </div>
</template>

<script setup>
import { useConfig } from '../composables/useConfig.js'
import { useSpoilerFilter } from '../composables/useSpoilerFilter.js'
import SpoilerFilter from '../components/book/SpoilerFilter.vue'
import SupplementalMaterials from '../components/book/SupplementalMaterials.vue'
import CharacterGrid from '../components/book/CharacterGrid.vue'
import TimelineSection from '../components/book/TimelineSection.vue'
import DiscordThreads from '../components/book/DiscordThreads.vue'

const { currentBook, loading: configLoading } = useConfig()
const { currentChapter, isVisible } = useSpoilerFilter('bookclub_spoiler_chapter', { hideWhenUnset: true })
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
}

.book-cover-img {
  width: 160px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
}

.book-cover-placeholder {
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
  .book-cover-img { width: 120px; }
  .book-title { font-size: 1.4rem; }
}
</style>
