<template>
  <div class="admin-suggestions">
    <div class="section-header">
      <h2 class="section-heading">Suggestions</h2>
      <button
        type="button"
        class="btn btn-secondary btn-sm"
        :disabled="refreshing"
        @click="refreshMissingCovers"
      >{{ refreshing ? `Fetching… (${refreshProgress})` : 'Fill missing covers & dates' }}</button>
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
                <img v-if="suggestion.coverUrl" :src="suggestion.coverUrl" :alt="suggestion.title" class="cover-thumb" @error="e => { e.target.style.display = 'none'; e.target.parentElement?.querySelector('.cover-placeholder')?.style.removeProperty('display') }" />
                <div class="cover-placeholder" :style="suggestion.coverUrl ? 'display: none' : undefined"></div>
              </td>
              <td class="col-title" data-label="Title" :data-author="suggestion.author">
                <span class="sr-only">Title: </span><span class="book-title">{{ suggestion.title }}</span>
              </td>
              <td class="col-author" data-label="Author">
                <span class="author-name">{{ suggestion.author }}</span>
                <span v-if="suggestion.genres?.length" class="genre-list">
                  <span v-for="g in suggestion.genres" :key="g" class="genre-icon" :title="g" :aria-label="g">
                    <img v-if="GENRE_ICONS[g]?.img" :src="GENRE_ICONS[g].img" :alt="g" class="genre-icon-img" />
                    <template v-else>{{ g }}</template>
                  </span>
                </span>
              </td>
              <td class="col-published" data-label="Published">{{ suggestion.publishedDate || '—' }}</td>
              <td class="col-votes" data-label="Votes"><span class="sr-only">Votes: </span><span class="vote-badge">{{ suggestion.votes ?? 0 }}</span></td>
              <td class="col-suggested" data-label="Suggested by">{{ resolveName(suggestion.suggestedBy) || '—' }}</td>
              <td class="col-readby" data-label="Read by">
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
import { GENRE_LIST, GENRE_ICONS } from '../../utils/genres.js'
import { fetchBookMetadata, fetchCoverOptions } from '../../utils/googleBooks.js'
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
  const title = editForm.value.title?.trim()
  const author = editForm.value.author?.trim()
  if (!title) return
  fetchingCover.value = true
  coverOptions.value = []
  try {
    const options = await fetchCoverOptions(title, author)
    if (options.length) {
      coverOptions.value = options
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
  const missing = suggestions.value.filter(s => !s.coverUrl || !s.publishedDate)
  if (!missing.length) return
  refreshing.value = true
  let done = 0
  refreshProgress.value = `0/${missing.length}`
  try {
    for (const s of missing) {
      try {
        const meta = await fetchBookMetadata(s.title, s.author)
        if (meta) {
          const updates = {}
          if (!s.coverUrl && meta.coverUrl) updates.coverUrl = meta.coverUrl
          if (!s.publishedDate && meta.publishedDate) updates.publishedDate = meta.publishedDate
          if (Object.keys(updates).length) await updateSuggestion(s.id, updates)
        }
      } catch (err) {
        console.error(`Metadata fetch failed for "${s.title}":`, err)
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

.admin-suggestions { display: flex; flex-direction: column; gap: 1rem; }

.section-header { display: flex; align-items: center; justify-content: space-between; }

.section-heading {
  font-family: var(--font-serif);
  font-size: 1.4rem;
  color: var(--text-primary);
  margin: 0;
}

.loading-state, .empty-state { color: var(--text-muted); font-style: italic; }

/* Table / Mobile card (mobile-first base — no media query) */
.table-wrap { }

.suggestions-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}

.suggestions-table thead {
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

.suggestion-row {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr auto auto;
  position: relative;
  aspect-ratio: 2 / 3;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0,0,0,0.45);
  border-top: 3px solid rgba(200, 150, 60, 0.75);
  margin-bottom: 1.25rem;
}

.suggestion-row:hover > * { background: transparent; }

/* Using > * (specificity 0,1,0) so individual cell classes can override without !important */
.suggestion-row > * {
  display: block;
  padding: 0;
  border-bottom: none;
  background: transparent;
  vertical-align: unset;
}

/* Cover — absolute fill */
.col-cover {
  position: absolute;
  inset: 0;
  width: auto;
  z-index: 0;
  overflow: hidden;
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

/* Votes — absolute top-right badge */
.col-votes {
  position: absolute;
  top: 0.55rem;
  right: 0.6rem;
  z-index: 3;
  pointer-events: none;
}

.vote-badge {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  line-height: 1;
  font-size: 0.9rem;
  font-weight: 800;
  color: rgba(15, 7, 0, 0.9);
  background: linear-gradient(105deg,
    rgba(130, 88, 8, 1) 0%,
    rgba(210, 162, 30, 1) 30%,
    rgba(255, 218, 70, 0.98) 52%,
    rgba(218, 168, 32, 1) 72%,
    rgba(145, 98, 10, 1) 100%
  );
  border-radius: 8px;
  padding: 0.25rem 0.55rem 0.2rem;
  text-align: center;
  gap: 0.1rem;
  text-shadow: 0 1px 1px rgba(255, 240, 150, 0.3);
}

.vote-badge::before {
  content: "▲";
  font-size: 0.45rem;
  opacity: 0.7;
  letter-spacing: 0;
}

/* Author cell — row 1 spacer with genre icons at bottom */
.col-author {
  grid-column: 1;
  grid-row: 1;
  display: flex;
  align-items: flex-end;
  padding: 0.6rem 0.7rem;
  z-index: 2;
  pointer-events: none;
  font-style: normal;
}

.author-name { display: none; }

.genre-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0;
  font-style: normal;
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
}

.book-title {
  display: block;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.3;
  color: var(--text-primary);
}

.col-title::after {
  content: attr(data-author);
  display: block;
  font-style: italic;
  font-size: 0.82rem;
  font-weight: 400;
  color: var(--text-secondary);
  margin-top: 0.3rem;
}

.col-published { display: none; }
.col-suggested { display: none; }
.col-readby { display: none; }

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
.col-actions .btn-promote::before  { content: "↥"; }
.col-actions .btn-danger::before   { content: "✕"; }

.col-actions .btn:last-child { border-right: none; }
.col-actions .btn + .btn { margin-left: 0; }

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

.cover-url-row { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
.cover-url-row .form-input { flex: 1 0 100%; }

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
  width: 80px;
}

.cover-option img {
  display: block;
  width: 80px;
  aspect-ratio: 2/3;
  object-fit: cover;
}

.cover-option:hover { border-color: var(--border-hover); }
.cover-option.selected { border-color: var(--gold); }
.cover-option:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }

/* Desktop table layout — overrides mobile card base above */
@media (min-width: 601px) {
  .table-wrap {
    overflow-x: auto;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--surface);
  }

  .suggestions-table { min-width: 700px; }
  .suggestions-table thead {
    display: table-header-group;
    position: static;
    width: auto;
    height: auto;
    margin: 0;
    overflow: visible;
    clip: auto;
    white-space: normal;
  }

  .suggestion-row {
    display: table-row;
    aspect-ratio: unset;
    position: static;
    border-radius: 0;
    overflow: visible;
    box-shadow: none;
    border-top: none;
    margin-bottom: 0;
  }

  .suggestion-row:hover > * { background: rgba(46, 112, 160, 0.12); }

  .suggestion-row > * {
    display: table-cell;
    padding: 0.6rem 0.75rem;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
    vertical-align: middle;
    color: var(--text-primary);
  }

  .suggestion-row:last-child > *,
  .edit-row:last-child .edit-cell { border-bottom: none; }

  .col-cover {
    position: static;
    inset: unset;
    width: 90px;
    overflow: visible;
    z-index: auto;
  }

  .col-cover::after { display: none; }

  .col-cover .cover-thumb {
    width: 80px;
    height: auto;
    aspect-ratio: 2/3;
    object-fit: cover;
    border-radius: var(--radius-sm);
    display: block;
  }

  .col-cover .cover-placeholder {
    width: 80px;
    height: auto;
    aspect-ratio: 2/3;
    background: var(--surface-subtle);
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
  }

  .col-votes {
    position: static;
    top: unset;
    right: unset;
    z-index: auto;
    pointer-events: auto;
    width: 55px;
    text-align: center;
  }

  .vote-badge {
    display: inline-block;
    flex-direction: unset;
    align-items: unset;
    line-height: inherit;
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--gold);
    background: rgba(200, 150, 60, 0.12);
    border: 1px solid rgba(200, 150, 60, 0.3);
    border-radius: var(--radius-sm);
    padding: 0.1rem 0.45rem;
    text-align: unset;
    gap: unset;
    text-shadow: none;
    backdrop-filter: none;
  }

  .vote-badge::before { content: none; display: none; }

  .col-author {
    display: table-cell;
    min-width: 100px;
    color: var(--text-secondary);
    align-items: unset;
    pointer-events: auto;
    z-index: auto;
    grid-row: unset;
    grid-column: unset;
    padding: 0.6rem 0.75rem;
  }

  .author-name { display: inline; }

  .genre-list {
    display: block;
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-top: 0.1rem;
  }

  .col-title {
    min-width: 130px;
    z-index: auto;
    background: var(--surface);
    backdrop-filter: none;
    padding: 0.6rem 0.75rem;
    grid-row: unset;
    grid-column: unset;
  }

  .col-title::after { content: none; display: none; }

  .book-title {
    font-size: inherit;
    font-weight: 600;
    line-height: inherit;
    color: inherit;
  }

  .col-published { display: table-cell; width: 80px; color: var(--text-muted); font-size: 0.78rem; }
  .col-suggested { display: table-cell; min-width: 90px; color: var(--text-secondary); }
  .col-readby { display: table-cell; min-width: 100px; }

  .col-actions {
    display: table-cell;
    width: 170px;
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
}

@media (max-width: 600px) {
  .section-header .btn-sm { font-size: 0.72rem; padding: 0.25rem 0.5rem; }

  .col-actions .btn:hover { background: rgba(255,255,255,0.05); }

  /* Edit row */
  .edit-row { display: block; }
  .edit-cell { display: block; }
  .edit-form { flex-direction: column; }
  .edit-cover-preview { display: none; }
  .edit-row-fields { grid-template-columns: 1fr; }
}
</style>
