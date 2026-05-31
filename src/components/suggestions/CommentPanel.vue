<template>
  <Teleport to="body">
    <div class="panel-backdrop" @click.self="emit('close')" />
    <div class="comment-panel" role="dialog" aria-modal="true" :aria-label="`Comments for ${suggestion?.title}`">
      <div class="panel-header">
        <div class="panel-title-wrap">
          <p class="panel-title">Comments</p>
          <p class="panel-subtitle">{{ suggestion?.title }}</p>
        </div>
        <button class="close-btn" aria-label="Close" @click="emit('close')">✕</button>
      </div>

      <div class="panel-comments" ref="listRef">
        <div v-if="loading" class="panel-empty">Loading…</div>
        <div v-else-if="comments.length === 0" class="panel-empty">No comments yet. Be the first!</div>
        <div
          v-for="c in comments"
          :key="c.id"
          class="comment"
        >
          <img v-if="c.avatarUrl" :src="c.avatarUrl" :alt="c.displayName" class="avatar" />
          <div v-else class="avatar-placeholder">{{ (c.displayName || '?')[0].toUpperCase() }}</div>
          <div class="comment-body">
            <div class="comment-meta">
              <span class="comment-author">{{ c.displayName }}</span>
              <span class="comment-time">{{ formatTime(c.createdAt) }}</span>
              <button
                v-if="uid === c.userId"
                class="delete-btn"
                title="Delete comment"
                @click="handleDelete(c.id)"
              >✕</button>
            </div>
            <p class="comment-content">{{ c.content }}</p>
          </div>
        </div>
      </div>

      <div class="panel-footer">
        <template v-if="uid">
          <div class="input-row">
            <textarea
              v-model="draft"
              class="comment-input"
              placeholder="Add a comment…"
              rows="2"
              :disabled="submitting"
              @keydown.enter.exact.prevent="submit"
            />
            <button class="send-btn btn-gold" :disabled="!draft.trim() || submitting" @click="submit">
              Send
            </button>
          </div>
        </template>
        <p v-else class="login-prompt">
          <a href="/admin" class="login-link">Login with Discord</a> to comment.
        </p>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { useComments } from '../../composables/useComments.js'
import { useAuthStore } from '../../stores/auth.js'

const props = defineProps({
  suggestion: { type: Object, default: null },
  uid: { type: String, default: null },
})
const emit = defineEmits(['close'])

const authStore = useAuthStore()
const suggestionId = ref(props.suggestion?.id ?? null)
watch(() => props.suggestion?.id, (id) => { suggestionId.value = id ?? null })

const { comments, loading, addComment, deleteComment } = useComments(suggestionId)

const draft = ref('')
const submitting = ref(false)
const listRef = ref(null)

function formatTime(ts) {
  if (!ts) return ''
  const d = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts.seconds * 1000)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

async function submit() {
  if (!draft.value.trim() || !props.uid) return
  submitting.value = true
  try {
    await addComment(props.suggestion.id, {
      uid: props.uid,
      displayName: authStore.user?.discordUsername || 'Unknown',
      avatarUrl: authStore.user?.photoURL || null,
      content: draft.value,
    })
    draft.value = ''
    await nextTick()
    listRef.value?.scrollTo({ top: listRef.value.scrollHeight, behavior: 'smooth' })
  } finally {
    submitting.value = false
  }
}

async function handleDelete(commentId) {
  if (!props.suggestion?.id) return
  await deleteComment(props.suggestion.id, commentId)
}
</script>

<style scoped>
.panel-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 200;
}

.comment-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(400px, 100vw);
  background: var(--surface);
  border-left: 1px solid var(--border);
  z-index: 201;
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.4);
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.panel-title {
  font-family: var(--font-serif);
  font-size: 1.1rem;
  color: var(--text-primary);
  margin: 0;
}

.panel-subtitle {
  font-family: var(--font-sans);
  font-size: 0.78rem;
  color: var(--text-muted);
  margin: 0.1rem 0 0;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 0.85rem;
  cursor: pointer;
  padding: 0.15rem 0.4rem;
  border-radius: var(--radius-sm);
  transition: color 0.15s;
  flex-shrink: 0;
}

.close-btn:hover { color: var(--text-primary); }

.panel-comments {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.panel-empty {
  color: var(--text-muted);
  font-family: var(--font-sans);
  font-size: 0.85rem;
  text-align: center;
  padding: 2rem 0;
}

.comment {
  display: flex;
  gap: 0.65rem;
  align-items: flex-start;
}

.avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 1px solid var(--border);
}

.avatar-placeholder {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  flex-shrink: 0;
  background: var(--surface-subtle);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-sans);
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.comment-body {
  flex: 1;
  min-width: 0;
}

.comment-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.2rem;
}

.comment-author {
  font-family: var(--font-sans);
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-primary);
}

.comment-time {
  font-family: var(--font-sans);
  font-size: 0.68rem;
  color: var(--text-dim);
}

.delete-btn {
  background: none;
  border: none;
  color: var(--text-dim);
  font-size: 0.65rem;
  cursor: pointer;
  padding: 0.1rem;
  margin-left: auto;
  opacity: 0.6;
  transition: opacity 0.15s, color 0.15s;
}
.delete-btn:hover { opacity: 1; color: #f28b82; }

.comment-content {
  font-family: var(--font-sans);
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.5;
  word-break: break-word;
}

.panel-footer {
  padding: 0.85rem 1.25rem;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}

.input-row {
  display: flex;
  gap: 0.5rem;
  align-items: flex-end;
}

.comment-input {
  flex: 1;
  background: var(--surface-subtle);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 0.82rem;
  padding: 0.5rem 0.7rem;
  resize: none;
  transition: border-color 0.2s;
}

.comment-input:focus { outline: none; border-color: var(--border-hover); }

.send-btn {
  background: var(--gold);
  color: var(--bg);
  border: none;
  border-radius: var(--radius-sm);
  font-family: var(--font-sans);
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.45rem 0.85rem;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.15s;
  flex-shrink: 0;
}

.send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.login-prompt {
  font-family: var(--font-sans);
  font-size: 0.82rem;
  color: var(--text-muted);
  text-align: center;
}

.login-link {
  color: var(--gold);
  text-decoration: none;
}

.login-link:hover { text-decoration: underline; }
</style>
