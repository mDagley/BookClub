<template>
  <div class="admin-suggestions">
    <div class="section-header">
      <h2 class="section-heading">Suggestions</h2>
    </div>

    <div v-if="loading" class="loading-state">Loading suggestions…</div>

    <div v-else-if="suggestions.length" class="table-wrap">
      <table class="suggestions-table">
        <thead>
          <tr>
            <th class="col-cover"></th>
            <th class="col-title">Title</th>
            <th class="col-author">Author</th>
            <th class="col-votes">Votes</th>
            <th class="col-suggested">Suggested By</th>
            <th class="col-readby">Read By</th>
            <th class="col-actions"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="suggestion in suggestions"
            :key="suggestion.id"
            class="suggestion-row"
          >
            <td class="col-cover">
              <img
                v-if="suggestion.coverUrl"
                :src="suggestion.coverUrl"
                :alt="suggestion.title"
                class="cover-thumb"
              />
              <div v-else class="cover-placeholder"></div>
            </td>
            <td class="col-title">
              <span class="book-title">{{ suggestion.title }}</span>
              <span v-if="suggestion.genres?.length" class="genre-list">
                {{ suggestion.genres.join(', ') }}
              </span>
            </td>
            <td class="col-author">{{ suggestion.author }}</td>
            <td class="col-votes">
              <span class="vote-badge">{{ suggestion.votes ?? 0 }}</span>
            </td>
            <td class="col-suggested">{{ suggestion.suggestedBy || '—' }}</td>
            <td class="col-readby">
              <span v-if="suggestion.alreadyRead?.length" class="readby-text">
                {{ suggestion.alreadyRead.join(', ') }}
              </span>
              <span v-else class="empty-cell">—</span>
            </td>
            <td class="col-actions">
              <button
                class="btn btn-promote btn-sm"
                @click="promote(suggestion)"
                title="Copy to Current Book"
              >
                Promote
              </button>
              <button
                class="btn btn-danger btn-sm"
                @click="deleteSug(suggestion)"
              >
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-else class="empty-state">No suggestions yet.</p>
  </div>
</template>

<script setup>
import { useSuggestions } from '../../composables/useSuggestions.js'

const { suggestions, loading, deleteSuggestion } = useSuggestions()

const emit = defineEmits(['promote'])

async function deleteSug(suggestion) {
  if (!window.confirm(`Delete suggestion "${suggestion.title}"? This cannot be undone.`)) return
  try {
    await deleteSuggestion(suggestion.id)
  } catch (err) {
    console.error('Delete error:', err)
    alert('Delete failed: ' + (err.message || 'Unknown error'))
  }
}

function promote(suggestion) {
  // Emit up to AdminPage which will switch tabs and prefill AdminCurrentBook
  emit('promote', {
    title: suggestion.title || '',
    author: suggestion.author || '',
    coverUrl: suggestion.coverUrl || '',
    goodreadsUrl: suggestion.goodreadsUrl || '',
    synopsis: suggestion.synopsis || '',
    description: suggestion.description || '',
    genres: Array.isArray(suggestion.genres) ? [...suggestion.genres] : [],
    // Clear meeting/discussion fields — admin fills those in
    meetingDate: '',
    meetingTime: '',
    meetingLocation: '',
    discordVoiceUrl: '',
    threads: [],
    materials: [],
    characters: [],
    timeline: [],
  })
}
</script>

<style scoped>
.admin-suggestions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-heading {
  font-family: var(--font-serif);
  font-size: 1.4rem;
  color: var(--text-primary);
  margin: 0;
}

.loading-state,
.empty-state {
  color: var(--text-muted);
  font-style: italic;
}

.table-wrap {
  overflow-x: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

.suggestions-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}

.suggestions-table th {
  background: var(--surface);
  color: var(--text-secondary);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.6rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.suggestion-row td {
  padding: 0.6rem 0.75rem;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
  color: var(--text-primary);
}

.suggestion-row:last-child td {
  border-bottom: none;
}

.suggestion-row:hover td {
  background: var(--surface-subtle);
}

.col-cover { width: 52px; }
.col-title { min-width: 150px; }
.col-author { min-width: 120px; color: var(--text-secondary); }
.col-votes { width: 60px; text-align: center; }
.col-suggested { min-width: 110px; color: var(--text-secondary); }
.col-readby { min-width: 130px; }
.col-actions { width: 150px; white-space: nowrap; }

.cover-thumb {
  width: 40px;
  height: 56px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  display: block;
}

.cover-placeholder {
  width: 40px;
  height: 56px;
  background: var(--surface-subtle);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
}

.book-title {
  display: block;
  font-weight: 600;
}

.genre-list {
  display: block;
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 0.1rem;
}

.vote-badge {
  display: inline-block;
  background: rgba(200, 150, 60, 0.12);
  color: var(--gold);
  border: 1px solid rgba(200, 150, 60, 0.3);
  border-radius: var(--radius-sm);
  padding: 0.1rem 0.45rem;
  font-size: 0.8rem;
  font-weight: 700;
}

.readby-text {
  font-size: 0.82rem;
  color: var(--text-muted);
}

.empty-cell {
  color: var(--text-muted);
}

/* Buttons */
.btn {
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  font-family: var(--font-sans);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn-sm {
  padding: 0.3rem 0.65rem;
  font-size: 0.78rem;
}

.btn-promote {
  background: transparent;
  border-color: var(--border-hover);
  color: var(--gold);
}

.btn-promote:hover {
  border-color: var(--gold);
  background: rgba(200, 150, 60, 0.08);
}

.btn-danger {
  background: transparent;
  border-color: rgba(242, 139, 130, 0.4);
  color: #f28b82;
}

.btn-danger:hover {
  background: rgba(242, 139, 130, 0.1);
}

.col-actions .btn + .btn {
  margin-left: 0.35rem;
}
</style>
