<template>
  <div class="admin-suggestions">
    <div class="section-header">
      <h2 class="section-heading">Suggestions</h2>
      <button
        type="button"
        class="btn btn-secondary btn-sm"
        :disabled="refreshing"
        @click="refreshMissingCovers"
      >{{ refreshing ? `Fetching… (${refreshProgress})` : 'Refresh missing covers' }}</button>
    </div>

    <div v-if="loading" class="loading-state">Loading suggestions…</div>

    <div v-else-if="suggestions.length" class="table-wrap">
      <table class="suggestions-table">
        <thead>
          <tr>
            <th class="col-cover"></th>
            <th class="col-title">Title</th>
            <th class="col-author">Author</th>
            <th class="col-published">Published</th>
            <th class="col-votes">Votes</th>
            <th class="col-suggested">Suggested By</th>
            <th class="col-readby">Read By</th>
            <th class="col-actions"></th>
          </tr>
        </thead>
        <tbody>
          <template v-for="suggestion in suggestions" :key="suggestion.id">
            <!-- Normal row -->
            <tr v-if="editingId !== suggestion.id" class="suggestion-row">
              <td class="col-cover">
                <img v-if="suggestion.coverUrl" :src="suggestion.coverUrl" :alt="suggestion.title" class="cover-thumb" />
                <div v-else class="cover-placeholder"></div>
              </td>
              <td class="col-title">
                <span class="book-title">{{ suggestion.title }}</span>
                <span v-if="suggestion.genres?.length" class="genre-list">{{ suggestion.genres.join(', ') }}</span>
              </td>
              <td class="col-author">{{ suggestion.author }}</td>
              <td class="col-published">{{ suggestion.publishedDate || '—' }}</td>
              <td class="col-votes"><span class="vote-badge">{{ suggestion.votes ?? 0 }}</span></td>
              <td class="col-suggested">{{ resolveName(suggestion.suggestedBy) || '—' }}</td>
              <td class="col-readby">
                <span v-if="suggestion.alreadyRead?.length" class="readby-text">{{ resolveNames(suggestion.alreadyRead).join(', ') }}</span>
                <span v-else class="empty-cell">—</span>
              </td>
              <td class="col-actions">
                <button class="btn btn-secondary btn-sm" @click="startEdit(suggestion)">Edit</button>
                <button class="btn btn-promote btn-sm" @click="promote(suggestion)" title="Copy to Current Book">Promote</button>
                <button class="btn btn-danger btn-sm" @click="deleteSug(suggestion)">Delete</button>
              </td>
            </tr>

            <!-- Inline edit row -->
            <tr v-else class="edit-row">
              <td colspan="7" class="edit-cell">
                <div class="edit-form">
                  <div class="edit-cover-preview">
                    <img v-if="editForm.coverUrl" :src="editForm.coverUrl" class="edit-thumb" alt="Cover" />
                    <div v-else class="edit-thumb-placeholder">
                      <img src="/book-icon.svg" class="placeholder-book" alt="" />
                    </div>
                  </div>

                  <div class="edit-fields">
                    <div class="edit-row-fields">
                      <div class="edit-field">
                        <label class="edit-label">Title</label>
                        <input v-model="editForm.title" type="text" class="form-input" />
                      </div>
                      <div class="edit-field">
                        <label class="edit-label">Author</label>
                        <input v-model="editForm.author" type="text" class="form-input" />
                      </div>
                      <div class="edit-field">
                        <label class="edit-label">Suggested By</label>
                        <input v-model="editForm.suggestedBy" type="text" class="form-input" />
                      </div>
                      <div class="edit-field">
                        <label class="edit-label">Published Date</label>
                        <input v-model="editForm.publishedDate" type="text" class="form-input" placeholder="e.g. 2021-03" />
                      </div>
                    </div>

                    <div class="edit-field">
                      <label class="edit-label">Cover <span style="font-weight:400;text-transform:none">(URL or upload)</span></label>
                      <div class="cover-url-row">
                        <input v-model="editForm.coverUrl" type="url" class="form-input" placeholder="https://…" />
                        <button
                          class="btn btn-secondary btn-sm"
                          :disabled="fetchingCover"
                          type="button"
                          @click="fetchCoverForEdit"
                        >{{ fetchingCover ? '…' : 'Fetch' }}</button>
                        <CoverUpload
                          :book-id="editingId"
                          label="Upload"
                          @uploaded="url => editForm.coverUrl = url"
                        />
                      </div>
                      <div v-if="coverOptions.length" class="cover-picker">
                        <div class="cover-picker-grid">
                          <button
                            v-for="opt in coverOptions"
                            :key="opt.coverUrl"
                            type="button"
                            class="cover-option"
                            :class="{ selected: editForm.coverUrl === opt.coverUrl }"
                            :aria-pressed="editForm.coverUrl === opt.coverUrl"
                            :title="opt.title"
                            @click="pickCover(opt.coverUrl)"
                          >
                            <img :src="opt.coverUrl" :alt="opt.title" />
                          </button>
                        </div>
                        <button type="button" class="btn btn-secondary btn-sm" @click="coverOptions = []">Dismiss</button>
                      </div>
                    </div>

                    <div class="edit-field">
                      <label class="edit-label">Description</label>
                      <textarea v-model="editForm.description" class="form-input" rows="3" />
                    </div>

                    <div class="edit-field">
                      <label class="edit-label">Genres</label>
                      <div class="genre-check-grid">
                        <label v-for="g in GENRE_LIST" :key="g" class="genre-check">
                          <input type="checkbox" :value="g" v-model="editForm.genres" />
                          {{ g }}
                        </label>
                      </div>
                    </div>

                    <div class="edit-field">
                      <label class="edit-label">Already Read By</label>
                      <div class="member-check-grid">
                        <label v-for="m in familyMembers" :key="m" class="member-check">
                          <input type="checkbox" :value="m" v-model="editForm.alreadyRead" />
                          {{ m }}
                        </label>
                      </div>
                    </div>

                    <div class="edit-actions">
                      <button class="btn btn-primary btn-sm" :disabled="saving" @click="saveEdit">
                        {{ saving ? 'Saving…' : 'Save' }}
                      </button>
                      <button class="btn btn-secondary btn-sm" @click="cancelEdit">Cancel</button>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <p v-else class="empty-state">No suggestions yet.</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useSuggestions } from '../../composables/useSuggestions.js'
import { useConfig } from '../../composables/useConfig.js'
import { useMemberProfiles } from '../../composables/useMemberProfiles.js'
import { GENRE_LIST } from '../../utils/genres.js'
import { fetchBookMetadata, searchBooks } from '../../utils/googleBooks.js'
import CoverUpload from '../shared/CoverUpload.vue'

const { suggestions, loading, deleteSuggestion, updateSuggestion } = useSuggestions()
const { familyMembers } = useConfig()
const { resolveName, resolveNames } = useMemberProfiles()

const emit = defineEmits(['promote'])

const editingId = ref(null)
const saving = ref(false)
const editForm = ref({})
const fetchingCover = ref(false)
const coverOptions = ref([])
const refreshing = ref(false)
const refreshProgress = ref('')

async function fetchCoverForEdit() {
  if (!editForm.value.title) return
  fetchingCover.value = true
  coverOptions.value = []
  try {
    const query = [editForm.value.title, editForm.value.author].filter(Boolean).join(' ')
    const results = await searchBooks(query)
    const withCovers = results.filter(r => r.coverUrl)
    if (withCovers.length) {
      coverOptions.value = withCovers
    } else {
      alert('No covers found for this title.')
    }
  } catch (err) {
    console.error('Cover fetch error:', err)
    alert('Cover fetch failed: ' + (err.message || 'Unknown error'))
  } finally {
    fetchingCover.value = false
  }
}

function pickCover(url) {
  editForm.value.coverUrl = url
  coverOptions.value = []
}

async function refreshMissingCovers() {
  const missing = suggestions.value.filter(s => !s.coverUrl)
  if (!missing.length) return
  refreshing.value = true
  let done = 0
  refreshProgress.value = `0/${missing.length}`
  try {
    for (const s of missing) {
      try {
        const meta = await fetchBookMetadata(s.title, s.author)
        if (meta?.coverUrl) await updateSuggestion(s.id, { coverUrl: meta.coverUrl })
      } catch (err) {
        console.error(`Cover fetch failed for "${s.title}":`, err)
      }
      done++
      refreshProgress.value = `${done}/${missing.length}`
    }
  } finally {
    refreshing.value = false
    refreshProgress.value = ''
  }
}

function startEdit(suggestion) {
  coverOptions.value = []
  editingId.value = suggestion.id
  editForm.value = {
    title: suggestion.title || '',
    author: suggestion.author || '',
    coverUrl: suggestion.coverUrl || '',
    description: suggestion.description || '',
    suggestedBy: suggestion.suggestedBy || '',
    publishedDate: suggestion.publishedDate || '',
    genres: Array.isArray(suggestion.genres) ? [...suggestion.genres] : [],
    alreadyRead: Array.isArray(suggestion.alreadyRead) ? [...suggestion.alreadyRead] : [],
  }
}

function cancelEdit() {
  editingId.value = null
  editForm.value = {}
  coverOptions.value = []
}

async function saveEdit() {
  saving.value = true
  try {
    await updateSuggestion(editingId.value, { ...editForm.value })
    cancelEdit()
  } catch (err) {
    console.error('Update error:', err)
    alert('Save failed: ' + (err.message || 'Unknown error'))
  } finally {
    saving.value = false
  }
}

async function deleteSug(suggestion) {
  if (!window.confirm(`Delete suggestion "${suggestion.title}"? This cannot be undone.`)) return
  try {
    await deleteSuggestion(suggestion.id)
  } catch (err) {
    console.error('Delete error:', err)
    alert('Delete failed: ' + (err.message || 'Unknown error'))
  }
}

function promote(suggestion) {
  emit('promote', {
    title: suggestion.title || '',
    author: suggestion.author || '',
    coverUrl: suggestion.coverUrl || '',
    goodreadsUrl: suggestion.goodreadsUrl || '',
    synopsis: suggestion.synopsis || '',
    description: suggestion.description || '',
    genres: Array.isArray(suggestion.genres) ? [...suggestion.genres] : [],
    meetingDate: '',
    meetingTime: '',
    meetingLocation: '',
    discordVoiceUrl: '',
    threads: [],
    materials: [],
    characters: [],
    timeline: [],
  })
}
</script>

<style scoped>
.admin-suggestions { display: flex; flex-direction: column; gap: 1rem; }

.section-header { display: flex; align-items: center; justify-content: space-between; }

.section-heading {
  font-family: var(--font-serif);
  font-size: 1.4rem;
  color: var(--text-primary);
  margin: 0;
}

.loading-state, .empty-state { color: var(--text-muted); font-style: italic; }

.table-wrap {
  overflow-x: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
}

.suggestions-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
  min-width: 700px;
}

.suggestions-table th {
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

.suggestion-row td {
  padding: 0.6rem 0.75rem;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
  color: var(--text-primary);
  background: var(--surface);
}

.suggestion-row:last-child td,
.edit-row:last-child .edit-cell { border-bottom: none; }

.suggestion-row:hover td { background: rgba(46, 112, 160, 0.12); }

.col-cover { width: 48px; }
.col-title { min-width: 130px; }
.col-author { min-width: 100px; color: var(--text-secondary); }
.col-published { width: 80px; color: var(--text-muted); font-size: 0.78rem; }
.col-votes { width: 55px; text-align: center; }
.col-suggested { min-width: 90px; color: var(--text-secondary); }
.col-readby { min-width: 100px; }
.col-actions { width: 170px; white-space: nowrap; }

.cover-thumb { width: 40px; height: 56px; object-fit: cover; border-radius: var(--radius-sm); display: block; }
.cover-placeholder { width: 40px; height: 56px; background: var(--surface-subtle); border-radius: var(--radius-sm); border: 1px solid var(--border); }

.book-title { display: block; font-weight: 600; }
.genre-list { display: block; font-size: 0.75rem; color: var(--text-muted); margin-top: 0.1rem; }

.vote-badge {
  display: inline-block;
  background: rgba(200, 150, 60, 0.12);
  color: var(--gold);
  border: 1px solid rgba(200, 150, 60, 0.3);
  border-radius: var(--radius-sm);
  padding: 0.1rem 0.45rem;
  font-size: 0.8rem;
  font-weight: 700;
}

.readby-text { font-size: 0.82rem; color: var(--text-muted); }
.empty-cell { color: var(--text-muted); }

/* ── Inline edit ── */
.edit-cell {
  padding: 1rem 0.75rem;
  border-bottom: 1px solid var(--border);
  background: var(--surface-subtle);
  color: var(--text-primary);
}

.edit-form {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.edit-cover-preview { flex-shrink: 0; }
.edit-thumb {
  width: 90px;
  aspect-ratio: 2/3;
  object-fit: cover;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  display: block;
}
.edit-thumb-placeholder {
  width: 90px;
  aspect-ratio: 2/3;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-book {
  width: 65%;
  opacity: 0.5;
  filter: drop-shadow(0 1px 4px rgba(160, 208, 240, 0.3));
}

.edit-fields { flex: 1; display: flex; flex-direction: column; gap: 0.75rem; }

.edit-row-fields {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.75rem;
}

.edit-field { display: flex; flex-direction: column; gap: 0.25rem; }

.edit-label {
  font-family: var(--font-sans);
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
}

.form-input {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 0.85rem;
  padding: 0.4rem 0.6rem;
  width: 100%;
  resize: vertical;
}

.form-input:focus { outline: none; border-color: var(--border-hover); }

.genre-check-grid, .member-check-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.genre-check, .member-check {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-family: var(--font-sans);
  font-size: 0.78rem;
  color: var(--text-secondary);
  cursor: pointer;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0.2rem 0.5rem;
}

.genre-check:has(input:checked), .member-check:has(input:checked) {
  border-color: var(--gold);
  color: var(--gold);
  background: rgba(200, 150, 60, 0.08);
}

.genre-check input, .member-check input { display: none; }

.edit-actions { display: flex; gap: 0.5rem; padding-top: 0.25rem; }

.cover-url-row { display: flex; gap: 0.5rem; align-items: center; }
.cover-url-row .form-input { flex: 1; }

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

.btn-sm { padding: 0.3rem 0.65rem; font-size: 0.78rem; }

.btn-primary { background: var(--gold); color: var(--bg); border-color: var(--gold); }
.btn-primary:hover { opacity: 0.85; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-secondary { background: transparent; border-color: var(--border-hover); color: var(--text-secondary); }
.btn-secondary:hover { border-color: var(--text-secondary); }

.btn-promote { background: transparent; border-color: var(--border-hover); color: var(--gold); }
.btn-promote:hover { border-color: var(--gold); background: rgba(200, 150, 60, 0.08); }

.btn-danger { background: transparent; border-color: rgba(242, 139, 130, 0.4); color: #f28b82; }
.btn-danger:hover { background: rgba(242, 139, 130, 0.1); }

.col-actions .btn + .btn { margin-left: 0.35rem; }

/* ── Cover picker ── */
.cover-picker {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.cover-picker-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.cover-option {
  padding: 0;
  border: 2px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  cursor: pointer;
  transition: border-color 0.15s;
  overflow: hidden;
  width: 60px;
}

.cover-option img {
  display: block;
  width: 60px;
  aspect-ratio: 2/3;
  object-fit: cover;
}

.cover-option:hover { border-color: var(--border-hover); }
.cover-option.selected { border-color: var(--gold); }
.cover-option:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }
</style>
