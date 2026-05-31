<template>
  <div class="cover-grid">
    <CoverCard
      v-for="suggestion in suggestions"
      :key="suggestion.id"
      :suggestion="suggestion"
      :uid="uid"
      @vote="(dir) => voteOnSuggestion(suggestion.id, uid, dir)"
      @open-comments="emit('open-comments', suggestion)"
    />
    <div v-if="suggestions.length === 0" class="empty-state">
      <p>No suggestions match your filters.</p>
    </div>
  </div>
</template>

<script setup>
import CoverCard from './CoverCard.vue'

defineProps({
  suggestions: { type: Array, required: true },
  uid: { type: String, default: null },
  voteOnSuggestion: { type: Function, required: true },
})

const emit = defineEmits(['open-comments'])
</script>

<style scoped>
.cover-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 20px;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-muted);
  font-family: var(--font-sans);
  font-size: 0.9rem;
}
</style>
