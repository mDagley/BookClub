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
                      <label class="form-label">Cover URL</label>
                      <input v-model="editForm.coverUrl" type="url" class="form-input" placeholder="https://…" />
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Discord Thread URL</label>
                    <input v-model="editForm.discordThreadUrl" type="url" class="form-input" placeholder="https://discord.com/channels/…" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Synopsis</label>
                    <textarea v-model="editForm.synopsis" class="form-textarea" rows="3"></textarea>
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
          <label class="form-label">Cover URL</label>
          <input v-model="addForm.coverUrl" type="url" class="form-input" placeholder="https://…" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Discord Thread URL</label>
        <input v-model="addForm.discordThreadUrl" type="url" class="form-input" placeholder="https://discord.com/channels/…" />
      </div>
      <div class="form-group">
        <label class="form-label">Synopsis</label>
        <textarea v-model="addForm.synopsis" class="form-textarea" rows="3" placeholder="Brief synopsis…"></textarea>
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

const { pastBooks, loading, addPastBook, updatePastBook, deletePastBook } = usePastBooks()

const editingId = ref(null)
const editForm = ref({})
const editSaving = ref(false)
const editMessage = ref('')
const editMessageType = ref('success')

const addSaving = ref(false)
const addMessage = ref('')
const addMessageType = ref('success')

function emptyAddForm() {
  return { title: '', author: '', dateRead: '', coverUrl: '', discordThreadUrl: '', synopsis: '', genres: [] }
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
    genres: Array.isArray(book.genres) ? [...book.genres] : [],
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
    const dateReadTs = editForm.value.dateRead
      ? Timestamp.fromDate(new Date(editForm.value.dateRead))
      : null
    await updatePastBook(id, {
      ...editForm.value,
      dateRead: dateReadTs,
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
}

.books-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}

.books-table th {
  background: var(--surface);
  color: var(--text-secondary);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.6rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.book-row td,
.edit-row td {
  padding: 0.6rem 0.75rem;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
  color: var(--text-primary);
}

.book-row:last-child td,
.edit-row:last-child td {
  border-bottom: none;
}

.book-row:hover td {
  background: var(--surface-subtle);
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
  background: var(--surface);
  border-radius: var(--radius-sm);
  padding: 1rem;
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
</style>
