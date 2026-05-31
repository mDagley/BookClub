<template>
  <div class="toolbar">
    <!-- 1. "I am" dropdown -->
    <div class="toolbar-group">
      <label class="toolbar-label" for="toolbar-iam">I am</label>
      <select
        id="toolbar-iam"
        class="toolbar-select"
        :value="selectedMember"
        @change="onMemberChange"
      >
        <option value="">— select name —</option>
        <option v-for="name in familyMembers" :key="name" :value="name">{{ name }}</option>
      </select>
    </div>

    <!-- 2. Filter chips -->
    <div class="toolbar-group filter-chips">
      <button
        class="chip chip-toggle"
        :class="{ active: filterMode === 'all' }"
        @click="emit('update:filterMode', 'all')"
      >All</button>
      <button
        class="chip chip-toggle"
        :class="{ active: filterMode === 'unread' }"
        @click="emit('update:filterMode', 'unread')"
      >Not read by anyone</button>
      <button
        v-if="selectedMember"
        class="chip chip-toggle"
        :class="{ active: filterMode === 'mine' }"
        @click="emit('update:filterMode', 'mine')"
      >I haven't read</button>
    </div>

    <!-- 3. Genre dropdown -->
    <div class="toolbar-group">
      <select
        class="toolbar-select"
        aria-label="Filter by genre"
        :value="selectedGenre ?? ''"
        @change="emit('update:selectedGenre', $event.target.value || null)"
      >
        <option value="">All genres</option>
        <option v-for="genre in GENRE_LIST" :key="genre" :value="genre">{{ genre }}</option>
      </select>
    </div>

    <!-- 4. Sort dropdown -->
    <div class="toolbar-group">
      <select
        class="toolbar-select"
        aria-label="Sort order"
        :value="sortMode"
        @change="emit('update:sortMode', $event.target.value)"
      >
        <option value="votes">Most votes</option>
        <option value="newest">Newest</option>
      </select>
    </div>

    <!-- 5. View toggle -->
    <div class="toolbar-group view-toggle">
      <button
        class="view-btn"
        :class="{ active: view === 'grid' }"
        title="Grid view"
        aria-label="Grid view"
        :aria-pressed="view === 'grid'"
        @click="emit('update:view', 'grid')"
      >⊞</button>
      <button
        class="view-btn"
        :class="{ active: view === 'list' }"
        title="List view"
        aria-label="List view"
        :aria-pressed="view === 'list'"
        @click="emit('update:view', 'list')"
      >☰</button>
    </div>

    <!-- 6. Suggest button -->
    <button class="btn btn-gold suggest-btn" @click="emit('open-modal')">
      + Suggest
    </button>

    <!-- Count -->
    <span class="toolbar-count">{{ total }} book{{ total === 1 ? '' : 's' }}</span>
  </div>
</template>

<script setup>
import { GENRE_LIST } from '../../utils/genres.js'

defineProps({
  familyMembers: { type: Array, default: () => [] },
  selectedMember: { type: String, default: null },
  filterMode: { type: String, default: 'all' },
  selectedGenre: { type: String, default: null },
  sortMode: { type: String, default: 'votes' },
  view: { type: String, default: 'grid' },
  total: { type: Number, default: 0 },
})

const emit = defineEmits([
  'update:selectedMember',
  'update:filterMode',
  'update:selectedGenre',
  'update:sortMode',
  'update:view',
  'open-modal',
])

const LS_KEY = 'bookclub_iam'

function onMemberChange(event) {
  const val = event.target.value || null
  if (val) {
    localStorage.setItem(LS_KEY, val)
  } else {
    localStorage.removeItem(LS_KEY)
  }
  emit('update:selectedMember', val)
}
</script>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.toolbar-label {
  font-family: var(--font-sans);
  font-size: 0.78rem;
  color: var(--text-muted);
  white-space: nowrap;
}

.toolbar-select {
  background: var(--surface-subtle);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 0.8rem;
  padding: 0.3rem 0.6rem;
  cursor: pointer;
  transition: border-color 0.2s;
}

.toolbar-select:hover,
.toolbar-select:focus {
  border-color: var(--border-hover);
  outline: none;
}

/* Filter chip toggles */
.filter-chips {
  flex-wrap: wrap;
}

.chip-toggle {
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
  font-size: 0.72rem;
  padding: 0.25rem 0.7rem;
}

.chip-toggle:hover {
  border-color: var(--border-hover);
  color: var(--text-primary);
}

.chip-toggle.active {
  border-color: var(--gold);
  color: var(--gold);
  background: rgba(200, 150, 60, 0.12);
}

/* View toggle */
.view-toggle {
  background: var(--surface-subtle);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 2px;
  gap: 2px;
}

.view-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 1rem;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  cursor: pointer;
  line-height: 1;
  transition: color 0.15s, background 0.15s;
}

.view-btn:hover {
  color: var(--text-primary);
}

.view-btn.active {
  color: var(--gold);
  background: rgba(200, 150, 60, 0.15);
}

.suggest-btn {
  margin-left: auto;
  font-weight: 600;
  font-size: 0.82rem;
  padding: 0.4rem 0.9rem;
}

.toolbar-count {
  font-family: var(--font-sans);
  font-size: 0.75rem;
  color: var(--text-muted);
  white-space: nowrap;
}

@media (max-width: 640px) {
  .suggest-btn {
    margin-left: 0;
  }
}
</style>
