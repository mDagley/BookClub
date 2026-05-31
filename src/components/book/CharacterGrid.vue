<template>
  <section class="book-section card">
    <p class="section-title">Characters</p>
    <div class="character-grid">
      <div
        v-for="char in sortedCharacters"
        :key="`${char.name}-${char.firstAppearanceChapter}`"
        class="character-card"
        :class="{ spoiled: !isVisible(char.firstAppearanceChapter) }"
      >
        <template v-if="isVisible(char.firstAppearanceChapter)">
          <p class="char-name">{{ char.name }}</p>
          <p class="char-desc">{{ char.description }}</p>
          <p class="char-chapter">Introduced in Chapter {{ char.firstAppearanceChapter }}</p>
        </template>
        <div v-else class="spoiler-placeholder">
          <p>Spoiler — set your chapter above to reveal</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  characters: { type: Array, required: true },
  currentChapter: { type: Number, default: 0 },
  isVisible: { type: Function, required: true },
})

const sortedCharacters = computed(() =>
  [...props.characters].sort((a, b) => {
    if (a.isMajor && !b.isMajor) return -1
    if (!a.isMajor && b.isMajor) return 1
    return a.firstAppearanceChapter - b.firstAppearanceChapter
  })
)
</script>

<style scoped>
.character-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
}

.character-card {
  background: var(--surface-subtle);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.char-name {
  font-family: var(--font-serif);
  font-size: 0.95rem;
  color: var(--gold);
}

.char-desc {
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.char-chapter {
  font-family: var(--font-sans);
  font-size: 0.7rem;
  color: var(--text-dim);
  margin-top: auto;
}

.spoiled {
  user-select: none;
  cursor: not-allowed;
}

.spoiler-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80px;
  font-family: var(--font-sans);
  font-size: 0.75rem;
  color: var(--text-dim);
  text-align: center;
  padding: 0.5rem;
}
</style>
