<template>
  <div class="admin-past-books">
    <div class="section-header">
      <h2 class="section-heading">Past Books</h2>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">Loading past books…</div>

    <!-- Table -->
    <div v-else-if="pastBooks.length" class="books-table-wrap">
      <table class="books-table">
        <thead>
          <tr>
            <th class="col-cover"></th>
            <th class="col-title">Title</th>
            <th class="col-author">Author</th>
            <th class="col-date">Date Read</th>
            <th class="col-thread">Discord</th>
            <th class="col-actions"></th>
          </tr>
        </thead>
        <tbody>
          <template v-for="book in pastBooks" :key="book.id">
            <!-- Normal row -->
            <tr v-if="editingId !== book.id" class="book-row">
              <td class="col-cover">
                <img
                  v-if="book.coverUrl"
                  :src="book.coverUrl"
                  :alt="book.title"
                  class="cover-thumb"
                />
                <div v-else class="cover-placeholder"></div>
              </td>
              <td class="col-title">{{ book.title }}</td>
              <td class="col-author">{{ book.author }}</td>
              <td class="col-date">{{ formatDate(book.dateRead) }}</td>
              <td class="col-thread">
                <a
                  v-if="book.discordThreadUrl"
                  :href="book.discordThreadUrl"
                  target="_blank"
                  rel="noopener"
                  class="thread-link"
                >Thread ↗</a>
                <span v-else class="empty-cell">—</span>
              </td>
              <td class="col-actions">
                <button class="btn btn-secondary btn-sm" @click="startEdit(book)">Edit</button>
                <button class="btn btn-danger btn-sm" @click="deleteBook(book)">Delete</button>
              </td>
            </tr>

            <!-- Edit row -->
            <tr v-else class="edit-row">
              <td colspan="6">
                <div class="inline-edit-form">
                  <h3 class="edit-title">Editing: {{ book.title }}</h3>
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">Title</label>
                      <input v-model="editForm.title" type="text" class="form-input" />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Author</label>
                      <input v-model="editForm.author" type="text" class="form-input" />
                    </div>
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">Date Read</label>
                      <input v-model="editForm.dateRead" type="date" class="form-input" />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Cover <span class="label-note">(URL or upload)</span></label>
                      <div class="cover-url-row">
                        <input v-model="editForm.coverUrl" type="url" class="form-input" placeholder="https://…" />
                        <CoverUpload
                          :book-id="editingId"
                          label="Upload"
                          @uploaded="url => editForm.coverUrl = url"
                        />
                      </div>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Discord Thread URL</label>
                    <input v-model="editForm.discordThreadUrl" type="url" class="form-input" placeholder="https://discord.com/channels/…" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Synopsis <span class="label-note">(short, shown on card)</span></label>
                    <textarea v-model="editForm.synopsis" class="form-textarea" rows="3"></textarea>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Full Description <span class="label-note">(shown on detail page)</span></label>
                    <textarea v-model="editForm.fullDescription" class="form-textarea" rows="6"></textarea>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Genres</label>
                    <div class="genre-grid">
                      <label
                        v-for="genre in GENRE_LIST"
                        :key="genre"
                        class="genre-checkbox"
                        :class="{ active: editForm.genres?.includes(genre) }"
                      >
                        <input
                          type="checkbox"
                          :value="genre"
                          v-model="editForm.genres"
                          class="genre-input"
                        />
                        {{ genre }}
                      </label>
                    </div>
                  </div>
                  <!-- Supplemental Materials -->
                  <div class="form-group">
                    <label class="form-label">Supplemental Materials</label>
                    <div class="list-editor">
                      <div
                        v-for="(material, index) in editForm.materials"
                        :key="material._key"
                        class="list-row"
                        draggable="true"
                        @dragstart="onEditDragStart($event, 'materials', index)"
                        @dragover.prevent="onEditDragOver($event, 'materials', index)"
                        @drop.prevent="onEditDrop($event, 'materials', index)"
                        @dragend="onEditDragEnd"
                        :class="{ 'drag-over': editDragState.list === 'materials' && editDragState.overIndex === index }"
                      >
                        <span class="drag-handle">⠿</span>
                        <div class="material-fields">
                          <input v-model="material.title" type="text" class="form-input" placeholder="Title" />
                          <input v-model="material.url" type="url" class="form-input" placeholder="https://…" />
                          <select v-model="material.type" class="form-select">
                            <option>Article</option>
                            <option>Video</option>
                            <option>Podcast</option>
                            <option>Map</option>
                            <option>Other</option>
                          </select>
                        </div>
                        <button type="button" class="btn-icon btn-delete" @click="removeEditItem('materials', index)">✕</button>
                      </div>
                      <button type="button" class="btn btn-add" @click="addEditMaterial">+ Add Material</button>
                    </div>
                  </div>

                  <!-- Characters -->
                  <div class="form-group">
                    <label class="form-label">Characters</label>
                    <div class="cards-editor">
                      <div v-for="(char, index) in editForm.characters" :key="char._key" class="character-card">
                        <div v-if="char._editing" class="character-form">
                          <div class="char-form-row">
                            <div class="form-group">
                              <label class="form-label">Name</label>
                              <input v-model="char.name" type="text" class="form-input" placeholder="Character name" />
                            </div>
                            <div class="form-group">
                              <label class="form-label">First Ch.</label>
                              <input v-model.number="char.firstAppearance" type="number" class="form-input" placeholder="#" min="1" />
                            </div>
                          </div>
                          <div class="form-group">
                            <label class="form-label">Description</label>
                            <textarea v-model="char.description" class="form-textarea" rows="2" placeholder="Character description…"></textarea>
                          </div>
                          <label class="checkbox-label">
                            <input type="checkbox" v-model="char.major" /> Major character
                          </label>
                          <button type="button" class="btn btn-primary btn-sm" @click="char._editing = false">Done</button>
                        </div>
                        <div v-else class="character-summary">
                          <div class="char-info">
                            <strong class="char-name">{{ char.name || '(unnamed)' }}</strong>
                            <span v-if="char.major" class="major-badge">Major</span>
                            <span class="char-desc">{{ char.description?.slice(0, 80) }}{{ char.description?.length > 80 ? '…' : '' }}</span>
                          </div>
                          <div class="card-actions">
                            <button type="button" class="btn btn-secondary btn-sm" @click="char._editing = true">Edit</button>
                            <button type="button" class="btn-icon btn-delete" @click="removeEditItem('characters', index)">✕</button>
                          </div>
                        </div>
                      </div>
                      <button type="button" class="btn btn-add" @click="addEditCharacter">+ Add Character</button>
                    </div>
                  </div>

                  <!-- Timeline -->
                  <div class="form-group">
                    <label class="form-label">Timeline <span class="label-note">Drag to reorder</span></label>
                    <div class="list-editor">
                      <div
                        v-for="(event, index) in editForm.timeline"
                        :key="event._key"
                        class="list-row"
                        draggable="true"
                        @dragstart="onEditDragStart($event, 'timeline', index)"
                        @dragover.prevent="onEditDragOver($event, 'timeline', index)"
                        @drop.prevent="onEditDrop($event, 'timeline', index)"
                        @dragend="onEditDragEnd"
                        :class="{ 'drag-over': editDragState.list === 'timeline' && editDragState.overIndex === index }"
                      >
                        <span class="drag-handle">⠿</span>
                        <div class="timeline-fields">
                          <input v-model.number="event.chapter" type="number" class="form-input form-input--narrow" placeholder="Ch." min="1" />
                          <input v-model="event.label" type="text" class="form-input" placeholder="Event label" />
                          <input v-model="event.note" type="text" class="form-input" placeholder="Note (optional)" />
                        </div>
                        <button type="button" class="btn-icon btn-delete" @click="removeEditItem('timeline', index)">✕</button>
                      </div>
                      <button type="button" class="btn btn-add" @click="addEditTimelineEvent">+ Add Event</button>
                    </div>
                  </div>

                  <div class="edit-actions">
                    <button class="btn btn-secondary btn-sm" @click="cancelEdit">Cancel</button>
                    <button class="btn btn-primary btn-sm" @click="saveEdit(book.id)" :disabled="editSaving">
                      {{ editSaving ? 'Saving…' : 'Save' }}
                    </button>
                  </div>
                  <p v-if="editMessage" class="save-message" :class="editMessageType">{{ editMessage }}</p>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <p v-else class="empty-state">No past books yet.</p>

    <!-- Add Past Book form -->
    <div class="add-section">
      <h3 class="form-section-title">+ Add Past Book</h3>
      <p class="section-note">For books read before this site existed.</p>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Title</label>
          <input v-model="addForm.title" type="text" class="form-input" placeholder="Book title" required />
        </div>
        <div class="form-group">
          <label class="form-label">Author</label>
          <input v-model="addForm.author" type="text" class="form-input" placeholder="Author name" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Date Read</label>
          <input v-model="addForm.dateRead" type="date" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">Cover <span class="label-note">(URL or upload)</span></label>
          <div class="cover-url-row">
            <input v-model="addForm.coverUrl" type="url" class="form-input" placeholder="https://…" />
            <CoverUpload
              book-id="past-book-add"
              label="Upload"
              @uploaded="url => addForm.coverUrl = url"
            />
          </div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Discord Thread URL</label>
        <input v-model="addForm.discordThreadUrl" type="url" class="form-input" placeholder="https://discord.com/channels/…" />
      </div>
      <div class="form-group">
        <label class="form-label">Synopsis <span class="label-note">(short, shown on card)</span></label>
        <textarea v-model="addForm.synopsis" class="form-textarea" rows="3" placeholder="Brief synopsis…"></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Full Description <span class="label-note">(shown on detail page)</span></label>
        <textarea v-model="addForm.fullDescription" class="form-textarea" rows="6" placeholder="Full book description…"></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Genres</label>
        <div class="genre-grid">
          <label
            v-for="genre in GENRE_LIST"
            :key="genre"
            class="genre-checkbox"
            :class="{ active: addForm.genres.includes(genre) }"
          >
            <input
              type="checkbox"
              :value="genre"
              v-model="addForm.genres"
              class="genre-input"
            />
            {{ genre }}
          </label>
        </div>
      </div>
      <div class="add-actions">
        <button class="btn btn-primary" @click="submitAdd" :disabled="addSaving || !addForm.title">
          {{ addSaving ? 'Adding…' : 'Add Past Book' }}
        </button>
      </div>
      <p v-if="addMessage" class="save-message" :class="addMessageType">{{ addMessage }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Timestamp } from 'firebase/firestore'
import { usePastBooks } from '../../composables/usePastBooks.js'
import { GENRE_LIST } from '../../utils/genres.js'
import CoverUpload from '../shared/CoverUpload.vue'

const { pastBooks, loading, addPastBook, updatePastBook, deletePastBook } = usePastBooks()

let _keyCounter = 0
const nextKey = () => ++_keyCounter

const editingId = ref(null)
const editForm = ref({})
const editSaving = ref(false)
const editMessage = ref('')
const editMessageType = ref('success')
const editDragState = ref({ list: null, fromIndex: null, overIndex: null })

const addSaving = ref(false)
const addMessage = ref('')
const addMessageType = ref('success')

function emptyAddForm() {
  return { title: '', author: '', dateRead: '', coverUrl: '', discordThreadUrl: '', synopsis: '', fullDescription: '', genres: [] }
}

const addForm = ref(emptyAddForm())

function formatDate(value) {
  if (!value) return '—'
  // Firestore Timestamp or string
  let d
  if (value?.toDate) d = value.toDate()
  else if (typeof value === 'string') d = new Date(value)
  else d = new Date(value)
  if (isNaN(d)) return '—'
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
}

function startEdit(book) {
  editingId.value = book.id
  editMessage.value = ''
  // Convert Firestore timestamp date to YYYY-MM-DD for date input
  let dateStr = ''
  if (book.dateRead) {
    let d = book.dateRead?.toDate ? book.dateRead.toDate() : new Date(book.dateRead)
    if (!isNaN(d)) {
      dateStr = d.toISOString().slice(0, 10)
    }
  }
  editForm.value = {
    title: book.title || '',
    author: book.author || '',
    dateRead: dateStr,
    coverUrl: book.coverUrl || '',
    discordThreadUrl: book.discordThreadUrl || '',
    synopsis: book.synopsis || '',
    fullDescription: book.fullDescription || '',
    genres: Array.isArray(book.genres) ? [...book.genres] : [],
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
}

function cancelEdit() {
  editingId.value = null
  editForm.value = {}
}

function showEditMessage(msg, type = 'success') {
  editMessage.value = msg
  editMessageType.value = type
  setTimeout(() => { editMessage.value = '' }, 3000)
}

function showAddMessage(msg, type = 'success') {
  addMessage.value = msg
  addMessageType.value = type
  setTimeout(() => { addMessage.value = '' }, 3000)
}

async function saveEdit(id) {
  editSaving.value = true
  try {
    const f = editForm.value
    const dateReadTs = f.dateRead ? Timestamp.fromDate(new Date(f.dateRead)) : null
    await updatePastBook(id, {
      title: f.title,
      author: f.author,
      dateRead: dateReadTs,
      coverUrl: f.coverUrl,
      discordThreadUrl: f.discordThreadUrl,
      synopsis: f.synopsis,
      fullDescription: f.fullDescription,
      genres: f.genres,
      supplementalMaterials: f.materials.map(({ _key, ...rest }) => ({
        ...rest,
        type: rest.type?.toLowerCase() || 'other',
      })),
      characters: f.characters.map(({ _key, _editing, firstAppearance, major, ...rest }) => ({
        ...rest,
        firstAppearanceChapter: firstAppearance ?? null,
        isMajor: major ?? false,
      })),
      timeline: f.timeline.map(({ _key, ...rest }) => rest),
    })
    showEditMessage('Saved!')
    setTimeout(() => { cancelEdit() }, 1000)
  } catch (err) {
    console.error('Edit error:', err)
    showEditMessage('Save failed: ' + (err.message || 'Unknown error'), 'error')
  } finally {
    editSaving.value = false
  }
}

function addEditCharacter() {
  editForm.value.characters.push({ name: '', description: '', firstAppearance: null, major: false, _key: nextKey(), _editing: true })
}
function addEditTimelineEvent() {
  editForm.value.timeline.push({ label: '', note: '', chapter: null, _key: nextKey() })
}
function addEditMaterial() {
  editForm.value.materials.push({ title: '', url: '', type: 'Article', _key: nextKey() })
}
function removeEditItem(list, index) {
  editForm.value[list].splice(index, 1)
}

function onEditDragStart(event, list, index) {
  editDragState.value = { list, fromIndex: index, overIndex: index }
  event.dataTransfer.effectAllowed = 'move'
}
function onEditDragOver(event, list, index) {
  if (editDragState.value.list !== list) return
  editDragState.value.overIndex = index
}
function onEditDrop(event, list, toIndex) {
  const { fromIndex } = editDragState.value
  if (fromIndex === toIndex || fromIndex === null) return
  const arr = editForm.value[list]
  const [moved] = arr.splice(fromIndex, 1)
  arr.splice(toIndex, 0, moved)
  editDragState.value = { list: null, fromIndex: null, overIndex: null }
}
function onEditDragEnd() {
  editDragState.value = { list: null, fromIndex: null, overIndex: null }
}

async function deleteBook(book) {
  if (!window.confirm(`Delete "${book.title}"? This cannot be undone.`)) return
  try {
    await deletePastBook(book.id)
  } catch (err) {
    console.error('Delete error:', err)
    alert('Delete failed: ' + (err.message || 'Unknown error'))
  }
}

async function submitAdd() {
  if (!addForm.value.title.trim()) return
  addSaving.value = true
  try {
    const dateReadTs = addForm.value.dateRead
      ? Timestamp.fromDate(new Date(addForm.value.dateRead))
      : null
    await addPastBook({
      ...addForm.value,
      dateRead: dateReadTs,
    })
    addForm.value = emptyAddForm()
    showAddMessage('Past book added!')
  } catch (err) {
    console.error('Add error:', err)
    showAddMessage('Add failed: ' + (err.message || 'Unknown error'), 'error')
  } finally {
    addSaving.value = false
  }
}
</script>

<style scoped>
.admin-past-books {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.25rem;
}

.section-heading {
  font-family: var(--font-serif);
  font-size: 1.4rem;
  color: var(--text-primary);
  margin: 0;
}

.loading-state {
  color: var(--text-muted);
  font-style: italic;
}

.empty-state {
  color: var(--text-muted);
  font-style: italic;
}

/* Table */
.books-table-wrap {
  overflow-x: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
}

.books-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
  min-width: 560px;
}

.books-table th {
  background: var(--surface-subtle);
  color: var(--text-secondary);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.6rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

.book-row td,
.edit-row td {
  padding: 0.6rem 0.75rem;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
  color: var(--text-primary);
  background: var(--surface);
}

.book-row:last-child td,
.edit-row:last-child td {
  border-bottom: none;
}

.book-row:hover td {
  background: rgba(46, 112, 160, 0.12);
}

.col-cover { width: 52px; }
.col-title { min-width: 140px; }
.col-author { min-width: 120px; color: var(--text-secondary); }
.col-date { min-width: 100px; color: var(--text-muted); white-space: nowrap; }
.col-thread { min-width: 80px; }
.col-actions { width: 130px; white-space: nowrap; }

.cover-thumb {
  width: 40px;
  height: 56px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  display: block;
}

.cover-placeholder {
  width: 40px;
  height: 56px;
  background: var(--surface-subtle);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
}

.thread-link {
  color: var(--discord-blue);
  text-decoration: none;
  font-size: 0.82rem;
}

.thread-link:hover { text-decoration: underline; }

.empty-cell {
  color: var(--text-muted);
}

/* Inline edit form */
.inline-edit-form {
  background: var(--surface-subtle);
  border-radius: var(--radius-sm);
  padding: 1rem;
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.edit-title {
  font-family: var(--font-serif);
  font-size: 1rem;
  color: var(--gold);
  margin: 0;
}

.edit-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

/* Add section */
.add-section {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 1.25rem;
}

.form-section-title {
  font-family: var(--font-serif);
  font-size: 1.05rem;
  color: var(--gold);
  margin: 0 0 0.25rem;
}

.section-note {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin: 0 0 0.75rem;
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
  margin-bottom: 0.25rem;
}

.form-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.form-input,
.form-textarea {
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
.form-textarea:focus {
  outline: none;
  border-color: var(--border-hover);
}

.form-textarea {
  resize: vertical;
}

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

.cover-url-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.cover-url-row .form-input { flex: 1; }

.label-note {
  font-weight: 400;
  text-transform: none;
  color: var(--text-muted);
  letter-spacing: 0;
  font-size: 0.72rem;
}

.add-actions {
  margin-top: 0.75rem;
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

.btn-danger {
  background: transparent;
  border-color: rgba(242, 139, 130, 0.4);
  color: #f28b82;
}

.btn-danger:hover:not(:disabled) {
  background: rgba(242, 139, 130, 0.1);
}

.btn-sm {
  padding: 0.3rem 0.65rem;
  font-size: 0.78rem;
}

.col-actions .btn + .btn {
  margin-left: 0.35rem;
}

/* Messages */
.save-message {
  font-size: 0.85rem;
  padding: 0.4rem 0.75rem;
  border-radius: var(--radius-sm);
  margin-top: 0.5rem;
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
}

/* ── Rich editors (materials, characters, timeline) ─────────────────────── */

.list-editor {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.list-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.5rem;
  background: var(--surface-subtle);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  transition: border-color 0.15s;
}

.list-row.drag-over {
  border-color: var(--gold);
}

.drag-handle {
  color: var(--text-muted);
  cursor: grab;
  font-size: 1rem;
  flex-shrink: 0;
  user-select: none;
}

.material-fields,
.timeline-fields {
  display: flex;
  flex: 1;
  gap: 0.4rem;
  min-width: 0;
}

.material-fields .form-input,
.timeline-fields .form-input {
  flex: 1;
  min-width: 0;
}

.form-input--narrow {
  flex: 0 0 70px !important;
}

.form-select {
  background: var(--surface-subtle);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 0.85rem;
  padding: 0.45rem 0.5rem;
  flex-shrink: 0;
}

.btn-add {
  background: transparent;
  border: 1px dashed var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-family: var(--font-sans);
  font-size: 0.8rem;
  padding: 0.35rem 0.75rem;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
  align-self: flex-start;
}

.btn-add:hover {
  border-color: var(--gold);
  color: var(--gold);
}

.btn-icon {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 0.8rem;
  cursor: pointer;
  padding: 0.2rem 0.3rem;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
  transition: color 0.15s;
}

.btn-delete:hover { color: #f28b82; }

/* Characters */
.cards-editor {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.character-card {
  background: var(--surface-subtle);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0.6rem 0.75rem;
}

.character-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.char-form-row {
  display: grid;
  grid-template-columns: 1fr 120px;
  gap: 0.5rem;
}

.character-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.char-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
  flex-wrap: wrap;
}

.char-name {
  font-family: var(--font-serif);
  font-size: 0.9rem;
  color: var(--gold);
}

.major-badge {
  font-family: var(--font-sans);
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: 1px solid var(--gold);
  color: var(--gold);
  border-radius: 10px;
  padding: 0.1rem 0.4rem;
}

.char-desc {
  font-family: var(--font-sans);
  font-size: 0.8rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
}

.checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-family: var(--font-sans);
  font-size: 0.82rem;
  color: var(--text-secondary);
  cursor: pointer;
}
</style>
