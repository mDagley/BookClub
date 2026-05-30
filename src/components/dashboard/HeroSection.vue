<template>
  <section class="hero card">
    <div class="hero-cover">
      <img
        v-if="book.coverUrl"
        :src="book.coverUrl"
        :alt="book.title"
        class="cover-img"
      />
      <div v-else class="cover-placeholder">📚</div>
    </div>

    <div class="hero-body">
      <p class="eyebrow">Now Reading</p>
      <h1 class="hero-title">{{ book.title }}</h1>
      <p class="hero-author">{{ book.author }}</p>

      <div class="genre-chips">
        <span v-for="g in book.genres" :key="g" class="chip">{{ g }}</span>
      </div>

      <p class="hero-synopsis">{{ book.synopsis }}</p>

      <div class="hero-actions">
        <a
          v-if="primaryThread"
          :href="primaryThread.url"
          target="_blank"
          rel="noopener"
          class="btn btn-discord"
        >💬 Discussion Thread</a>
        <a
          v-if="book.goodreadsUrl"
          :href="book.goodreadsUrl"
          target="_blank"
          rel="noopener"
          class="btn"
        >View on Goodreads</a>
        <RouterLink to="/book" class="hero-more-link">More about this book →</RouterLink>
      </div>
    </div>

    <MeetingCard v-if="book.meeting" :meeting="book.meeting" class="hero-meeting" />
  </section>
</template>

<script setup>
import { computed } from 'vue'
import MeetingCard from './MeetingCard.vue'

const props = defineProps({
  book: { type: Object, required: true },
})

const primaryThread = computed(() => props.book.discordThreads?.[0] ?? null)
</script>

<style scoped>
.hero {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
}

.hero-cover {
  flex-shrink: 0;
  width: 160px;
}

.cover-img {
  width: 100%;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
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
  font-size: 3rem;
}

.hero-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.eyebrow {
  font-family: var(--font-sans);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--gold);
}

.hero-title {
  font-family: var(--font-serif);
  font-size: 1.75rem;
  color: var(--gold);
  line-height: 1.2;
}

.hero-author {
  font-family: var(--font-sans);
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.genre-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.hero-synopsis {
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  align-items: center;
  margin-top: 0.25rem;
}

.hero-more-link {
  font-size: 0.85rem;
  color: var(--gold);
  text-decoration: none;
  margin-left: 0.25rem;
}

.hero-more-link:hover {
  text-decoration: underline;
}

.hero-meeting {
  flex-shrink: 0;
  width: 220px;
}

@media (max-width: 768px) {
  .hero { flex-direction: column; }
  .hero-cover { width: 120px; }
  .hero-meeting { width: 100%; }
}
</style>
