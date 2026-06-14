<template>
  <section class="book-section card">
    <p class="section-title">Supplemental Materials</p>
    <ul class="materials-list">
      <li v-for="m in materials" :key="`${m.type}-${m.title}`" class="material-row">
        <span class="type-badge" :class="`type-${m.type}`">{{ m.type }}</span>
        <a v-if="m.url" :href="m.url" target="_blank" rel="noopener" class="material-link">
          {{ m.title }}
        </a>
        <span v-else class="material-title">{{ m.title }}</span>
      </li>
    </ul>
  </section>
</template>

<script setup>
defineProps({
  materials: { type: Array, required: true },
})
</script>

<style scoped>
.materials-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.material-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.type-badge {
  font-family: var(--font-sans);
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 0.15rem 0.45rem;
  border-radius: 10px;
  border: 1px solid var(--border);
  color: var(--text-muted);
  white-space: nowrap;
}

.type-article  { border-color: #5865F2; color: #8891f7; }
.type-video    { border-color: #c8963c; color: var(--gold); }
.type-podcast  { border-color: #7ab87a; color: #7ab87a; }
.type-map      { border-color: #4a8a52; color: #7ab87a; }
.type-other    { border-color: #6a6a6a; color: #a0a0a0; }

.material-link {
  font-size: 0.9rem;
  color: var(--text-primary);
  text-decoration: none;
}

.material-link:hover {
  color: var(--gold);
  text-decoration: underline;
}

.material-title {
  font-size: 0.9rem;
  color: var(--text-secondary);
}
</style>
