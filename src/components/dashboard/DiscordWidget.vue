<template>
  <div class="discord-widget">
    <p class="section-title">Join our Discord</p>

    <p class="discord-desc">
      Our family book club discussions, polls, and chat happen in Discord.
      Join us to be part of the conversation!
    </p>

    <div class="discord-actions">
      <a
        v-if="discordInviteUrl"
        :href="discordInviteUrl"
        target="_blank"
        rel="noopener"
        class="btn btn-discord"
      >Join Server →</a>

      <template v-if="!requestSent">
        <button class="btn" @click="showForm = !showForm">
          Request Access
        </button>
      </template>
      <p v-else class="request-sent">Request sent! ✓</p>
    </div>

    <form v-if="showForm && !requestSent" class="request-form" @submit.prevent="submit">
      <input
        v-model="name"
        type="text"
        placeholder="Your name"
        required
        class="form-input"
      />
      <textarea
        v-model="message"
        placeholder="Optional message (how do we know you?)"
        rows="2"
        class="form-input"
      />
      <p v-if="error" class="request-error">{{ error }}</p>
      <button type="submit" class="btn btn-discord" :disabled="submitting">
        {{ submitting ? 'Sending…' : 'Send Request' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  discordInviteUrl: { type: String, default: '' },
})

const showForm = ref(false)
const name = ref('')
const message = ref('')
const submitting = ref(false)
const requestSent = ref(false)
const error = ref('')

async function submit() {
  submitting.value = true
  error.value = ''
  try {
    const res = await fetch('/api/send-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.value,
        message: `[Discord Access Request] ${message.value}`,
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to send')
    requestSent.value = true
    showForm.value = false
  } catch (err) {
    error.value = err.message?.includes('not configured')
      ? 'Requests are not set up yet. Contact an admin directly.'
      : 'Failed to send. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.discord-desc {
  font-family: var(--font-sans);
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.discord-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
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
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--border-hover);
}
</style>
