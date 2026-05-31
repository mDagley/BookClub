<template>
  <div class="admin-current-book">
    <div class="section-header">
      <h2 class="section-heading">Current Book</h2>
      <div class="header-actions">
        <button class="btn btn-secondary" @click="archiveBook" :disabled="saving">
          Archive Book
        </button>
        <button class="btn btn-primary" @click="saveBook" :disabled="saving">
          {{ saving ? 'Saving…' : 'Save Current Book' }}
        </button>
      </div>
    </div>

    <p v-if="saveMessage" class="save-message" :class="saveMessageType">{{ saveMessage }}</p>

    <!-- Core Info -->
    <div class="form-section">
      <h3 class="form-section-title">Book Info</h3>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Title</label>
          <input
            v-model="form.title"
            type="text"
            class="form-input"
            placeholder="Book title"
            @blur="fetchCover"
          />
        </div>
        <div class="form-group">
          <label class="form-label">Author</label>
          <input
            v-model="form.author"
            type="text"
            class="form-input"
            placeholder="Author name"
            @blur="fetchCover"
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group form-group--full">
          <label class="form-label">Custom Cover URL <span class="label-note">(overrides auto-fetch)</span></label>
          <input
            v-model="form.coverUrl"
            type="url"
            class="form-input"
            placeholder="https://…"
          />
        </div>
      </div>

      <!-- Cover preview -->
      <div v-if="coverPreview" class="cover-preview">
        <img :src="coverPreview" alt="Cover preview" class="cover-thumb" />
        <span class="cover-label">{{ form.coverUrl ? 'Custom cover' : 'Auto-fetched cover' }}</span>
      </div>
      <div v-else-if="coverFetching" class="cover-fetching">Fetching cover…</div>

      <div class="form-group">
        <label class="form-label">Goodreads URL</label>
        <input v-model="form.goodreadsUrl" type="url" class="form-input" placeholder="https://goodreads.com/book/…" />
      </div>

      <div class="form-group">
        <label class="form-label">Synopsis <span class="label-note">(short, shown on dashboard)</span></label>
        <textarea v-model="form.synopsis" class="form-textarea" rows="3" placeholder="Brief synopsis…"></textarea>
      </div>

      <div class="form-group">
        <label class="form-label">Full Description</label>
        <textarea v-model="form.description" class="form-textarea" rows="8" placeholder="Full book description…"></textarea>
      </div>
    </div>

    <!-- Genres -->
    <div class="form-section">
      <h3 class="form-section-title">Genres</h3>
      <div class="genre-grid">
        <label
          v-for="genre in GENRE_LIST"
          :key="genre"
          class="genre-checkbox"
          :class="{ active: form.genres?.includes(genre) }"
        >
          <input
            type="checkbox"
            :value="genre"
            v-model="form.genres"
            class="genre-input"
          />
          {{ genre }}
        </label>
      </div>
    </div>

    <!-- Meeting Details -->
    <div class="form-section">
      <h3 class="form-section-title">Meeting Details</h3>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Date</label>
          <input v-model="form.meetingDate" type="date" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">Time</label>
          <input v-model="form.meetingTime" type="time" class="form-input" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Location</label>
          <input v-model="form.meetingLocation" type="text" class="form-input" placeholder="Location or 'Online'" />
        </div>
        <div class="form-group">
          <label class="form-label">Discord Voice URL</label>
          <input v-model="form.discordVoiceUrl" type="url" class="form-input" placeholder="https://discord.com/channels/…" />
        </div>
      </div>
    </div>

    <!-- Discord Threads -->
    <div class="form-section">
      <h3 class="form-section-title">Discord Threads</h3>
      <p class="section-note">First thread is shown as the primary link on the dashboard. Drag rows to reorder.</p>
      <div class="list-editor">
        <div
          v-for="(thread, index) in form.threads"
          :key="thread._key"
          class="list-row"
          draggable="true"
          @dragstart="onDragStart($event, 'threads', index)"
          @dragover.prevent="onDragOver($event, 'threads', index)"
          @drop.prevent="onDrop($event, 'threads', index)"
          @dragend="onDragEnd"
          :class="{ 'drag-over': dragState.list === 'threads' && dragState.overIndex === index }"
        >
          <span class="drag-handle" title="Drag to reorder">⠿</span>
          <div class="thread-fields">
            <input
              v-model="thread.title"
              type="text"
              class="form-input"
              :placeholder="index === 0 ? 'Thread title (Primary)' : 'Thread title'"
            />
            <input
              v-model="thread.url"
              type="url"
              class="form-input"
              placeholder="https://discord.com/channels/…"
            />
          </div>
          <span v-if="index === 0" class="primary-badge">Primary</span>
          <button class="btn-icon btn-delete" @click="removeItem('threads', index)" title="Remove thread">✕</button>
        </div>
        <button class="btn btn-add" @click="addThread">+ Add Thread</button>
      </div>
    </div>

    <!-- Supplemental Materials -->
    <div class="form-section">
      <h3 class="form-section-title">Supplemental Materials</h3>
      <div class="list-editor">
        <div
          v-for="(material, index) in form.materials"
          :key="material._key"
          class="list-row"
        >
          <div class="material-fields">
            <input
              v-model="material.title"
              type="text"
              class="form-input"
              placeholder="Material title"
            />
            <input
              v-model="material.url"
              type="url"
              class="form-input"
              placeholder="https://…"
            />
            <select v-model="material.type" class="form-select">
              <option value="Article">Article</option>
              <option value="Video">Video</option>
              <option value="Podcast">Podcast</option>
              <option value="Map">Map</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <button class="btn-icon btn-delete" @click="removeItem('materials', index)" title="Remove material">✕</button>
        </div>
        <button class="btn btn-add" @click="addMaterial">+ Add Material</button>
      </div>
    </div>

    <!-- Characters -->
    <div class="form-section">
      <h3 class="form-section-title">Characters</h3>
      <div class="cards-editor">
        <div
          v-for="(char, index) in form.characters"
          :key="char._key"
          class="character-card"
        >
          <div v-if="char._editing" class="character-form">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Name</label>
                <input v-model="char.name" type="text" class="form-input" placeholder="Character name" />
              </div>
              <div class="form-group">
                <label class="form-label">First Appearance Chapter</label>
                <input v-model.number="char.firstAppearance" type="number" class="form-input" placeholder="Chapter #" min="1" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea v-model="char.description" class="form-textarea" rows="3" placeholder="Character description…"></textarea>
            </div>
            <label class="checkbox-label">
              <input type="checkbox" v-model="char.major" />
              Major character
            </label>
            <div class="card-actions">
              <button class="btn btn-primary btn-sm" @click="char._editing = false">Done</button>
            </div>
          </div>
          <div v-else class="character-summary">
            <div class="char-info">
              <strong class="char-name">{{ char.name || '(unnamed)' }}</strong>
              <span v-if="char.major" class="major-badge">Major</span>
              <span class="char-desc">{{ char.description?.slice(0, 80) }}{{ char.description?.length > 80 ? '…' : '' }}</span>
            </div>
            <div class="card-actions">
              <button class="btn btn-secondary btn-sm" @click="char._editing = true">Edit</button>
              <button class="btn-icon btn-delete" @click="removeItem('characters', index)" title="Remove character">✕</button>
            </div>
          </div>
        </div>
        <button class="btn btn-add" @click="addCharacter">+ Add Character</button>
      </div>
    </div>

    <!-- Timeline -->
    <div class="form-section">
      <h3 class="form-section-title">Timeline</h3>
      <p class="section-note">Drag rows to reorder.</p>
      <div class="list-editor">
        <div
          v-for="(event, index) in form.timeline"
          :key="event._key"
          class="list-row"
          draggable="true"
          @dragstart="onDragStart($event, 'timeline', index)"
          @dragover.prevent="onDragOver($event, 'timeline', index)"
          @drop.prevent="onDrop($event, 'timeline', index)"
          @dragend="onDragEnd"
          :class="{ 'drag-over': dragState.list === 'timeline' && dragState.overIndex === index }"
        >
          <span class="drag-handle" title="Drag to reorder">⠿</span>
          <div class="timeline-fields">
            <input
              v-model.number="event.chapter"
              type="number"
              class="form-input form-input--narrow"
              placeholder="Ch."
              min="1"
            />
            <input
              v-model="event.label"
              type="text"
              class="form-input"
              placeholder="Event label"
            />
            <input
              v-model="event.note"
              type="text"
              class="form-input"
              placeholder="Note (optional)"
            />
          </div>
          <button class="btn-icon btn-delete" @click="removeItem('timeline', index)" title="Remove event">✕</button>
        </div>
        <button class="btn btn-add" @click="addTimelineEvent">+ Add Event</button>
      </div>
    </div>

    <!-- Bottom save -->
    <div class="form-footer">
      <p v-if="saveMessage" class="save-message" :class="saveMessageType">{{ saveMessage }}</p>
      <div class="footer-actions">
        <button class="btn btn-secondary" @click="archiveBook" :disabled="saving">Archive Book</button>
        <button class="btn btn-primary" @click="saveBook" :disabled="saving">
          {{ saving ? 'Saving…' : 'Save Current Book' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase.js'
import { useConfig } from '../../composables/useConfig.js'
import { usePastBooks } from '../../composables/usePastBooks.js'
import { fetchCoverUrl } from '../../utils/googleBooks.js'
import { GENRE_LIST } from '../../utils/genres.js'

const { currentBook } = useConfig()
const { addPastBook } = usePastBooks()

// Props — allow AdminPage to pre-fill from a promoted suggestion
const props = defineProps({
  prefill: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['prefill-consumed'])

let _keyCounter = 0
const nextKey = () => ++_keyCounter

const saving = ref(false)
const saveMessage = ref('')
const saveMessageType = ref('success')
const coverPreview = ref('')
const coverFetching = ref(false)

const dragState = ref({ list: null, fromIndex: null, overIndex: null })

function emptyForm() {
  return {
    title: '',
    author: '',
    coverUrl: '',
    goodreadsUrl: '',
    synopsis: '',
    description: '',
    genres: [],
    meetingDate: '',
    meetingTime: '',
    meetingLocation: '',
    discordVoiceUrl: '',
    threads: [],
    materials: [],
    characters: [],
    timeline: [],
  }
}

const form = ref(emptyForm())

// Populate form from currentBook (Firestore data)
function populateFromBook(book) {
  if (!book) {
    form.value = emptyForm()
    coverPreview.value = ''
    return
  }
  const meeting = book.meeting || {}
  form.value = {
    title: book.title || '',
    author: book.author || '',
    coverUrl: book.coverUrl || '',
    goodreadsUrl: book.goodreadsUrl || '',
    synopsis: book.synopsis || '',
    description: book.fullDescription || book.description || '',
    genres: Array.isArray(book.genres) ? [...book.genres] : [],
    meetingDate: meeting.date || '',
    meetingTime: meeting.time || '',
    meetingLocation: meeting.location || '',
    discordVoiceUrl: meeting.discordVoiceUrl || '',
    threads: (book.discordThreads || []).map(t => ({ ...t, _key: nextKey() })),
    materials: (book.supplementalMaterials || []).map(m => ({ ...m, _key: nextKey() })),
    characters: (book.characters || []).map(c => ({
      name: c.name || '',
      description: c.description || '',
      firstAppearance: c.firstAppearanceChapter ?? null,
      major: c.isMajor ?? false,
      _key: nextKey(),
      _editing: false,
    })),
    timeline: (book.timeline || []).map(e => ({ ...e, _key: nextKey() })),
  }
  coverPreview.value = book.coverUrl || ''
}

onMounted(() => {
  populateFromBook(currentBook.value)
})

let _ignoreNextSnapshot = false

watch(currentBook, (book) => {
  if (_ignoreNextSnapshot) { _ignoreNextSnapshot = false; return }
  populateFromBook(book)
})

// Handle prefill from promoted suggestion
watch(() => props.prefill, (prefill) => {
  if (prefill) {
    populateFromBook(prefill)
    emit('prefill-consumed')
  }
}, { immediate: true })

async function fetchCover() {
  if (form.value.coverUrl) {
    coverPreview.value = form.value.coverUrl
    return
  }
  if (!form.value.title && !form.value.author) return
  coverFetching.value = true
  const url = await fetchCoverUrl(form.value.title, form.value.author)
  coverFetching.value = false
  if (url) coverPreview.value = url
}

watch(() => form.value.coverUrl, (val) => {
  coverPreview.value = val || ''
})

// Thread reorder drag-and-drop
function onDragStart(event, list, index) {
  dragState.value = { list, fromIndex: index, overIndex: index }
  event.dataTransfer.effectAllowed = 'move'
}

function onDragOver(event, list, index) {
  if (dragState.value.list !== list) return
  dragState.value.overIndex = index
}

function onDrop(event, list, toIndex) {
  const { fromIndex } = dragState.value
  if (fromIndex === toIndex || fromIndex === null) return
  const arr = form.value[list]
  const [moved] = arr.splice(fromIndex, 1)
  arr.splice(toIndex, 0, moved)
  dragState.value = { list: null, fromIndex: null, overIndex: null }
}

function onDragEnd() {
  dragState.value = { list: null, fromIndex: null, overIndex: null }
}

// List item management
function addThread() {
  form.value.threads.push({ title: '', url: '', _key: nextKey() })
}

function addMaterial() {
  form.value.materials.push({ title: '', url: '', type: 'Article', _key: nextKey() })
}

function addCharacter() {
  form.value.characters.push({ name: '', description: '', firstAppearance: null, major: false, _key: nextKey(), _editing: true })
}

function addTimelineEvent() {
  form.value.timeline.push({ label: '', note: '', chapter: null, _key: nextKey() })
}

function removeItem(list, index) {
  form.value[list].splice(index, 1)
}

// Serialize form to Firestore-safe object using the public data shape
function serializeForm() {
  const f = form.value
  return {
    title: f.title,
    author: f.author,
    coverUrl: f.coverUrl || coverPreview.value || '',
    goodreadsUrl: f.goodreadsUrl,
    synopsis: f.synopsis,
    fullDescription: f.description,
    genres: f.genres,
    meeting: {
      date: f.meetingDate,
      time: f.meetingTime,
      location: f.meetingLocation,
      discordVoiceUrl: f.discordVoiceUrl,
    },
    discordThreads: f.threads.map(({ _key, ...rest }) => rest),
    supplementalMaterials: f.materials.map(({ _key, ...rest }) => ({
      ...(({ type, ...r }) => r)(rest),
      type: rest.type?.toLowerCase() || 'other',
    })),
    characters: f.characters.map(({ _key, _editing, firstAppearance, major, ...rest }) => ({
      ...rest,
      firstAppearanceChapter: firstAppearance ?? null,
      isMajor: major ?? false,
    })),
    timeline: f.timeline.map(({ _key, ...rest }) => rest),
  }
}

function showMessage(msg, type = 'success') {
  saveMessage.value = msg
  saveMessageType.value = type
  setTimeout(() => { saveMessage.value = '' }, 4000)
}

async function saveBook() {
  saving.value = true
  try {
    const data = serializeForm()
    _ignoreNextSnapshot = true
    await updateDoc(doc(db, 'config', 'main'), { currentBook: data })
    showMessage('Current book saved!')
  } catch (err) {
    console.error('Save error:', err)
    showMessage('Save failed: ' + (err.message || 'Unknown error'), 'error')
  } finally {
    saving.value = false
  }
}

async function archiveBook() {
  const discordThreadUrl = window.prompt('Discord thread URL for the archive (optional):')
  if (discordThreadUrl === null) return // user cancelled

  const snapshot = serializeForm()
  saving.value = true
  try {
    await addPastBook({ ...snapshot, discordThreadUrl: discordThreadUrl.trim() })
    await updateDoc(doc(db, 'config', 'main'), { currentBook: null })
    form.value = emptyForm()
    coverPreview.value = ''
    showMessage('Book archived! The current book slot is now empty.')
  } catch (err) {
    console.error('Archive error:', err)
    showMessage('Archive failed: ' + (err.message || 'Unknown error'), 'error')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.admin-current-book {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.section-heading {
  font-family: var(--font-serif);
  font-size: 1.4rem;
  color: var(--text-primary);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.form-section {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 1.25rem;
  margin-bottom: 1rem;
}

.form-section-title {
  font-family: var(--font-serif);
  font-size: 1.05rem;
  color: var(--gold);
  margin: 0 0 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
}

.form-group--full {
  grid-column: 1 / -1;
}

.form-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.label-note {
  font-weight: 400;
  text-transform: none;
  color: var(--text-muted);
  letter-spacing: 0;
}

.form-input,
.form-textarea,
.form-select {
  background: var(--surface-subtle);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 0.9rem;
  padding: 0.5rem 0.75rem;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.15s;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: var(--border-hover);
}

.form-input--narrow {
  width: 80px;
  flex-shrink: 0;
}

.form-textarea {
  resize: vertical;
  min-height: 4rem;
}

/* Cover preview */
.cover-preview {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.cover-thumb {
  width: 60px;
  height: 90px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
}

.cover-label {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.cover-fetching {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-bottom: 0.75rem;
  font-style: italic;
}

/* Genre grid */
.genre-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.genre-checkbox {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: var(--surface-subtle);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0.3rem 0.6rem;
  font-size: 0.82rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.genre-checkbox.active {
  border-color: var(--gold);
  color: var(--gold);
  background: rgba(200, 150, 60, 0.08);
}

.genre-input {
  display: none;
}

/* Section note */
.section-note {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin: -0.5rem 0 0.75rem;
}

/* List editor (threads, materials, timeline) */
.list-editor {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.list-row {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  background: var(--surface-subtle);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0.6rem;
  cursor: default;
  transition: border-color 0.15s;
}

.list-row.drag-over {
  border-color: var(--gold);
}

.drag-handle {
  cursor: grab;
  color: var(--text-muted);
  font-size: 1rem;
  padding-top: 0.3rem;
  user-select: none;
  flex-shrink: 0;
}

.drag-handle:active {
  cursor: grabbing;
}

.thread-fields,
.material-fields,
.timeline-fields {
  display: flex;
  flex: 1;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.thread-fields .form-input,
.timeline-fields .form-input {
  flex: 1;
  min-width: 0;
}

.material-fields .form-input {
  flex: 1;
  min-width: 0;
}

.material-fields .form-select {
  width: 120px;
  flex-shrink: 0;
}

.primary-badge {
  background: rgba(200, 150, 60, 0.15);
  color: var(--gold);
  border: 1px solid var(--gold);
  border-radius: var(--radius-sm);
  padding: 0.15rem 0.5rem;
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
  align-self: center;
}

/* Character cards */
.cards-editor {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.character-card {
  background: var(--surface-subtle);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0.75rem;
}

.character-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.character-summary {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.char-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  flex: 1;
  min-width: 0;
}

.char-name {
  color: var(--text-primary);
  font-size: 0.95rem;
}

.char-desc {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.major-badge {
  display: inline-block;
  background: rgba(200, 150, 60, 0.15);
  color: var(--gold);
  border: 1px solid var(--gold);
  border-radius: var(--radius-sm);
  padding: 0.1rem 0.4rem;
  font-size: 0.68rem;
  font-weight: 600;
  width: fit-content;
}

.card-actions {
  display: flex;
  gap: 0.4rem;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
  cursor: pointer;
}

/* Buttons */
.btn {
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  font-family: var(--font-sans);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--gold);
  color: var(--bg);
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.88;
}

.btn-secondary {
  background: transparent;
  border-color: var(--border-hover);
  color: var(--text-secondary);
}

.btn-secondary:hover:not(:disabled) {
  border-color: var(--gold);
  color: var(--gold);
}

.btn-sm {
  padding: 0.3rem 0.65rem;
  font-size: 0.78rem;
}

.btn-add {
  background: transparent;
  border: 1px dashed var(--border-hover);
  color: var(--text-secondary);
  text-align: left;
  width: 100%;
  margin-top: 0.25rem;
}

.btn-add:hover {
  border-color: var(--gold);
  color: var(--gold);
}

.btn-icon {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0.25rem;
  border-radius: var(--radius-sm);
  line-height: 1;
  flex-shrink: 0;
}

.btn-delete {
  color: var(--text-muted);
}

.btn-delete:hover {
  color: #f28b82;
}

/* Footer */
.form-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 1rem 0;
  border-top: 1px solid var(--border);
  margin-top: 0.5rem;
}

.footer-actions {
  display: flex;
  gap: 0.75rem;
}

/* Messages */
.save-message {
  font-size: 0.85rem;
  padding: 0.4rem 0.75rem;
  border-radius: var(--radius-sm);
}

.save-message.success {
  color: #6fcf97;
  background: rgba(111, 207, 151, 0.1);
  border: 1px solid rgba(111, 207, 151, 0.3);
}

.save-message.error {
  color: #f28b82;
  background: rgba(242, 139, 130, 0.1);
  border: 1px solid rgba(242, 139, 130, 0.3);
}

@media (max-width: 600px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .thread-fields,
  .material-fields,
  .timeline-fields {
    flex-direction: column;
  }

  .material-fields .form-select {
    width: 100%;
  }

  .header-actions,
  .footer-actions {
    flex-direction: column;
    width: 100%;
  }

  .btn {
    width: 100%;
    text-align: center;
  }
}
</style>
