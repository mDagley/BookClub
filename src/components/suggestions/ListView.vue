<template>
  <div class="list-view">
    <div
      v-for="s in suggestions"
      :key="s.id"
      class="list-item card"
    >
      <!-- Thumbnail -->
      <div class="thumb-wrap">
        <img
          v-if="s.coverUrl"
          :src="s.coverUrl"
          :alt="s.title"
          class="thumb-img"
          loading="lazy"
        />
        <div v-else class="thumb-placeholder">📚</div>
      </div>

      <!-- Main content -->
      <div class="list-content">
        <div class="list-header">
          <span class="list-title">{{ s.title }}</span>
          <span class="list-author">{{ s.author }}</span>
        </div>

        <p v-if="s.description" class="list-description">{{ s.description }}</p>

        <!-- Genre chips -->
        <div v-if="s.genres && s.genres.length > 0" class="list-genres">
          <span
            v-for="genre in s.genres"
            :key="genre"
            class="chip"
          >
            {{ genreIcon(genre) }} {{ genre }}
          </span>
        </div>

        <!-- Meta: suggested by + read by -->
        <div class="list-meta">
          <span class="meta-text">Suggested by: <em>{{ s.suggestedBy }}</em></span>
          <span v-if="s.alreadyRead && s.alreadyRead.length > 0" class="meta-text read-by">
            Read by: {{ s.alreadyRead.join(', ') }}
          </span>
        </div>
      </div>

      <!-- Vote button -->
      <div class="list-vote">
        <button
          :class="['btn', hasVoted(s.id) ? '' : 'btn-gold', hasVoted(s.id) ? 'btn-voted' : '']"
          :disabled="hasVoted(s.id)"
          :title="hasVoted(s.id) ? 'Already voted' : 'Vote'"
          @click="!hasVoted(s.id) && castVote(s.id)"
        >
          ▲ {{ s.votes ?? 0 }}
        </button>
      </div>
    </div>

    <div v-if="suggestions.length === 0" class="empty-state card">
      <p>No suggestions match your filters.</p>
    </div>
  </div>
</template>

<script setup>
import { GENRE_ICONS } from '../../utils/genres.js'

defineProps({
  suggestions: { type: Array, required: true },
  hasVoted: { type: Function, required: true },
  castVote: { type: Function, required: true },
})

function genreIcon(genre) {
  return GENRE_ICONS[genre]?.icon ?? '📖'
}
</script>

<style scoped>
.list-view {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.list-item {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  padding: 0.85rem 1rem;
}

/* Thumbnail */
.thumb-wrap {
  flex-shrink: 0;
  width: 44px;
  aspect-ratio: 2 / 3;
  border-radius: 4px;
  overflow: hidden;
  background: var(--surface-subtle);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-placeholder {
  font-size: 1rem;
  opacity: 0.5;
}

/* Content area */
.list-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.list-header {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.list-title {
  font-family: var(--font-serif);
  font-size: 0.95rem;
  color: var(--text-primary);
  font-weight: normal;
}

.list-author {
  font-family: var(--font-sans);
  font-size: 0.78rem;
  color: var(--text-muted);
}

.list-description {
  font-family: var(--font-sans);
  font-size: 0.78rem;
  color: var(--text-secondary);
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.list-genres {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.list-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.meta-text {
  font-family: var(--font-sans);
  font-size: 0.72rem;
  color: var(--text-muted);
}

.read-by {
  color: #7ab87a;
}

/* Vote column */
.list-vote {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.btn-voted {
  opacity: 0.55;
  cursor: default;
}

.btn-voted:hover {
  background: var(--surface);
  border-color: var(--border);
  color: var(--text-primary);
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-muted);
  font-family: var(--font-sans);
  font-size: 0.9rem;
}
</style>
