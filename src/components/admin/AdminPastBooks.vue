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
                  @error="e => { e.target.style.display = 'none'; e.target.parentElement.querySelector('.cover-placeholder').style.removeProperty('display') }"
                />
                <div class="cover-placeholder" :style="book.coverUrl ? 'display: none' : undefined"></div>
              </td>
              <td class="col-title" data-label="Title" :data-author="book.author"><span class="sr-only">Title: </span>{{ book.title }}</td>
              <td class="col-author" data-label="Author">{{ book.author }}</td>
              <td class="col-date" data-label="Date Read">{{ formatDate(book.dateRead) }}</td>
              <td class="col-thread" data-label="Discord">
                <template v-if="book.discordThreads?.some(t => t.url?.trim())">
                  <a
                    v-for="t in book.discordThreads.filter(t => t.url?.trim())"
                    :key="t.url.trim()"
                    :href="t.url.trim()"
                    target="_blank"
                    rel="noopener"
                    class="thread-link"
                  >{{ t.title || 'Thread' }} ↗</a>
                </template>
                <a
                  v-else-if="book.discordThreadUrl"
                  :href="book.discordThreadUrl"
                  target="_blank"
                  rel="noopener"
                  class="thread-link"
                >Thread ↗</a>
                <span v-else class="empty-cell">—</span>
              </td>
              <td class="col-actions">
                <button class="btn btn-secondary btn-sm" @click="startEdit(book)">Edit</button>
                <a
                  v-if="book.discordThreads?.find(t => t.url?.trim()) || book.discordThreadUrl"
                  :href="book.discordThreads?.find(t => t.url?.trim())?.url || book.discordThreadUrl"
                  target="_blank"
                  rel="noopener"
                  class="btn btn-thread btn-sm"
                  title="Discord Thread"
                ><img src="/discord-icon.svg" alt="Discord Thread" class="discord-btn-icon" /></a>
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
                    <label class="form-label">Discord Threads</label>
                    <div class="list-editor">
                      <div
                        v-for="(thread, index) in editForm.discordThreads"
                        :key="thread._key"
                        class="list-row"
                      >
                        <div class="thread-fields">
                          <input v-model="thread.title" type="text" class="form-input" placeholder="e.g. General Discussion" />
                          <DiscordThreadPicker v-model="thread.url" category="finished" />
                        </div>
                        <button type="button" class="btn-icon btn-delete" @click="removeEditItem('discordThreads', index)">✕</button>
                      </div>
                      <button type="button" class="btn btn-add" @click="addEditThread">+ Add Thread</button>
                    </div>
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
                    <label class="form-label">Discord Discussion Summary <span class="label-note">(highlights from the group discussion)</span></label>
                    <textarea v-model="editForm.discordSummary" class="form-textarea" rows="4" placeholder="Summarize the key themes, opinions, and moments from the Discord discussion…"></textarea>
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
                        <div class="reorder-btns">
                          <button type="button" class="btn-reorder" @click="moveEditItem('materials', index, -1)" :disabled="index === 0" title="Move up" aria-label="Move up">▲</button>
                          <button type="button" class="btn-reorder" @click="moveEditItem('materials', index, 1)" :disabled="index === editForm.materials.length - 1" title="Move down" aria-label="Move down">▼</button>
                        </div>
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
                        <div class="reorder-btns">
                          <button type="button" class="btn-reorder" @click="moveEditItem('timeline', index, -1)" :disabled="index === 0" title="Move up" aria-label="Move up">▲</button>
                          <button type="button" class="btn-reorder" @click="moveEditItem('timeline', index, 1)" :disabled="index === editForm.timeline.length - 1" title="Move down" aria-label="Move down">▼</button>
                        </div>
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

                  <!-- Quotes -->
                  <div class="form-group">
                    <label class="form-label">Quotes <span class="label-note">Memorable lines from the book</span></label>
                    <div class="list-editor">
                      <div
                        v-for="(quote, index) in editForm.quotes"
                        :key="quote._key"
                        class="list-row quote-row"
                      >
                        <div class="quote-fields">
                          <textarea v-model="quote.text" class="form-textarea" rows="2" placeholder="Quote text…"></textarea>
                          <input v-model="quote.attribution" type="text" class="form-input" placeholder="Speaker / context (optional)" />
                        </div>
                        <button type="button" class="btn-icon btn-delete" @click="removeEditItem('quotes', index)">✕</button>
                      </div>
                      <button type="button" class="btn btn-add" @click="addEditQuote">+ Add Quote</button>
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
        <label class="form-label">Discord Threads</label>
        <div class="list-editor">
          <div
            v-for="(thread, index) in addForm.discordThreads"
            :key="thread._key"
            class="list-row"
          >
            <div class="thread-fields">
              <input v-model="thread.title" type="text" class="form-input" placeholder="e.g. General Discussion" />
              <DiscordThreadPicker v-model="thread.url" category="finished" />
            </div>
            <button type="button" class="btn-icon btn-delete" @click="addForm.discordThreads.splice(index, 1)">✕</button>
          </div>
          <button type="button" class="btn btn-add" @click="addForm.discordThreads.push({ title: '', url: '', _key: nextKey() })">+ Add Thread</button>
        </div>
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
        <label class="form-label">Discord Discussion Summary <span class="label-note">(highlights from the group discussion)</span></label>
        <textarea v-model="addForm.discordSummary" class="form-textarea" rows="4" placeholder="Summarize the key themes, opinions, and moments from the Discord discussion…"></textarea>
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
import DiscordThreadPicker from './DiscordThreadPicker.vue'

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
  return { title: '', author: '', dateRead: '', coverUrl: '', discordThreads: [], synopsis: '', fullDescription: '', discordSummary: '', genres: [] }
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
    discordThreads: book.discordThreads?.length
      ? book.discordThreads.map(t => ({ ...t, _key: nextKey() }))
      : book.discordThreadUrl
        ? [{ title: 'Discussion', url: book.discordThreadUrl, _key: nextKey() }]
        : [],
    synopsis: book.synopsis || '',
    fullDescription: book.fullDescription || '',
    discordSummary: book.discordSummary || '',
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
    quotes: (book.quotes || []).map(q => ({ ...q, _key: nextKey() })),
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
      discordThreads: f.discordThreads.map(({ _key, title, url }) => ({ title, url: url?.trim() ?? '' })).filter(t => t.url),
      synopsis: f.synopsis,
      fullDescription: f.fullDescription,
      discordSummary: f.discordSummary,
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
      quotes: f.quotes.map(({ _key, ...rest }) => rest),
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
function addEditQuote() {
  editForm.value.quotes.push({ text: '', attribution: '', _key: nextKey() })
}
function addEditThread() {
  editForm.value.discordThreads.push({ title: '', url: '', _key: nextKey() })
}
function removeEditItem(list, index) {
  editForm.value[list].splice(index, 1)
}

function moveEditItem(list, index, direction) {
  const arr = editForm.value[list]
  const to = index + direction
  if (to < 0 || to >= arr.length) return
  const [item] = arr.splice(index, 1)
  arr.splice(to, 0, item)
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
    const f = addForm.value
    await addPastBook({
      ...f,
      dateRead: dateReadTs,
      discordThreads: f.discordThreads.filter(t => t.url?.trim()).map(({ title, url }) => ({ title, url: url.trim() })),
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
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

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

/* Table / Mobile card (mobile-first base — no media query) */
.books-table-wrap { }

.books-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}

.books-table thead {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
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

.book-row {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr auto auto;
  position: relative;
  aspect-ratio: 2 / 3;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0,0,0,0.45);
  margin-bottom: 1.25rem;
}

/* Using > * (specificity 0,1,0) so individual cell classes can override without !important */
.book-row > * {
  display: block;
  padding: 0;
  border-bottom: none;
  background: transparent;
  vertical-align: unset;
}

.book-row > *[data-label]::before { content: none; display: none; }

/* Cover — absolute fill behind all content */
.col-cover {
  position: absolute;
  inset: 0;
  width: auto;
  z-index: 0;
  overflow: hidden;
  padding: 0;
}

.col-cover::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.25) 45%, rgba(0,0,0,0.1) 100%);
  pointer-events: none;
}

.col-cover .cover-thumb {
  width: 100%;
  height: 100%;
  aspect-ratio: unset;
  object-fit: cover;
  display: block;
}

.col-cover .cover-placeholder {
  width: 100%;
  height: 100%;
  background: var(--surface-subtle);
}

/* Date — gold banner (row 1, pinned to top of cover area) */
.col-date {
  grid-column: 1;
  grid-row: 1;
  align-self: start;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.45rem 1rem;
  z-index: 2;
  pointer-events: none;
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: rgba(15, 7, 0, 0.9);
  background: linear-gradient(105deg,
    rgba(130, 88, 8, 1) 0%,
    rgba(210, 162, 30, 1) 30%,
    rgba(255, 218, 70, 0.98) 52%,
    rgba(218, 168, 32, 1) 72%,
    rgba(145, 98, 10, 1) 100%
  );
  border-bottom: 1px solid rgba(100, 65, 5, 0.35);
  text-shadow: 0 1px 1px rgba(255,240,150,0.3);
}

.col-date::before {
  content: "Read";
  opacity: 0.6;
  font-weight: 700;
}

/* Title — row 2 glass panel */
.col-title {
  grid-column: 1;
  grid-row: 2;
  display: block;
  padding: 0.75rem 1.1rem 0.85rem;
  z-index: 2;
  background: rgba(13, 30, 51, 0.65);
  backdrop-filter: blur(4px);
  font-weight: 700;
  font-size: 1rem;
  line-height: 1.3;
  color: var(--text-primary);
}

.col-title::before { content: none; display: none; }

.col-title::after {
  content: attr(data-author);
  display: block;
  font-style: italic;
  font-size: 0.82rem;
  font-weight: 400;
  color: var(--text-secondary);
  margin-top: 0.3rem;
}

.col-author { display: none; }
.col-thread { display: none; }

/* Actions — row 3 icon bar */
.col-actions {
  grid-column: 1;
  grid-row: 3;
  z-index: 2;
  display: flex;
  gap: 0;
  width: auto;
  border-top: 1px solid rgba(200, 150, 60, 0.3);
  background: rgba(13, 30, 51, 0.7);
  backdrop-filter: blur(4px);
}

.col-actions .btn {
  flex: 1;
  padding: 0.9rem 0.5rem;
  font-size: 0;
  border-radius: 0;
  border: none;
  border-right: 1px solid rgba(200, 150, 60, 0.15);
  text-align: center;
  justify-content: center;
  background: transparent;
  transition: background 0.15s;
}

.col-actions .btn::before { font-size: 1.2rem; line-height: 1; }
.col-actions .btn-secondary::before { content: "✎"; }
.btn-thread { display: flex; }
.discord-btn-icon { width: 1.25rem; height: 1.25rem; display: block; }
.col-actions .btn-danger::before { content: "✕"; }

.col-actions .btn:last-child { border-right: none; }
.col-actions .btn + .btn { margin-left: 0; }

.thread-link {
  color: var(--discord-blue);
  text-decoration: none;
  font-size: 0.82rem;
}

.thread-link:hover { text-decoration: underline; }
.thread-link + .thread-link { margin-top: 0.2rem; display: block; }

.thread-fields {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

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
  flex-wrap: wrap;
}

.cover-url-row .form-input { flex: 1 0 100%; }

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

/* Reorder buttons (shown on mobile instead of drag handles) */
.reorder-btns {
  display: none;
  flex-direction: column;
  gap: 2px;
  flex-shrink: 0;
}

.btn-reorder {
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.55rem;
  line-height: 1;
  padding: 0.25rem 0.35rem;
  transition: color 0.1s, border-color 0.1s;
}

.btn-reorder:not(:disabled):hover {
  color: var(--gold);
  border-color: var(--gold);
}

.btn-reorder:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* Desktop table layout — overrides mobile card base above */
@media (min-width: 601px) {
  .books-table-wrap {
    overflow-x: auto;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--surface);
  }

  .books-table { min-width: 560px; }

  .books-table thead {
    display: table-header-group;
    position: static;
    width: auto;
    height: auto;
    margin: 0;
    overflow: visible;
    clip: auto;
    white-space: normal;
  }

  .book-row {
    display: table-row;
    aspect-ratio: unset;
    position: static;
    border-radius: 0;
    overflow: visible;
    box-shadow: none;
    border-top: none;
    margin-bottom: 0;
  }

  .book-row:hover > * { background: rgba(46, 112, 160, 0.12); }

  .book-row > *,
  .edit-row > * {
    display: table-cell;
    padding: 0.6rem 0.75rem;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
    vertical-align: middle;
    color: var(--text-primary);
  }

  .book-row:last-child > *,
  .edit-row:last-child > * {
    border-bottom: none;
  }

  .col-cover {
    position: static;
    inset: unset;
    width: 52px;
    overflow: visible;
    z-index: auto;
  }

  .col-cover::after { display: none; }

  .col-cover .cover-thumb {
    width: 40px;
    height: 56px;
    aspect-ratio: unset;
    object-fit: cover;
    border-radius: var(--radius-sm);
    display: block;
  }

  .col-cover .cover-placeholder {
    width: 40px;
    height: 56px;
    background: var(--surface-subtle);
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
  }

  .col-title {
    min-width: 140px;
    font-weight: normal;
    font-size: 0.88rem;
    background: var(--surface);
    backdrop-filter: none;
    z-index: auto;
    line-height: inherit;
    padding: 0.6rem 0.75rem;
  }

  .col-title::before,
  .col-title::after { content: none; display: none; }

  .col-author { display: table-cell; min-width: 120px; color: var(--text-secondary); }

  .col-date {
    display: table-cell;
    min-width: 100px;
    color: var(--text-muted);
    white-space: nowrap;
    background: var(--surface);
    font-size: 0.88rem;
    font-weight: normal;
    text-transform: none;
    letter-spacing: normal;
    align-self: unset;
    justify-content: unset;
    pointer-events: auto;
    z-index: auto;
    border-top: none;
  }

  .col-date::before { content: none; display: none; }

  .col-thread { display: table-cell; min-width: 80px; }

  .col-actions {
    display: table-cell;
    width: 130px;
    white-space: nowrap;
    background: var(--surface);
    backdrop-filter: none;
    border-top: none;
    z-index: auto;
    grid-row: unset;
    grid-column: unset;
  }

  .col-actions .btn {
    flex: none;
    font-size: 0.78rem;
    padding: 0.3rem 0.65rem;
    border-radius: var(--radius-sm);
    border: 1px solid transparent;
    border-right: none;
    text-align: initial;
    justify-content: initial;
  }

  .col-actions .btn::before { content: none; display: none; font-size: inherit; }
  .col-actions .btn + .btn { margin-left: 0.35rem; }
  .btn-thread { display: none; }
  .discord-btn-icon { display: none; }
}

@media (max-width: 600px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .col-actions .btn:hover { background: rgba(255,255,255,0.05); }

  /* Edit row */
  .edit-row { display: block; }
  .edit-row > * { display: block; padding: 0; }

  /* Drag → reorder buttons in edit form */
  .drag-handle { display: none; }
  .reorder-btns { display: flex; }

  .material-fields,
  .timeline-fields {
    flex-direction: column;
  }

  .form-input--narrow {
    flex: unset;
    width: 100%;
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

.form-input.form-input--narrow {
  flex: 0 0 70px;
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

.quote-row { align-items: flex-start; }
.quote-fields {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
}
.quote-fields .form-textarea { resize: vertical; }

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
