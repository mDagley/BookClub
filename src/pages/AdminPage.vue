<template>
  <div class="admin-page">
    <div v-if="authStore.loading" class="admin-loading">
      <p>Loading...</p>
    </div>

    <div v-else-if="!authStore.user" class="admin-login">
      <h1 class="section-title">Admin Panel</h1>
      <p v-if="authError" class="login-error">{{ authError }}</p>
      <p>Login with your Discord account to manage book club content.</p>
      <p class="login-note">You must be a member of the family Discord server.</p>
      <button class="btn btn-discord" @click="authStore.loginWithDiscord()">
        Login with Discord
      </button>
      <button
        v-if="isDev"
        class="btn btn-dev"
        @click="authStore.devLogin()"
      >
        Dev Login (local only)
      </button>
    </div>

    <div v-else class="admin-content">
      <div class="admin-header">
        <h1 class="section-title">Admin Panel</h1>
        <span class="admin-user">{{ authStore.user.discordUsername }}</span>
      </div>

      <!-- Tab navigation: button row on desktop, select on mobile -->
      <nav ref="tabsNav" class="admin-tabs" role="tablist">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          role="tab"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
          :aria-selected="activeTab === tab.id"
          @click="switchTab(tab.id, $event)"
        >
          {{ tab.label }}
        </button>
      </nav>
      <select class="admin-tab-select" aria-label="Admin section" :value="activeTab" @change="activeTab = $event.target.value">
        <option v-for="tab in tabs" :key="tab.id" :value="tab.id">{{ tab.label }}</option>
      </select>

      <!-- Tab panels -->
      <div class="tab-panel">
        <AdminCurrentBook
          v-if="activeTab === 'current'"
          :prefill="currentBookPrefill"
          @prefill-consumed="currentBookPrefill = null"
        />
        <AdminPastBooks v-else-if="activeTab === 'past'" />
        <AdminSuggestions
          v-else-if="activeTab === 'suggestions'"
          @promote="onPromote"
        />
        <AdminAudiobook v-else-if="activeTab === 'audiobook'" />
        <AdminMembers v-else-if="activeTab === 'members'" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import AdminCurrentBook from '../components/admin/AdminCurrentBook.vue'
import AdminPastBooks from '../components/admin/AdminPastBooks.vue'
import AdminSuggestions from '../components/admin/AdminSuggestions.vue'
import AdminAudiobook from '../components/admin/AdminAudiobook.vue'
import AdminMembers from '../components/admin/AdminMembers.vue'

const authStore = useAuthStore()
const route = useRoute()
const authError = ref(null)
const isDev = import.meta.env.DEV && import.meta.env.VITE_DEV_AUTH === 'true'
const tabsNav = ref(null)

const tabs = [
  { id: 'current', label: 'Current Book' },
  { id: 'past', label: 'Past Books' },
  { id: 'suggestions', label: 'Suggestions' },
  { id: 'audiobook', label: 'Audiobook' },
  { id: 'members', label: 'Members' },
]

const activeTab = ref('current')
const currentBookPrefill = ref(null)

function switchTab(id, event) {
  activeTab.value = id
  nextTick(() => event?.target?.scrollIntoView({ inline: 'nearest', block: 'nearest' }))
}

function onPromote(bookData) {
  currentBookPrefill.value = bookData
  activeTab.value = 'current'
  nextTick(() => {
    const btn = tabsNav.value?.querySelector('.tab-btn.active')
    btn?.scrollIntoView({ inline: 'nearest', block: 'nearest' })
  })
}

onMounted(async () => {
  // Handle Discord OAuth callback — Discord redirects back to /admin?code=...
  const code = route.query.code
  if (code && !authStore.user) {
    window.history.replaceState({}, '', '/admin')
    try {
      await authStore.handleCallback(code)
      authError.value = null
      // Return to the page the user was on before logging in
      const returnTo = sessionStorage.getItem('loginReturnTo')
      if (returnTo && returnTo !== '/admin') {
        sessionStorage.removeItem('loginReturnTo')
        window.location.replace(returnTo)
      }
    } catch (err) {
      authError.value = err.message?.includes('permission-denied')
        ? 'You must be a member of the family Discord server to access the admin panel.'
        : 'Login failed. Please try again.'
    }
  }
})
</script>

<style scoped>
.admin-page {
  max-width: 1100px;
  margin: 2rem auto;
  padding: 0 1.5rem 3rem;
}

.admin-loading,
.admin-login {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.login-note {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.btn-dev {
  background: transparent;
  border: 1px dashed var(--border-hover);
  color: var(--text-muted);
  font-size: 0.8rem;
  padding: 0.4rem 1rem;
}

.login-error {
  color: #f28b82;
  font-size: 0.9rem;
  background: rgba(242, 139, 130, 0.1);
  border: 1px solid rgba(242, 139, 130, 0.3);
  border-radius: var(--radius-sm);
  padding: 0.5rem 1rem;
}

.admin-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.admin-user {
  font-size: 0.85rem;
  color: var(--text-muted);
}

/* Tabs */
.admin-tabs {
  display: flex;
  gap: 0.25rem;
  border-bottom: 1px solid var(--border);
  overflow-x: auto;
  scrollbar-width: none;
}

.admin-tabs::-webkit-scrollbar {
  display: none;
}

.tab-btn {
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font-family: var(--font-sans);
  font-size: 0.88rem;
  font-weight: 600;
  padding: 0.6rem 1rem;
  white-space: nowrap;
  transition: color 0.15s, border-color 0.15s;
  margin-bottom: -1px;
}

.tab-btn:hover {
  color: var(--text-primary);
}

.tab-btn.active {
  color: var(--gold);
  border-bottom-color: var(--gold);
}

.tab-panel {
  min-height: 400px;
}

.admin-tab-select {
  display: none;
}

@media (max-width: 600px) {
  .admin-page {
    margin: 0.75rem auto;
    padding: 0 1.25rem 3rem;
  }

  .admin-content {
    gap: 1.5rem;
  }

  .tab-panel {
    min-height: unset;
  }

  .admin-tabs {
    display: none;
  }

  .admin-tab-select {
    display: block;
    width: 100%;
    padding: 0.65rem 0.9rem;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    font-family: var(--font-sans);
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23a0a0b0' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.9rem center;
    padding-right: 2.5rem;
  }
}
</style>
