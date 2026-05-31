<template>
  <div class="suggestions-page">
    <SuggestionsToolbar
      :filter-mode="filterMode"
      :selected-genres="selectedGenres"
      :sort-mode="sortMode"
      :view="view"
      :total="filteredSuggestions.length"
      @update:filter-mode="filterMode = $event"
      @update:selected-genres="selectedGenres = $event"
      @update:sort-mode="sortMode = $event"
      @update:view="view = $event"
      @open-modal="showModal = true"
    />

    <div v-if="loading" class="loading-grid">
      <div v-for="n in 8" :key="n" class="skeleton skeleton-card" />
    </div>

    <CoverGrid
      v-else-if="view === 'grid'"
      :suggestions="filteredSuggestions"
      :uid="uid"
      :auth-username="authUsername"
      :vote-on-suggestion="voteOnSuggestion"
      @open-comments="openComments"
      @toggle-read="handleToggleRead"
    />

    <ListView
      v-else
      :suggestions="filteredSuggestions"
      :uid="uid"
      :auth-username="authUsername"
      :vote-on-suggestion="voteOnSuggestion"
      @toggle-read="handleToggleRead"
    />

    <SuggestModal
      v-if="showModal"
      :add-suggestion="addSuggestion"
      @close="showModal = false"
      @submitted="showModal = false"
    />

    <CommentPanel
      v-if="commentSuggestion"
      :suggestion="commentSuggestion"
      :uid="uid"
      @close="commentSuggestion = null"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSuggestions } from '../composables/useSuggestions.js'
import { useAuthStore } from '../stores/auth.js'
import SuggestionsToolbar from '../components/suggestions/SuggestionsToolbar.vue'
import CoverGrid from '../components/suggestions/CoverGrid.vue'
import ListView from '../components/suggestions/ListView.vue'
import SuggestModal from '../components/suggestions/SuggestModal.vue'
import CommentPanel from '../components/suggestions/CommentPanel.vue'

const { suggestions, loading, addSuggestion, voteOnSuggestion, toggleAlreadyRead } = useSuggestions()
const authStore = useAuthStore()

const uid = computed(() => authStore.user?.uid ?? null)
const authUsername = computed(() => authStore.user?.discordUsername ?? null)

function handleToggleRead(suggestion) {
  if (!authUsername.value) return
  const isRead = suggestion.alreadyRead?.includes(authUsername.value) ?? false
  toggleAlreadyRead(suggestion.id, authUsername.value, isRead)
}

const view = ref('grid')
const showModal = ref(false)
const commentSuggestion = ref(null)
const filterMode = ref('all')

function openComments(suggestion) {
  commentSuggestion.value = suggestion
}
const selectedGenres = ref([])
const sortMode = ref('votes')

const filteredSuggestions = computed(() => {
  let list = [...suggestions.value]

  if (selectedGenres.value.length) {
    list = list.filter(s => selectedGenres.value.some(g => (s.genres || []).includes(g)))
  }

  if (filterMode.value === 'unread') {
    list = list.filter(s => !s.alreadyRead || s.alreadyRead.length === 0)
  }

  if (sortMode.value === 'votes') {
    list.sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0))
  } else if (sortMode.value === 'newest') {
    list.sort((a, b) => {
      const toMs = (ts) => {
        if (!ts) return 0
        if (typeof ts.toMillis === 'function') return ts.toMillis()
        if (ts.seconds != null) return ts.seconds * 1000
        if (ts instanceof Date) return ts.getTime()
        return 0
      }
      return toMs(b.createdAt) - toMs(a.createdAt)
    })
  }

  return list
})
</script>

<style scoped>
.suggestions-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.loading-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 20px;
}

.skeleton-card {
  aspect-ratio: 2 / 3;
  border-radius: var(--radius-sm);
}
</style>
