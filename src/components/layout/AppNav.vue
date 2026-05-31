<template>
  <nav class="app-nav">
    <RouterLink to="/" class="nav-title">The Family That Reads Together</RouterLink>
    <div class="nav-links">
      <RouterLink to="/">Home</RouterLink>
      <RouterLink to="/book">This Book</RouterLink>
      <RouterLink to="/suggestions">Suggestions</RouterLink>
      <RouterLink to="/past-books">Past Books</RouterLink>
      <RouterLink v-if="authStore.user" to="/admin" class="nav-admin">Admin</RouterLink>
    </div>
    <div class="nav-auth">
      <template v-if="authStore.user">
        <span class="nav-username">{{ authStore.user.discordUsername }}</span>
        <button class="btn btn-ghost nav-logout" @click="authStore.logout()">Logout</button>
      </template>
      <button v-else class="btn btn-discord" @click="authStore.loginWithDiscord()">
        Login with Discord
      </button>
    </div>
  </nav>
</template>

<script setup>
import { useAuthStore } from '../../stores/auth.js'
const authStore = useAuthStore()
</script>

<style scoped>
.app-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: var(--surface-subtle);
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
  gap: 1rem;
}

.nav-title {
  font-family: var(--font-serif);
  font-size: 1.1rem;
  color: var(--gold);
  font-style: italic;
  text-decoration: none;
}

.nav-links {
  display: flex;
  gap: 1.5rem;
  font-family: var(--font-sans);
  font-size: 0.85rem;
}

.nav-links a {
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.2s;
}

.nav-links a:hover,
.nav-links a.router-link-active {
  color: var(--gold);
}

.nav-admin {
  border: 1px solid var(--border);
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-sm);
}

.nav-auth {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-left: auto;
}

.nav-username {
  font-family: var(--font-sans);
  font-size: 0.8rem;
  color: var(--text-muted);
}

.nav-logout {
  font-size: 0.75rem;
  padding: 0.2rem 0.6rem;
}

.btn-ghost {
  background: transparent;
  border-color: var(--border);
  color: var(--text-secondary);
}

.btn-ghost:hover {
  border-color: var(--border-hover);
  color: var(--gold);
  background: transparent;
}

@media (max-width: 640px) {
  .app-nav { padding: 0.75rem 1rem; }
  .nav-title { font-size: 0.95rem; }
  .nav-links { gap: 1rem; font-size: 0.8rem; }
}
</style>
