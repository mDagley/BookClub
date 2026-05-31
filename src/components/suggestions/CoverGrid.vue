<template>
  <div class="cover-grid">
    <CoverCard
      v-for="suggestion in suggestions"
      :key="suggestion.id"
      :suggestion="suggestion"
      :uid="uid"
      :auth-username="authUsername"
      @vote="(dir) => voteOnSuggestion(suggestion.id, uid, dir)"
      @open-comments="emit('open-comments', suggestion)"
      @toggle-read="emit('toggle-read', suggestion)"
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
  authUsername: { type: String, default: null },
  voteOnSuggestion: { type: Function, required: true },
})

const emit = defineEmits(['open-comments', 'toggle-read'])
</script>

<style scoped>
.cover-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(160px, 44%), 1fr));
  gap: 20px;
}

@media (max-width: 480px) {
  .cover-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
  }
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
