<template>
  <nav class="app-nav">
    <RouterLink to="/" class="nav-brand">
      <img src="/book-icon.svg" alt="" class="nav-brand-icon" aria-hidden="true" />
      <span class="nav-brand-text">The Family That Reads Together</span>
    </RouterLink>

    <div class="nav-links">
      <RouterLink to="/" @click="menuOpen = false">Home</RouterLink>
      <RouterLink to="/book" @click="menuOpen = false">Current Book</RouterLink>
      <RouterLink to="/suggestions" @click="menuOpen = false">Suggestions</RouterLink>
      <RouterLink to="/past-books" @click="menuOpen = false">Past Books</RouterLink>
      <RouterLink v-if="authStore.user" to="/admin" class="nav-admin" @click="menuOpen = false">Admin</RouterLink>
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

    <button type="button" class="nav-hamburger" :aria-expanded="menuOpen" aria-controls="nav-mobile-menu" aria-label="Toggle menu" @click="menuOpen = !menuOpen">
      <span></span><span></span><span></span>
    </button>

    <!-- Mobile dropdown -->
    <div v-show="menuOpen" id="nav-mobile-menu" class="nav-mobile-menu">
      <RouterLink to="/" @click="menuOpen = false">Home</RouterLink>
      <RouterLink to="/book" @click="menuOpen = false">Current Book</RouterLink>
      <RouterLink to="/suggestions" @click="menuOpen = false">Suggestions</RouterLink>
      <RouterLink to="/past-books" @click="menuOpen = false">Past Books</RouterLink>
      <RouterLink v-if="authStore.user" to="/admin" @click="menuOpen = false">Admin</RouterLink>
    </div>
  </nav>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth.js'
const authStore = useAuthStore()
const menuOpen = ref(false)
const route = useRoute()
watch(route, () => { menuOpen.value = false })
</script>

<style scoped>
.app-nav {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 0.85rem 1.75rem;
  background: rgba(4, 8, 20, 0.88);
  backdrop-filter: blur(12px);
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
  width: 28px;
  height: 28px;
  flex-shrink: 0;
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

.nav-hamburger {
  display: none;
}

.nav-mobile-menu {
  display: none;
}

@media (max-width: 700px) {
  .app-nav {
    padding: 0.75rem 1rem;
    gap: 0;
    flex-wrap: wrap;
    row-gap: 0;
  }

  .nav-brand {
    flex: 1;
  }

  .nav-brand-text {
    display: none;
  }

  /* Hide the desktop link row on mobile */
  .nav-links {
    display: none;
  }

  .nav-auth {
    margin-left: 0;
    gap: 0.5rem;
  }

  .nav-username {
    display: none;
  }

  /* Hamburger button */
  .nav-hamburger {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 5px;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0.4rem;
    margin-left: 0.5rem;
  }

  .nav-hamburger span {
    display: block;
    width: 22px;
    height: 2px;
    background: var(--text-secondary);
    border-radius: 2px;
    transition: background 0.2s;
  }

  .nav-hamburger:hover span,
  .nav-hamburger[aria-expanded="true"] span {
    background: var(--gold);
  }

  /* Mobile dropdown menu */
  .nav-mobile-menu {
    display: flex;
    flex-direction: column;
    width: 100%;
    border-top: 1px solid var(--border);
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    padding-bottom: 0.25rem;
    gap: 0;
  }

  .nav-mobile-menu a {
    color: var(--text-secondary);
    text-decoration: none;
    font-family: var(--font-sans);
    font-size: 0.95rem;
    padding: 0.65rem 0.25rem;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    transition: color 0.15s;
  }

  .nav-mobile-menu a:last-child {
    border-bottom: none;
  }

  .nav-mobile-menu a:hover,
  .nav-mobile-menu a.router-link-active {
    color: var(--gold);
  }
}
</style>
