<template>
  <div ref="cardRef" class="cover-card" :class="{ 'has-desc': !!suggestion.description }" @mouseenter="onMouseEnter">
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

      <!-- Vote badges -->
      <div class="vote-badges">
        <button
          class="vote-btn upvote"
          :class="{ active: userVote === 1 }"
          :title="uid ? (userVote === 1 ? 'Remove upvote' : 'Upvote') : 'Login to vote'"
          :disabled="!uid"
          @click.stop="uid && emit('vote', 1)"
        >▲</button>
        <span class="vote-count">{{ suggestion.votes ?? 0 }}</span>
        <button
          class="vote-btn downvote"
          :class="{ active: userVote === -1 }"
          :title="uid ? (userVote === -1 ? 'Remove downvote' : 'Downvote') : 'Login to vote'"
          :disabled="!uid"
          @click.stop="uid && emit('vote', -1)"
        >▼</button>
      </div>

      <!-- Read badge -->
      <div
        v-if="suggestion.alreadyRead && suggestion.alreadyRead.length > 0"
        class="read-badge"
        :title="`Read by: ${readByNames}`"
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

      <!-- Comments button -->
      <button class="comments-btn" title="View comments" @click.stop="emit('open-comments')">
        💬
      </button>
    </div>

    <!-- Description tooltip — appears left or right depending on card position -->
    <div v-if="suggestion.description" class="desc-tooltip" :class="{ 'tooltip-left': tooltipFlipped }" role="tooltip">
      <p class="desc-tooltip-title">{{ suggestion.title }}</p>
      <p class="desc-tooltip-text">{{ suggestion.description }}</p>
    </div>

    <!-- Below cover -->
    <div class="cover-meta">
      <p class="cover-title">{{ suggestion.title }}</p>
      <p class="cover-author">{{ suggestion.author }}</p>
      <p v-if="formattedDate" class="cover-date">{{ formattedDate }}</p>
      <p class="cover-suggester">by {{ resolveName(suggestion.suggestedBy) }}</p>
      <button
        class="read-toggle"
        :class="{ 'is-read': hasRead, 'no-auth': !authUsername }"
        :title="!authUsername ? 'Login with Discord to mark as read' : (hasRead ? 'Remove — I haven\'t read this' : 'Mark as read')"
        @click.stop="authUsername ? emit('toggle-read') : null"
      >
        <span v-if="hasRead">✓ I've read this</span>
        <span v-else>Mark as read</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { GENRE_ICONS } from '../../utils/genres.js'
import { useMemberProfiles } from '../../composables/useMemberProfiles.js'

const props = defineProps({
  suggestion: { type: Object, required: true },
  uid: { type: String, default: null },
  authUsername: { type: String, default: null },
})

const emit = defineEmits(['vote', 'open-comments', 'toggle-read'])

const cardRef = ref(null)
const tooltipFlipped = ref(false)

function onMouseEnter() {
  if (!cardRef.value) return
  const rect = cardRef.value.getBoundingClientRect()
  tooltipFlipped.value = rect.right > window.innerWidth * 0.62
}

const { resolveName, resolveNames } = useMemberProfiles()

const userVote = computed(() => props.suggestion.votedUsers?.[props.uid] ?? 0)
const hasRead = computed(() => props.suggestion.alreadyRead?.includes(props.authUsername) ?? false)
const readByNames = computed(() => resolveNames(props.suggestion.alreadyRead).join(', '))

function formatPublishedDate(dateStr) {
  if (!dateStr) return null
  const parts = dateStr.split('-')
  if (parts.length === 1) return parts[0]
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December']
  return `${monthNames[parseInt(parts[1], 10) - 1]} ${parts[0]}`
}

const formattedDate = computed(() => formatPublishedDate(props.suggestion.publishedDate))

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
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  overflow: hidden;
  background: var(--surface-subtle);
  border: 1px solid var(--border);
  border-bottom: none;
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

/* Description tooltip beside the card */
.cover-card {
  position: relative;
}

.desc-tooltip {
  position: absolute;
  left: calc(100% + 10px);
  top: 0;
  width: 220px;
  background: var(--surface);
  border: 1px solid var(--border-hover);
  border-radius: var(--radius-md);
  padding: 0.85rem;
  z-index: 40;
  opacity: 0;
  pointer-events: none;
  transform: translateX(-6px);
  transition: opacity 0.18s ease, transform 0.18s ease;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.55), var(--glow-green);
}

.cover-card:hover .desc-tooltip {
  opacity: 1;
  transform: translateX(0);
}

.desc-tooltip.tooltip-left {
  left: auto;
  right: calc(100% + 10px);
  transform: translateX(6px);
}

.cover-card:hover .desc-tooltip.tooltip-left {
  transform: translateX(0);
}

.desc-tooltip-title {
  font-family: var(--font-serif);
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--gold);
  margin-bottom: 0.4rem;
  line-height: 1.3;
}

.desc-tooltip-text {
  font-family: var(--font-sans);
  font-size: 0.78rem;
  color: var(--text-secondary);
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 8;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (max-width: 640px) {
  .desc-tooltip { display: none; }
}

/* Vote buttons */
.vote-badges {
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  z-index: 3;
}

.vote-btn {
  background: rgba(0, 0, 0, 0.75);
  border: 1px solid rgba(200, 150, 60, 0.3);
  color: var(--text-muted);
  font-size: 0.65rem;
  padding: 0.2rem 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  line-height: 1.2;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
  backdrop-filter: blur(4px);
}

.vote-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.vote-btn.upvote.active,
.vote-btn.upvote:not(:disabled):hover {
  border-color: var(--gold);
  color: var(--gold);
}

.vote-btn.downvote.active,
.vote-btn.downvote:not(:disabled):hover {
  border-color: #7ab87a;
  color: #7ab87a;
}

.vote-count {
  font-family: var(--font-sans);
  font-size: 0.7rem;
  font-weight: bold;
  color: var(--text-primary);
  background: rgba(0, 0, 0, 0.7);
  padding: 0 0.3rem;
  border-radius: 4px;
  min-width: 1.5rem;
  text-align: center;
}

/* Mark as read toggle */
.read-toggle {
  background: none;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-dim);
  font-family: var(--font-sans);
  font-size: 0.72rem;
  padding: 0.2rem 0.5rem;
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: border-color 0.15s, color 0.15s;
  margin-top: 0.2rem;
}

.read-toggle:hover:not(.no-auth) {
  border-color: #7ab87a;
  color: #7ab87a;
}

.read-toggle.is-read {
  border-color: #7ab87a;
  color: #7ab87a;
}

.read-toggle.no-auth {
  opacity: 0.45;
  cursor: default;
}

/* Comments button */
.comments-btn {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid var(--border);
  border-radius: 50%;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  cursor: pointer;
  z-index: 3;
  opacity: 0;
  transition: opacity 0.2s;
}

.cover-card:hover .comments-btn {
  opacity: 1;
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
  padding: 0.45rem 0.5rem 0.4rem;
  background: rgba(4, 8, 20, 0.72);
  border: 1px solid var(--border);
  border-top: none;
  border-radius: 0 0 var(--radius-sm) var(--radius-sm);
  backdrop-filter: blur(4px);
}

.cover-title {
  font-family: var(--font-serif);
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.cover-author {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 0.72rem;
  color: var(--text-muted);
}

.cover-date {
  font-family: var(--font-sans);
  font-size: 0.68rem;
  color: var(--text-dim);
}

.cover-suggester {
  font-family: var(--font-sans);
  font-size: 0.68rem;
  color: var(--text-dim);
  font-style: italic;
}
</style>
