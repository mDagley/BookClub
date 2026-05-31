<template>
  <div class="past-books-widget card">
    <p class="section-title">Past Books</p>

    <div v-if="pastBooks.length === 0" class="empty-state">
      No past books yet.
    </div>

    <div v-else class="past-list">
      <RouterLink v-for="book in pastBooks" :key="book.id" :to="`/past-books/${book.id}`" class="past-row">
        <img
          v-if="book.coverUrl"
          :src="book.coverUrl"
          :alt="book.title"
          class="past-thumb"
        />
        <div v-else class="past-thumb-placeholder">📖</div>
        <div class="past-info">
          <span class="past-title">{{ book.title }}</span>
          <span class="past-author">{{ book.author }}</span>
          <span class="past-date">{{ formatDate(book.dateRead) }}</span>
          <a
            v-if="book.discordThreadUrl"
            :href="book.discordThreadUrl"
            target="_blank"
            rel="noopener"
            class="past-thread"
          >💬 Discord thread →</a>
        </div>
      </RouterLink>
    </div>

    <div class="widget-footer">
      <RouterLink to="/past-books" class="footer-link">View all →</RouterLink>
    </div>
  </div>
</template>

<script setup>
defineProps({
  pastBooks: { type: Array, default: () => [] },
})

function formatDate(ts) {
  if (!ts) return ''
  // Firestore Timestamp has .toDate(); plain Date or string also handled
  const d = ts?.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}
</script>

<style scoped>
.past-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.past-row {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  text-decoration: none;
  color: inherit;
  border-radius: var(--radius-sm);
  padding: 0.25rem;
  margin: -0.25rem;
  transition: background 0.15s;
}

.past-row:hover {
  background: var(--surface-subtle);
  text-decoration: none;
}

.past-row:hover .past-title {
  color: var(--gold);
}

.past-thumb {
  width: 36px;
  height: 54px;
  object-fit: cover;
  border-radius: 3px;
  border: 1px solid var(--border);
  flex-shrink: 0;
}

.past-thumb-placeholder {
  width: 36px;
  height: 54px;
  background: var(--surface-subtle);
  border: 1px solid var(--border);
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}

.past-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  overflow: hidden;
  min-width: 0;
}

.past-title {
  font-size: 0.85rem;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.past-author {
  font-family: var(--font-sans);
  font-size: 0.72rem;
  color: var(--text-dim);
}

.past-date {
  font-family: var(--font-sans);
  font-size: 0.72rem;
  color: var(--text-muted);
}

.past-thread {
  font-family: var(--font-sans);
  font-size: 0.72rem;
  color: var(--gold);
  text-decoration: none;
}

.past-thread:hover {
  text-decoration: underline;
}

.widget-footer {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border);
}

.footer-link {
  font-family: var(--font-sans);
  font-size: 0.8rem;
  color: var(--gold);
  text-decoration: none;
}

.footer-link:hover { text-decoration: underline; }

.empty-state {
  font-family: var(--font-sans);
  font-size: 0.85rem;
  color: var(--text-dim);
  padding: 0.5rem 0;
}
</style>
