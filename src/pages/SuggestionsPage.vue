<template>
  <div class="suggestions-page">
    <SuggestionsToolbar
      :family-members="familyMembers"
      :selected-member="selectedMember"
      :filter-mode="filterMode"
      :selected-genres="selectedGenres"
      :sort-mode="sortMode"
      :view="view"
      :total="filteredSuggestions.length"
      @update:selected-member="selectedMember = $event"
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
      :has-voted="hasVoted"
      :cast-vote="castVote"
    />

    <ListView
      v-else
      :suggestions="filteredSuggestions"
      :has-voted="hasVoted"
      :cast-vote="castVote"
    />

    <SuggestModal
      v-if="showModal"
      :add-suggestion="addSuggestion"
      @close="showModal = false"
      @submitted="showModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSuggestions } from '../composables/useSuggestions.js'
import { useVoting } from '../composables/useVoting.js'
import { useConfig } from '../composables/useConfig.js'
import SuggestionsToolbar from '../components/suggestions/SuggestionsToolbar.vue'
import CoverGrid from '../components/suggestions/CoverGrid.vue'
import ListView from '../components/suggestions/ListView.vue'
import SuggestModal from '../components/suggestions/SuggestModal.vue'

// Composables
const { suggestions, loading, addSuggestion, upvoteSuggestion } = useSuggestions()
const { hasVoted, castVote } = useVoting(upvoteSuggestion)
const { familyMembers } = useConfig()

// Page state
const view = ref('grid')
const showModal = ref(false)
const selectedMember = ref(localStorage.getItem('bookclub_iam') || null)
const filterMode = ref('all')
const selectedGenres = ref([])
const sortMode = ref('votes')

// Computed filtered + sorted suggestions
const filteredSuggestions = computed(() => {
  let list = [...suggestions.value]

  // 1. Genre filter (OR — matches any selected genre)
  if (selectedGenres.value.length) {
    list = list.filter(s => selectedGenres.value.some(g => (s.genres || []).includes(g)))
  }

  // 2. Filter mode
  if (filterMode.value === 'unread') {
    list = list.filter(s => !s.alreadyRead || s.alreadyRead.length === 0)
  } else if (filterMode.value === 'mine' && selectedMember.value) {
    list = list.filter(s => !(s.alreadyRead || []).includes(selectedMember.value))
  }

  // 3. Sort
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

/* Skeleton loading grid */
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
