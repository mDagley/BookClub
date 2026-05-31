<template>
  <nav class="app-nav">
    <RouterLink to="/" class="nav-brand">
      <span class="nav-brand-icon">📚</span>
      <span class="nav-brand-text">The Family That Reads Together</span>
    </RouterLink>

    <div class="nav-links">
      <RouterLink to="/">Home</RouterLink>
      <RouterLink to="/book">Current Book</RouterLink>
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
  gap: 1.5rem;
  padding: 0.85rem 1.75rem;
  background: rgba(11, 21, 16, 0.92);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
  flex-wrap: wrap;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  flex-shrink: 0;
}

.nav-brand-icon {
  font-size: 1.2rem;
  line-height: 1;
}

.nav-brand-text {
  font-family: var(--font-display);
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--gold);
  text-transform: uppercase;
}

.nav-links {
  display: flex;
  gap: 1.5rem;
  font-family: var(--font-sans);
  font-size: 0.85rem;
  flex: 1;
}

.nav-links a {
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.2s;
  position: relative;
  padding-bottom: 2px;
}

.nav-links a::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 1px;
  background: var(--gold);
  transition: width 0.2s ease;
}

.nav-links a:hover,
.nav-links a.router-link-active {
  color: var(--gold);
  text-decoration: none;
}

.nav-links a:hover::after,
.nav-links a.router-link-active::after {
  width: 100%;
}

.nav-admin {
  border: 1px solid var(--border);
  padding: 0.2rem 0.7rem;
  border-radius: var(--radius-sm);
}

.nav-auth {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-left: auto;
  flex-shrink: 0;
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

@media (max-width: 700px) {
  .app-nav {
    padding: 0.75rem 1rem;
    gap: 0.75rem;
  }
  .nav-brand-text {
    font-size: 0.75rem;
  }
  .nav-links {
    gap: 0.85rem;
    font-size: 0.78rem;
    width: 100%;
    order: 3;
  }
  .nav-auth {
    margin-left: 0;
    order: 2;
  }
  .nav-brand { order: 1; }
}
</style>
