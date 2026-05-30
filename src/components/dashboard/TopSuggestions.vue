<template>
  <div class="top-suggestions card">
    <p class="section-title">Top Suggestions</p>

    <div v-if="suggestions.length === 0" class="empty-state">
      No suggestions yet. Be the first!
    </div>

    <div v-else class="suggestion-list">
      <div
        v-for="(s, i) in suggestions"
        :key="s.id"
        class="suggestion-row"
      >
        <span class="rank">#{{ i + 1 }}</span>
        <img
          v-if="s.coverUrl"
          :src="s.coverUrl"
          :alt="s.title"
          class="suggestion-thumb"
        />
        <div v-else class="suggestion-thumb-placeholder">📖</div>
        <div class="suggestion-info">
          <span class="suggestion-title">{{ s.title }}</span>
          <span class="suggestion-author">{{ s.author }}</span>
          <span v-if="s.genres?.[0]" class="chip">{{ s.genres[0] }}</span>
        </div>
        <span class="suggestion-votes">▲ {{ s.votes }}</span>
      </div>
    </div>

    <div class="suggestions-footer">
      <span class="suggestions-count">{{ total }} total suggestion{{ total === 1 ? '' : 's' }}</span>
      <RouterLink to="/suggestions" class="suggestions-link">View all &amp; filter →</RouterLink>
      <button class="btn-link" @click="$emit('open-suggest')">+ Suggest</button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  suggestions: { type: Array, default: () => [] },
  total: { type: Number, default: 0 },
})
defineEmits(['open-suggest'])
</script>

<style scoped>
.suggestion-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.suggestion-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.rank {
  font-family: var(--font-sans);
  font-size: 0.75rem;
  color: var(--text-dim);
  width: 1.5rem;
  text-align: right;
  flex-shrink: 0;
}

.suggestion-thumb {
  width: 36px;
  height: 54px;
  object-fit: cover;
  border-radius: 3px;
  border: 1px solid var(--border);
  flex-shrink: 0;
}

.suggestion-thumb-placeholder {
  width: 36px;
  height: 54px;
  background: var(--surface-subtle);
  border: 1px solid var(--border);
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.suggestion-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  overflow: hidden;
}

.suggestion-title {
  font-size: 0.85rem;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.suggestion-author {
  font-family: var(--font-sans);
  font-size: 0.75rem;
  color: var(--text-dim);
}

.suggestion-votes {
  font-family: var(--font-sans);
  font-size: 0.8rem;
  color: var(--gold);
  font-weight: bold;
  flex-shrink: 0;
}

.suggestions-footer {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border);
  flex-wrap: wrap;
}

.suggestions-count {
  font-family: var(--font-sans);
  font-size: 0.75rem;
  color: var(--text-dim);
}

.suggestions-link,
.btn-link {
  font-family: var(--font-sans);
  font-size: 0.8rem;
  color: var(--gold);
  text-decoration: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.btn-link:hover,
.suggestions-link:hover {
  text-decoration: underline;
}

.empty-state {
  font-family: var(--font-sans);
  font-size: 0.85rem;
  color: var(--text-dim);
  padding: 1rem 0;
}
</style>
