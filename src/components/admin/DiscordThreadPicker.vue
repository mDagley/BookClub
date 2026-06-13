<template>
  <div class="thread-picker">
    <div class="thread-url-row">
      <input
        :value="modelValue"
        type="url"
        class="form-input"
        placeholder="https://discord.com/channels/…"
        @input="emit('update:modelValue', $event.target.value)"
      />
      <button type="button" class="btn btn-secondary btn-sm pick-btn" :disabled="loading" @click="fetchThreads">
        {{ loading ? 'Loading…' : 'Pick Thread' }}
      </button>
    </div>

    <div v-if="error" class="picker-error">{{ error }}</div>

    <div v-if="showDropdown" class="thread-dropdown">
      <div class="thread-search-row">
        <input
          ref="searchInput"
          v-model="search"
          type="text"
          class="thread-search"
          placeholder="Search threads…"
          @keydown.escape.stop="showDropdown = false"
        />
        <button type="button" class="close-picker" @click="showDropdown = false">✕</button>
      </div>
      <div class="thread-list">
        <button
          v-for="thread in filteredThreads"
          :key="thread.id"
          type="button"
          class="thread-option"
          @click="selectThread(thread)"
        >
          <span class="thread-name">{{ thread.name }}</span>
          <span v-if="thread.createdAt" class="thread-date">{{ formatDate(thread.createdAt) }}</span>
        </button>
        <div v-if="!filteredThreads.length" class="thread-empty">
          No threads match "{{ search }}"
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])

const threads = ref([])
const loading = ref(false)
const error = ref('')
const showDropdown = ref(false)
const search = ref('')
const searchInput = ref(null)

const filteredThreads = computed(() => {
  if (!search.value.trim()) return threads.value
  const q = search.value.toLowerCase()
  return threads.value.filter(t => t.name.toLowerCase().includes(q))
})

async function fetchThreads() {
  loading.value = true
  error.value = ''
  showDropdown.value = false
  try {
    const res = await fetch('/api/discord-threads')
    const data = await res.json()
    if (!res.ok) {
      error.value = data.error || 'Failed to load threads'
      return
    }
    threads.value = data.threads || []
    search.value = ''
    showDropdown.value = true
    await nextTick()
    searchInput.value?.focus()
  } catch {
    error.value = 'Could not connect to server'
  } finally {
    loading.value = false
  }
}

function selectThread(thread) {
  emit('update:modelValue', thread.url)
  showDropdown.value = false
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d)) return ''
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}
</script>

<style scoped>
.thread-picker {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.thread-url-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.thread-url-row .form-input { flex: 1; }

.pick-btn { white-space: nowrap; flex-shrink: 0; }

.picker-error {
  font-family: var(--font-sans);
  font-size: 0.78rem;
  color: #f28b82;
}

.thread-dropdown {
  background: var(--surface);
  border: 1px solid var(--border-hover);
  border-radius: var(--radius-md);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
  overflow: hidden;
}

.thread-search-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.6rem;
  border-bottom: 1px solid var(--border);
}

.thread-search {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 0.85rem;
  outline: none;
}

.thread-search::placeholder { color: var(--text-muted); }

.close-picker {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.8rem;
  padding: 0.1rem 0.3rem;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}
.close-picker:hover { color: var(--text-primary); }

.thread-list {
  max-height: 220px;
  overflow-y: auto;
}

.thread-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  text-align: left;
  transition: background 0.1s;
}

.thread-option:last-child { border-bottom: none; }
.thread-option:hover { background: var(--surface-subtle); }

.thread-name {
  font-family: var(--font-sans);
  font-size: 0.85rem;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.thread-date {
  font-family: var(--font-sans);
  font-size: 0.72rem;
  color: var(--text-muted);
  white-space: nowrap;
  flex-shrink: 0;
}

.thread-empty {
  padding: 0.75rem;
  font-family: var(--font-sans);
  font-size: 0.82rem;
  color: var(--text-muted);
  text-align: center;
  font-style: italic;
}
</style>
