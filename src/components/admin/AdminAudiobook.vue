<template>
  <div class="admin-audiobook">
    <div class="section-header">
      <h2 class="section-heading">Audiobook Server</h2>
    </div>

    <div v-if="configLoading" class="loading-state">Loading settings…</div>

    <div v-else class="form-section">
      <div class="form-group">
        <label class="form-label">Audiobook Server Description</label>
        <textarea
          v-model="form.description"
          class="form-textarea"
          rows="4"
          placeholder="Brief description of the audiobook server (shown to members)…"
        ></textarea>
      </div>

      <div class="form-group">
        <label class="form-label">Audiobookshelf URL</label>
        <input
          v-model="form.audiobookUrl"
          type="url"
          class="form-input"
          placeholder="https://audiobooks.yourserver.com"
        />
      </div>

      <div class="form-group">
        <label class="form-label">Discord Invite URL <span class="label-note">(optional — shown as "Join Server" button)</span></label>
        <input
          v-model="form.discordInviteUrl"
          type="url"
          class="form-input"
          placeholder="https://discord.gg/…"
        />
      </div>

      <div class="form-group">
        <label class="form-label">Discord Webhook URL <span class="label-note">(masked for security)</span></label>
        <input
          v-model="form.discordWebhookUrl"
          type="password"
          class="form-input"
          placeholder="https://discord.com/api/webhooks/…"
          autocomplete="off"
        />
        <p class="field-hint">Used to post book club updates to Discord. Keep this private.</p>
      </div>

      <div class="form-actions">
        <button class="btn btn-primary" @click="save" :disabled="saving">
          {{ saving ? 'Saving…' : 'Save Settings' }}
        </button>
      </div>

      <p v-if="saveMessage" class="save-message" :class="saveMessageType">{{ saveMessage }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase.js'
import { useConfig } from '../../composables/useConfig.js'

const { audiobookServer, discordWebhookUrl, discordInviteUrl, loading: configLoading } = useConfig()

const saving = ref(false)
const saveMessage = ref('')
const saveMessageType = ref('success')

const form = ref({
  description: '',
  audiobookUrl: '',
  discordWebhookUrl: '',
  discordInviteUrl: '',
})

// Populate form once config loads — use a flag so subsequent snapshots
// (e.g. caused by saving other fields) don't overwrite user edits.
let populated = false
watch(
  [audiobookServer, discordWebhookUrl],
  ([server, webhookUrl]) => {
    if (populated) return
    // Only populate when we have actual data (not the initial null state)
    if (server !== null || webhookUrl !== '') {
      populated = true
      form.value.description = server?.description || ''
      form.value.audiobookUrl = server?.url || ''
      form.value.discordWebhookUrl = webhookUrl || ''
      form.value.discordInviteUrl = discordInviteUrl.value || ''
    }
  },
  { immediate: true }
)

function showMessage(msg, type = 'success') {
  saveMessage.value = msg
  saveMessageType.value = type
  setTimeout(() => { saveMessage.value = '' }, 4000)
}

async function save() {
  saving.value = true
  try {
    await updateDoc(doc(db, 'config', 'main'), {
      audiobookServer: {
        description: form.value.description,
        url: form.value.audiobookUrl,
      },
      discordWebhookUrl: form.value.discordWebhookUrl,
      discordInviteUrl: form.value.discordInviteUrl,
    })
    showMessage('Settings saved!')
  } catch (err) {
    console.error('Save error:', err)
    showMessage('Save failed: ' + (err.message || 'Unknown error'), 'error')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.admin-audiobook {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.form-section {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
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

.field-hint {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin: 0;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 0.25rem;
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
</style>
