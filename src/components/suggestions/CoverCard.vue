<template>
  <div class="cover-card">
    <!-- Cover image area -->
    <div class="cover-wrap">
      <!-- Image or placeholder -->
      <img
        v-if="suggestion.coverUrl"
        :src="suggestion.coverUrl"
        :alt="suggestion.title"
        class="cover-img"
        loading="lazy"
      />
      <div v-else class="cover-placeholder">
        <span class="placeholder-emoji">📚</span>
      </div>

      <!-- Vote badge -->
      <button
        class="vote-badge"
        :class="{ voted: hasVoted }"
        :style="hasVoted ? 'cursor: default' : ''"
        :title="hasVoted ? 'Already voted' : 'Vote for this book'"
        @click.stop="!hasVoted && emit('vote')"
      >
        ▲ {{ suggestion.votes ?? 0 }}
      </button>

      <!-- Read badge -->
      <div
        v-if="suggestion.alreadyRead && suggestion.alreadyRead.length > 0"
        class="read-badge"
        :title="`Read by: ${suggestion.alreadyRead.join(', ')}`"
      >
        {{ suggestion.alreadyRead.length }} read
      </div>

      <!-- Genre icon strip -->
      <div v-if="visibleGenres.length > 0" class="genre-strip">
        <span
          v-for="genre in visibleGenres"
          :key="genre"
          class="genre-icon"
          :title="genre"
          :aria-label="genre"
        >
          <img v-if="GENRE_ICONS[genre]?.img" :src="GENRE_ICONS[genre].img" :alt="genre" class="genre-icon-img" />
          <template v-else>{{ GENRE_ICONS[genre]?.icon ?? '📖' }}</template>
        </span>
      </div>

      <!-- Hover overlay with description -->
      <div v-if="suggestion.description" class="hover-overlay">
        <p class="hover-description">{{ suggestion.description }}</p>
      </div>
    </div>

    <!-- Below cover -->
    <div class="cover-meta">
      <p class="cover-title">{{ suggestion.title }}</p>
      <p class="cover-author">{{ suggestion.author }}</p>
      <p class="cover-suggester">by {{ suggestion.suggestedBy }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { GENRE_ICONS } from '../../utils/genres.js'

const props = defineProps({
  suggestion: { type: Object, required: true },
  hasVoted: { type: Boolean, default: false },
})

const emit = defineEmits(['vote'])

const visibleGenres = computed(() =>
  (props.suggestion.genres || []).slice(0, 3)
)
</script>

<style scoped>
.cover-card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.cover-wrap {
  position: relative;
  aspect-ratio: 2 / 3;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--surface-subtle);
  border: 1px solid var(--border);
  transition: border-color 0.2s, transform 0.15s;
}

.cover-card:hover .cover-wrap {
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

.placeholder-emoji {
  font-size: 2.5rem;
  opacity: 0.5;
}

/* Hover overlay */
.hover-overlay {
  position: absolute;
  inset: 0;
  background: rgba(10, 20, 12, 0.88);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.cover-card:hover .hover-overlay {
  opacity: 1;
}

.hover-description {
  font-family: var(--font-sans);
  font-size: 0.72rem;
  color: var(--text-primary);
  line-height: 1.55;
  text-align: center;
  display: -webkit-box;
  -webkit-line-clamp: 8;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Vote badge */
.vote-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.7);
  border: 1px solid var(--gold);
  color: var(--gold);
  font-family: var(--font-sans);
  font-size: 0.72rem;
  font-weight: bold;
  padding: 0.2rem 0.55rem;
  border-radius: 12px;
  cursor: pointer;
  z-index: 3;
  transition: background 0.15s, color 0.15s;
  line-height: 1.4;
}

.vote-badge:hover:not(.voted) {
  background: var(--gold);
  color: var(--bg);
}

.vote-badge.voted {
  opacity: 0.65;
  cursor: default;
}

/* Read badge */
.read-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  border: 1px solid #4a8a52;
  color: #7ab87a;
  font-family: var(--font-sans);
  font-size: 0.68rem;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  z-index: 3;
  line-height: 1.4;
}

.genre-icon-img {
  width: 1.1em;
  height: 1.1em;
  object-fit: contain;
  vertical-align: middle;
}

/* Meta below cover */
.cover-meta {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  padding: 0 2px;
}

.cover-title {
  font-family: var(--font-serif);
  font-size: 0.82rem;
  color: var(--text-primary);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.cover-author {
  font-family: var(--font-sans);
  font-size: 0.72rem;
  color: var(--text-muted);
}

.cover-suggester {
  font-family: var(--font-sans);
  font-size: 0.68rem;
  color: var(--text-dim);
  font-style: italic;
}
</style>
