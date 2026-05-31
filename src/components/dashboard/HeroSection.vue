<template>
  <section class="hero card">
    <RouterLink to="/book" class="hero-cover" title="More about this book">
      <img
        v-if="book.coverUrl"
        :src="book.coverUrl"
        :alt="book.title"
        class="cover-img"
      />
      <div v-else class="cover-placeholder">📚</div>
    </RouterLink>

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
  animation: fadeUp 0.5s ease both;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

.hero-cover {
  flex-shrink: 0;
  width: 160px;
}

.cover-img {
  width: 100%;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  box-shadow: 6px 8px 24px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(200, 150, 60, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.cover-img:hover {
  transform: translateY(-3px) rotate(-0.5deg);
  box-shadow: 10px 14px 32px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(200, 150, 60, 0.15);
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
  font-family: var(--font-display);
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--gold);
  opacity: 0.85;
}

.hero-title {
  font-family: var(--font-serif);
  font-size: 2rem;
  font-weight: 600;
  color: var(--gold-light);
  line-height: 1.15;
  text-shadow: 0 2px 12px rgba(200, 150, 60, 0.2);
}

.hero-author {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 0.95rem;
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
