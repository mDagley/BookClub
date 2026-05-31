<template>
  <div class="spoiler-filter">
    <label class="filter-label">
      <span>Spoiler filter:</span>
      <span class="filter-hint">I'm on chapter</span>
      <input
        type="number"
        min="0"
        :value="currentChapter"
        @input="$emit('update', Math.max(0, +$event.target.value || 0))"
        class="chapter-input"
        placeholder="—"
      />
    </label>
    <span v-if="currentChapter > 0" class="filter-status">
      Showing content through Chapter {{ currentChapter }}
    </span>
    <span v-else class="filter-status">Showing all content</span>
    <button
      v-if="currentChapter > 0"
      class="filter-reset"
      @click="$emit('update', 0)"
    >Clear</button>
  </div>
</template>

<script setup>
defineProps({
  currentChapter: { type: Number, default: 0 },
})
defineEmits(['update'])
</script>

<style scoped>
.spoiler-filter {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--surface-subtle);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 0.6rem 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  font-family: var(--font-sans);
  font-size: 0.85rem;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--text-secondary);
  cursor: default;
}

.chapter-input {
  width: 60px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 0.85rem;
  padding: 0.2rem 0.4rem;
  text-align: center;
}

.chapter-input:focus {
  outline: none;
  border-color: var(--gold);
}

.filter-hint {
  color: var(--text-muted);
}

.filter-status {
  color: var(--text-muted);
  font-size: 0.78rem;
  font-style: italic;
}

.filter-reset {
  background: none;
  border: none;
  color: var(--gold);
  font-size: 0.78rem;
  cursor: pointer;
  padding: 0;
  font-family: var(--font-sans);
}

.filter-reset:hover { text-decoration: underline; }
</style>
