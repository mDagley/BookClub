<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <div
      ref="modalRef"
      class="modal-box card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      tabindex="-1"
      @keydown="trapFocus"
    >
      <div class="modal-header">
        <p id="modal-title" class="section-title">Suggest a Book</p>
        <button class="close-btn" title="Close" aria-label="Close dialog" @click="emit('close')">✕</button>
      </div>

      <form class="suggest-form" @submit.prevent="handleSubmit">
        <!-- Title -->
        <div class="field">
          <label class="field-label" for="s-title">Title <span class="required">*</span></label>
          <input
            id="s-title"
            v-model="form.title"
            type="text"
            class="field-input"
            placeholder="Book title"
            required
            :disabled="submitting"
          />
        </div>

        <!-- Author -->
        <div class="field">
          <label class="field-label" for="s-author">Author <span class="required">*</span></label>
          <input
            id="s-author"
            v-model="form.author"
            type="text"
            class="field-input"
            placeholder="Author name"
            required
            :disabled="submitting"
            @blur="autofillFromApi"
          />
          <span v-if="fetchingMeta" class="fetch-hint">Fetching book info…</span>
        </div>

        <!-- Optional cover upload -->
        <div class="field cover-field">
          <span class="field-label">Cover <span class="field-optional">(optional — auto-fetched if blank)</span></span>
          <div class="cover-row">
            <img v-if="form.coverUrl" :src="form.coverUrl" alt="Cover preview" class="cover-preview-thumb" />
            <div v-else class="cover-preview-empty">📚</div>
            <div class="cover-actions">
              <CoverUpload
                :book-id="'suggest-' + Date.now()"
                label="Upload cover"
                @uploaded="url => form.coverUrl = url"
              />
              <button v-if="form.coverUrl" type="button" class="cover-clear-btn" @click="form.coverUrl = ''">✕ Clear</button>
            </div>
          </div>
        </div>

        <!-- Genres — checkbox chips -->
        <div class="field">
          <span class="field-label">Genres</span>
          <div class="genre-checkboxes">
            <label
              v-for="genre in GENRE_LIST"
              :key="genre"
              class="genre-chip-label"
              :class="{ selected: form.genres.includes(genre) }"
            >
              <input
                type="checkbox"
                class="sr-only"
                :value="genre"
                v-model="form.genres"
                :disabled="submitting"
              />
              {{ GENRE_ICONS[genre]?.icon }} {{ genre }}
            </label>
          </div>
        </div>

        <!-- Description -->
        <div class="field">
          <label class="field-label" for="s-desc">Description <span class="required">*</span></label>
          <textarea
            id="s-desc"
            v-model="form.description"
            class="field-input"
            rows="3"
            placeholder="Brief description of the book"
            required
            :disabled="submitting"
          />
        </div>

        <!-- Already read checkbox -->
        <div class="field field-row">
          <label class="field-checkbox-label" :class="{ disabled: !currentMember }">
            <input
              type="checkbox"
              v-model="form.iAlreadyRead"
              :disabled="submitting || !currentMember"
            />
            I've already read this
          </label>
          <span v-if="!currentMember" class="field-note">
            Select your name above to use this.
          </span>
        </div>

        <!-- Your name -->
        <div class="field">
          <label class="field-label" for="s-name">Your name <span class="required">*</span></label>
          <input
            id="s-name"
            v-model="form.suggestedBy"
            type="text"
            class="field-input"
            placeholder="Your name"
            required
            :disabled="submitting"
          />
        </div>

        <!-- Error -->
        <p v-if="errorMsg" class="form-error">{{ errorMsg }}</p>

        <!-- Actions -->
        <div class="form-actions">
          <button type="button" class="btn" :disabled="submitting" @click="emit('close')">
            Cancel
          </button>
          <button type="submit" class="btn btn-gold" :disabled="submitting">
            <span v-if="submitting">Submitting…</span>
            <span v-else>Submit Suggestion</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, onUnmounted } from 'vue'
import { db } from '../../firebase.js'
import { doc, updateDoc } from 'firebase/firestore'
import { GENRE_ICONS, GENRE_LIST } from '../../utils/genres.js'
import { fetchBookMetadata, fetchCoverUrl } from '../../utils/googleBooks.js'
import CoverUpload from '../shared/CoverUpload.vue'
import { useAuthStore } from '../../stores/auth.js'
import { useMemberProfiles } from '../../composables/useMemberProfiles.js'

const props = defineProps({
  addSuggestion: { type: Function, required: true },
})

const emit = defineEmits(['close', 'submitted'])

const modalRef = ref(null)
const authStore = useAuthStore()
const { resolveName } = useMemberProfiles()

// Use display name from member profiles if available, otherwise Discord handle
const currentMember = ref(
  authStore.user?.discordUsername
    ? resolveName(authStore.user.discordUsername)
    : null
)

const form = reactive({
  title: '',
  author: '',
  coverUrl: '',
  genres: [],
  description: '',
  publishedDate: '',
  iAlreadyRead: false,
  suggestedBy: currentMember.value || '',
})

const submitting = ref(false)
const errorMsg = ref('')
const fetchingMeta = ref(false)

async function autofillFromApi() {
  if (!form.title || !form.author) return
  fetchingMeta.value = true
  const meta = await fetchBookMetadata(form.title, form.author)
  fetchingMeta.value = false
  if (!meta) return
  if (meta.fullDescription && !form.description) form.description = meta.fullDescription
  if (meta.genres.length && !form.genres.length) form.genres = meta.genres
  if (meta.publishedDate && !form.publishedDate) form.publishedDate = meta.publishedDate
}

async function handleSubmit() {
  errorMsg.value = ''

  // Validate
  if (!form.title.trim()) { errorMsg.value = 'Title is required.'; return }
  if (!form.author.trim()) { errorMsg.value = 'Author is required.'; return }
  if (!form.description.trim()) { errorMsg.value = 'Description is required.'; return }
  if (!form.suggestedBy.trim()) { errorMsg.value = 'Your name is required.'; return }

  submitting.value = true
  try {
    const alreadyRead = form.iAlreadyRead && form.suggestedBy.trim()
      ? [form.suggestedBy.trim()]
      : []

    // Submit immediately with coverUrl null
    const docRef = await props.addSuggestion({
      title: form.title.trim(),
      author: form.author.trim(),
      genres: form.genres,
      description: form.description.trim(),
      publishedDate: form.publishedDate || null,
      alreadyRead,
      suggestedBy: form.suggestedBy.trim(),
      coverUrl: null,
    })

    // Close modal right away
    submitting.value = false
    emit('submitted')

    // Fetch cover in background and update if found
    if (docRef?.id) {
      fetchCoverUrl(form.title.trim(), form.author.trim()).then((coverUrl) => {
        if (coverUrl) {
          updateDoc(doc(db, 'suggestions', docRef.id), { coverUrl }).catch(() => {})
        }
      }).catch(() => {})
    }
  } catch (err) {
    console.error('addSuggestion error:', err)
    errorMsg.value = 'Something went wrong. Please try again.'
    submitting.value = false
  }
}

// Escape key to close
function onKeydown(e) {
  if (e.key === 'Escape') emit('close')
}

// Focus trap
function trapFocus(e) {
  if (e.key !== 'Tab') return
  const focusable = modalRef.value?.querySelectorAll(
    'button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
  )
  if (!focusable?.length) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  document.getElementById('s-title')?.focus()
})
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1rem;
  overflow-y: auto;
}

.modal-box {
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 1.5rem;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 0.25rem;
}

.modal-header .section-title {
  margin-bottom: 0;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0.1rem 0.4rem;
  border-radius: var(--radius-sm);
  transition: color 0.15s;
  line-height: 1;
}

.close-btn:hover {
  color: var(--text-primary);
}

/* Form */
.suggest-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 0.5rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field-row {
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.field-label {
  font-family: var(--font-sans);
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.required {
  color: var(--gold);
}

.field-input {
  background: var(--surface-subtle);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 0.85rem;
  padding: 0.5rem 0.7rem;
  transition: border-color 0.2s;
  resize: vertical;
}

.field-input:focus {
  outline: none;
  border-color: var(--border-hover);
}

.field-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Genre checkbox chips */
.genre-checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.genre-chip-label {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  background: var(--surface-subtle);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  font-family: var(--font-sans);
  font-size: 0.72rem;
  padding: 0.25rem 0.6rem;
  border-radius: 20px;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
  user-select: none;
}

.genre-chip-label:hover {
  border-color: var(--border-hover);
  color: var(--text-primary);
}

.genre-chip-label.selected {
  border-color: var(--gold);
  color: var(--gold);
  background: rgba(200, 150, 60, 0.12);
}

/* Visually hidden but accessible */
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

/* Already-read checkbox */
.field-checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-family: var(--font-sans);
  font-size: 0.82rem;
  color: var(--text-secondary);
  cursor: pointer;
}

.field-checkbox-label.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.field-note {
  font-family: var(--font-sans);
  font-size: 0.72rem;
  color: var(--text-muted);
  font-style: italic;
}

/* Error */
.cover-field .field-optional {
  font-weight: 400;
  text-transform: none;
  font-size: 0.7rem;
  color: var(--text-dim);
}

.cover-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.cover-preview-thumb {
  width: 48px;
  aspect-ratio: 2/3;
  object-fit: cover;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  flex-shrink: 0;
}

.cover-preview-empty {
  width: 48px;
  aspect-ratio: 2/3;
  background: var(--surface-subtle);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.cover-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.cover-clear-btn {
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-family: var(--font-sans);
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
}

.cover-clear-btn:hover { border-color: #f28b82; color: #f28b82; }

.fetch-hint {
  font-family: var(--font-sans);
  font-size: 0.75rem;
  color: var(--text-dim);
  font-style: italic;
}

.form-error {
  font-family: var(--font-sans);
  font-size: 0.8rem;
  color: #e07070;
  background: rgba(224, 112, 112, 0.08);
  border: 1px solid rgba(224, 112, 112, 0.25);
  border-radius: var(--radius-sm);
  padding: 0.4rem 0.7rem;
}

/* Actions */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  margin-top: 0.25rem;
}
</style>
