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
        <div class="thumb-wrap">
          <img
            v-if="s.coverUrl"
            :src="s.coverUrl"
            :alt="s.title"
            class="suggestion-thumb"
            @error="e => e.target.style.display = 'none'"
          />
          <div class="suggestion-thumb-placeholder">
            <img src="/book-icon.svg" class="placeholder-book" alt="" />
          </div>
        </div>

        <div class="suggestion-info">
          <span class="suggestion-title">{{ s.title }}</span>
          <span class="suggestion-author">{{ s.author }}</span>
          <p v-if="s.description" class="suggestion-desc">{{ s.description }}</p>
          <div class="suggestion-badges">
            <span v-for="genre in (s.genres || [])" :key="genre" class="chip">{{ genre }}</span>
            <span v-if="s.alreadyRead?.length" class="read-chip" :title="`Read by: ${resolveNames(s.alreadyRead).join(', ')}`">
              ✓ {{ s.alreadyRead.length }} read
            </span>
          </div>
          <button
            class="read-toggle"
            :class="{ 'is-read': s.alreadyRead?.includes(authUsername), 'no-auth': !authUsername }"
            :title="!authUsername ? 'Login with Discord to mark as read' : undefined"
            @click="authUsername && toggleAlreadyRead(s.id, authUsername, s.alreadyRead?.includes(authUsername))"
          >
            {{ s.alreadyRead?.includes(authUsername) ? '✓ I\'ve read this' : 'Mark as read' }}
          </button>
        </div>

        <!-- Vote buttons -->
        <div class="vote-col">
          <button
            class="vote-btn upvote"
            :class="{ active: (s.votedUsers?.[uid] ?? 0) === 1 }"
            :disabled="!uid"
            :title="uid ? 'Upvote' : 'Login to vote'"
            @click="uid && voteOnSuggestion(s.id, uid, 1)"
          >▲</button>
          <span class="vote-count">{{ s.votes ?? 0 }}</span>
          <button
            class="vote-btn downvote"
            :class="{ active: (s.votedUsers?.[uid] ?? 0) === -1 }"
            :disabled="!uid"
            :title="uid ? 'Downvote' : 'Login to vote'"
            @click="uid && voteOnSuggestion(s.id, uid, -1)"
          >▼</button>
        </div>
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
import { useMemberProfiles } from '../../composables/useMemberProfiles.js'

defineProps({
  suggestions: { type: Array, default: () => [] },
  total: { type: Number, default: 0 },
  uid: { type: String, default: null },
  authUsername: { type: String, default: null },
  voteOnSuggestion: { type: Function, default: () => {} },
  toggleAlreadyRead: { type: Function, default: () => {} },
})
defineEmits(['open-suggest'])

const { resolveNames } = useMemberProfiles()
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
  gap: 0.6rem;
}

.rank {
  font-family: var(--font-sans);
  font-size: 0.75rem;
  color: var(--text-dim);
  width: 1.5rem;
  text-align: right;
  flex-shrink: 0;
}

.thumb-wrap {
  position: relative;
  flex-shrink: 0;
  width: 36px;
  height: 54px;
  border-radius: 3px;
  border: 1px solid var(--border);
  overflow: hidden;
  background: var(--surface-subtle);
}

.suggestion-thumb {
  position: relative;
  z-index: 1;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.suggestion-thumb-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-subtle);
}

.placeholder-book {
  width: 70%;
  opacity: 0.5;
  filter: drop-shadow(0 1px 4px rgba(160, 208, 240, 0.3));
}

.suggestion-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  overflow: hidden;
  min-width: 0;
}

.suggestion-title {
  font-family: var(--font-serif);
  font-size: 0.88rem;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.suggestion-author {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 0.75rem;
  color: var(--text-dim);
}

.suggestion-desc {
  font-family: var(--font-sans);
  font-size: 0.75rem;
  color: var(--text-secondary);
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.suggestion-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  align-items: center;
}

.read-chip {
  font-family: var(--font-sans);
  font-size: 0.68rem;
  color: #7ab87a;
  background: rgba(122, 184, 122, 0.1);
  border: 1px solid rgba(122, 184, 122, 0.3);
  border-radius: 10px;
  padding: 0.1rem 0.4rem;
}

/* Mark as read */
.read-toggle {
  background: none;
  border: none;
  padding: 0;
  font-family: var(--font-sans);
  font-size: 0.72rem;
  color: var(--text-dim);
  cursor: pointer;
  text-align: left;
  transition: color 0.15s;
}

.read-toggle:hover:not(.no-auth) { color: #7ab87a; }
.read-toggle.is-read { color: #7ab87a; }
.read-toggle.no-auth { opacity: 0.4; cursor: default; }

/* Vote column */
.vote-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  flex-shrink: 0;
}

.vote-btn {
  background: var(--surface-subtle);
  border: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 0.55rem;
  padding: 0.12rem 0.35rem;
  border-radius: 6px;
  cursor: pointer;
  line-height: 1.2;
  transition: color 0.15s, border-color 0.15s;
}

.vote-btn:disabled { opacity: 0.4; cursor: default; }
.vote-btn.upvote.active, .vote-btn.upvote:not(:disabled):hover { border-color: var(--gold); color: var(--gold); }
.vote-btn.downvote.active, .vote-btn.downvote:not(:disabled):hover { border-color: #7ab87a; color: #7ab87a; }

.vote-count {
  font-family: var(--font-sans);
  font-size: 0.72rem;
  font-weight: bold;
  color: var(--text-primary);
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
