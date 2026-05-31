<template>
  <div class="toolbar">
    <!-- 1. Filter chips -->
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
    </div>

    <!-- 3. Genre multi-select -->
    <div class="toolbar-group genre-filter-group" ref="genreRef">
      <button
        class="genre-filter-btn"
        :class="{ active: selectedGenres.length > 0 }"
        @click="showGenrePanel = !showGenrePanel"
        aria-haspopup="true"
        :aria-expanded="showGenrePanel"
      >
        Genres
        <span v-if="selectedGenres.length" class="genre-count">{{ selectedGenres.length }}</span>
        <span class="genre-chevron">{{ showGenrePanel ? '▲' : '▼' }}</span>
      </button>

      <div v-if="showGenrePanel" class="genre-panel">
        <div class="genre-panel-chips">
          <button
            v-for="genre in GENRE_LIST"
            :key="genre"
            class="chip genre-chip"
            :class="{ active: selectedGenres.includes(genre) }"
            @click="toggleGenre(genre)"
          >
            <img v-if="GENRE_ICONS[genre]?.img" :src="GENRE_ICONS[genre].img" :alt="genre" class="chip-icon" />
            <span v-else class="chip-icon">{{ GENRE_ICONS[genre]?.icon }}</span>
            {{ genre }}
          </button>
        </div>
        <button
          v-if="selectedGenres.length"
          class="genre-clear"
          @click="emit('update:selectedGenres', [])"
        >
          Clear all
        </button>
      </div>
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
import { ref, onMounted, onUnmounted } from 'vue'
import { GENRE_LIST, GENRE_ICONS } from '../../utils/genres.js'

const props = defineProps({
  filterMode: { type: String, default: 'all' },
  selectedGenres: { type: Array, default: () => [] },
  sortMode: { type: String, default: 'votes' },
  view: { type: String, default: 'grid' },
  total: { type: Number, default: 0 },
})

const emit = defineEmits([
  'update:filterMode',
  'update:selectedGenres',
  'update:sortMode',
  'update:view',
  'open-modal',
])

const showGenrePanel = ref(false)
const genreRef = ref(null)

function toggleGenre(genre) {
  const current = [...props.selectedGenres]
  const idx = current.indexOf(genre)
  if (idx === -1) current.push(genre)
  else current.splice(idx, 1)
  emit('update:selectedGenres', current)
}

function onClickOutside(e) {
  if (genreRef.value && !genreRef.value.contains(e.target)) {
    showGenrePanel.value = false
  }
}
onMounted(() => document.addEventListener('mousedown', onClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', onClickOutside))
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

/* Genre multi-select */
.genre-filter-group {
  position: relative;
}

.genre-filter-btn {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: var(--surface-subtle);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-family: var(--font-sans);
  font-size: 0.8rem;
  padding: 0.3rem 0.6rem;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}

.genre-filter-btn:hover,
.genre-filter-btn.active {
  border-color: var(--gold);
  color: var(--gold);
}

.genre-count {
  background: var(--gold);
  color: var(--bg);
  font-size: 0.65rem;
  font-weight: 700;
  border-radius: 10px;
  padding: 0.05rem 0.4rem;
  line-height: 1.4;
}

.genre-chevron {
  font-size: 0.55rem;
  opacity: 0.6;
}

.genre-panel {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 50;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 0.75rem;
  min-width: 280px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.genre-panel-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.genre-chip {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  padding: 0.25rem 0.6rem;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}

.genre-chip.active {
  border-color: var(--gold);
  color: var(--gold);
  background: rgba(200, 150, 60, 0.12);
}

.chip-icon {
  width: 1em;
  height: 1em;
  object-fit: contain;
  vertical-align: middle;
}

.genre-clear {
  margin-top: 0.6rem;
  padding: 0.2rem 0.6rem;
  font-family: var(--font-sans);
  font-size: 0.72rem;
  color: var(--text-muted);
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  width: 100%;
  transition: border-color 0.15s, color 0.15s;
}

.genre-clear:hover {
  border-color: var(--border-hover);
  color: var(--text-primary);
}

@media (max-width: 640px) {
  .suggest-btn { margin-left: 0; }
  .genre-panel { left: auto; right: 0; }
}
</style>
