<template>
  <div class="admin-page">
    <div v-if="authStore.loading" class="admin-loading">
      <p>Loading...</p>
    </div>

    <div v-else-if="!authStore.user" class="admin-login">
      <h1 class="section-title">Admin Panel</h1>
      <p>Login with your Discord account to manage book club content.</p>
      <p class="login-note">You must be a member of the family Discord server.</p>
      <button class="btn btn-discord" @click="authStore.loginWithDiscord()">
        Login with Discord
      </button>
    </div>

    <div v-else class="admin-content">
      <h1 class="section-title">Admin Panel</h1>
      <p>Welcome, {{ authStore.user.discordUsername }}! Full admin UI coming in Phase 9.</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const authStore = useAuthStore()
const route = useRoute()

onMounted(async () => {
  // Handle Discord OAuth callback — Discord redirects back to /admin?code=...
  const code = route.query.code
  if (code && !authStore.user) {
    await authStore.handleCallback(code)
    // Remove ?code= from URL without page reload
    window.history.replaceState({}, '', '/admin')
  }
})
</script>

<style scoped>
.admin-page {
  max-width: 800px;
  margin: 4rem auto;
  padding: 0 1.5rem;
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

.admin-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
