<template>
  <div class="audiobook-widget">
    <p class="section-title">Audiobook Server</p>

    <p class="audiobook-desc">
      {{ audiobookServer?.description || 'Access our family Audiobookshelf server.' }}
    </p>

    <div class="audiobook-actions">
      <a
        v-if="audiobookServer?.url"
        :href="audiobookServer.url"
        target="_blank"
        rel="noopener"
        class="btn btn-primary"
      >Sign in →</a>

      <button
        v-if="!requestSent"
        class="btn"
        @click="showForm = !showForm"
      >Request Access</button>
      <p v-else class="request-sent">Request sent! ✓</p>
    </div>

    <form v-if="showForm && !requestSent" class="request-form" @submit.prevent="submitRequest">
      <input
        v-model="requestName"
        type="text"
        placeholder="Your name"
        required
        class="form-input"
      />
      <textarea
        v-model="requestMessage"
        placeholder="Optional message"
        rows="2"
        class="form-input"
      />
      <p v-if="requestError" class="request-error">{{ requestError }}</p>
      <button type="submit" class="btn btn-primary" :disabled="submitting">
        {{ submitting ? 'Sending…' : 'Send Request' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  audiobookServer: { type: Object, default: null },
})

const showForm = ref(false)
const requestName = ref('')
const requestMessage = ref('')
const submitting = ref(false)
const requestSent = ref(false)
const requestError = ref('')

async function submitRequest() {
  submitting.value = true
  requestError.value = ''
  try {
    const res = await fetch('/api/send-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: requestName.value, message: requestMessage.value }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to send request')
    requestSent.value = true
    showForm.value = false
  } catch (err) {
    requestError.value = err.message?.includes('not configured')
      ? 'Access requests are not set up yet. Please contact an admin.'
      : 'Failed to send request. Please try again.'
    console.error('sendWebhook failed:', err)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.audiobook-desc {
  font-family: var(--font-sans);
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.audiobook-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.25rem;
}

.request-sent {
  font-family: var(--font-sans);
  font-size: 0.85rem;
  color: #7ab87a;
}

.request-error {
  font-family: var(--font-sans);
  font-size: 0.8rem;
  color: #f28b82;
}

.request-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.form-input {
  background: var(--surface-subtle);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 0.85rem;
  padding: 0.4rem 0.6rem;
  width: 100%;
  resize: none;
}

.form-input:focus {
  outline: none;
  border-color: var(--border-hover);
}
</style>
