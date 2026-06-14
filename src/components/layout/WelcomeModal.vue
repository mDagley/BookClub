<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="visible" class="welcome-backdrop" @click.self="dismiss" @keydown.esc="dismiss">
        <div ref="modalRef" class="welcome-modal" role="dialog" aria-modal="true" aria-labelledby="welcome-title" tabindex="-1">
          <button class="close-btn" aria-label="Close" @click="dismiss">✕</button>

          <!-- Steps -->
          <div class="step">
            <div class="step-icon">{{ steps[current].icon }}</div>
            <h2 id="welcome-title" class="step-title">{{ steps[current].title }}</h2>
            <p class="step-body" v-html="steps[current].body" />
          </div>

          <!-- Progress dots -->
          <div class="dots" role="tablist" aria-label="Tutorial steps">
            <button
              v-for="(_, i) in steps"
              :key="i"
              class="dot"
              :class="{ active: i === current }"
              :aria-label="`Step ${i + 1}`"
              :aria-selected="i === current"
              role="tab"
              @click="current = i"
            />
          </div>

          <!-- Actions -->
          <div class="actions">
            <button v-if="current > 0" class="btn btn-ghost" @click="current--">Back</button>
            <span v-else class="btn-spacer" />

            <button v-if="current < steps.length - 1" class="btn btn-primary" @click="current++">
              Next
            </button>
            <template v-else>
              <button class="btn btn-discord" @click="login">Login with Discord</button>
              <button class="btn btn-ghost skip-btn" @click="dismiss">Skip for now</button>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { useAuthStore } from '../../stores/auth.js'

const SEEN_KEY = 'bookclub_welcome_seen'

const authStore = useAuthStore()
const visible = ref(false)
const current = ref(0)
const modalRef = ref(null)

const steps = [
  {
    icon: '📚',
    title: 'Welcome to the family book club!',
    body: 'This is where we track what we\'re reading, vote on the next book, and share our thoughts. Everything is in one place — the current book, past reads, and all the suggestions.',
  },
  {
    icon: '🔍',
    title: 'Spoiler-free browsing',
    body: 'On the current book page and any past book page, you can <strong>set your chapter number</strong> to hide characters and story timeline events you haven\'t reached yet. Everything past your chapter stays hidden until you\'re ready.',
  },
  {
    icon: '🗳️',
    title: 'Suggest and vote on books',
    body: 'Anyone in the family can suggest books for the club to read next. <strong>Voting, suggesting, and marking books as read all require a Discord login.</strong> Browse without logging in anytime you like.',
  },
  {
    icon: '🔒',
    title: 'How to log in',
    body: 'We use Discord for login — no new password needed. Click <strong>"Login with Discord"</strong> in the top-right corner (or the button below) and it will take you straight back here once you\'re signed in.',
  },
]

// Watch both loading and user so we handle the OAuth callback race:
// handleCallback() sets loading=false before onAuthStateChanged fires,
// so we must also close if user becomes truthy after the modal is shown.
watch(
  () => [authStore.loading, authStore.user],
  async ([loading, user]) => {
    if (user) {
      visible.value = false
      return
    }
    if (!loading && !localStorage.getItem(SEEN_KEY)) {
      visible.value = true
      await nextTick()
      modalRef.value?.focus()
    }
  },
  { immediate: true }
)

function dismiss() {
  visible.value = false
  localStorage.setItem(SEEN_KEY, '1')
}

function login() {
  dismiss()
  authStore.loginWithDiscord()
}
</script>

<style scoped>
.welcome-backdrop {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(4, 8, 20, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.welcome-modal {
  position: relative;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 2.5rem 2rem 1.75rem;
  max-width: 420px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
}

.close-btn {
  position: absolute;
  top: 0.85rem;
  right: 0.85rem;
  background: none;
  border: none;
  color: var(--text-dim);
  font-size: 0.85rem;
  cursor: pointer;
  padding: 0.2rem 0.4rem;
  border-radius: var(--radius-sm);
  transition: color 0.2s;
}
.close-btn:hover { color: var(--text-primary); }

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.75rem;
  min-height: 160px;
}

.step-icon {
  font-size: 2.5rem;
  line-height: 1;
}

.step-title {
  font-family: var(--font-serif);
  font-size: 1.25rem;
  color: var(--gold);
  line-height: 1.3;
}

.step-body {
  font-family: var(--font-sans);
  font-size: 0.88rem;
  color: var(--text-secondary);
  line-height: 1.7;
}

.step-body :deep(strong) {
  color: var(--text-primary);
  font-weight: 600;
}

.dots {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--border-hover);
  border: none;
  cursor: pointer;
  padding: 0;
  transition: background 0.2s, transform 0.2s;
}

.dot.active {
  background: var(--gold);
  transform: scale(1.25);
}

.actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  justify-content: space-between;
  flex-wrap: wrap;
}

.btn-spacer { flex: 1; }

.skip-btn {
  font-size: 0.75rem;
  padding: 0.25rem 0.6rem;
  color: var(--text-dim);
  border-color: transparent;
}
.skip-btn:hover { color: var(--text-muted); border-color: var(--border); }

/* Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-active .welcome-modal,
.fade-leave-active .welcome-modal {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.fade-enter-from .welcome-modal,
.fade-leave-to .welcome-modal {
  transform: translateY(12px);
  opacity: 0;
}
</style>
