<template>
  <footer class="app-footer">
    <a v-if="discordGuildUrl" :href="discordGuildUrl" target="_blank" rel="noopener">Discord Server</a>
    <span v-if="discordGuildUrl && goodreadsGroupUrl" class="footer-sep">·</span>
    <a v-if="goodreadsGroupUrl" :href="goodreadsGroupUrl" target="_blank" rel="noopener">Goodreads Group</a>
    <span v-if="goodreadsGroupUrl && audiobookServerUrl" class="footer-sep">·</span>
    <a v-if="audiobookServerUrl" :href="audiobookServerUrl" target="_blank" rel="noopener">Audiobookshelf</a>
    <span v-if="discordGuildUrl || goodreadsGroupUrl || audiobookServerUrl" class="footer-sep">·</span>
    <RouterLink to="/changelog">What's New</RouterLink>
    <span class="footer-sep">·</span>
    <a href="https://pngtree.com/freebackground/enchanted-glow-forest-waterfall-fantasy-landscape-with-magical-moonlight_19079910.html" target="_blank" rel="noopener" class="footer-attr">Background image from Pngtree</a>
  </footer>
</template>

<script setup>
import { useConfig } from '../../composables/useConfig.js'
const { discordGuildUrl, goodreadsGroupUrl, audiobookServerUrl } = useConfig()
</script>

<style scoped>
.app-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 1.25rem;
  background: rgba(4, 8, 20, 0.75);
  backdrop-filter: blur(8px);
  border-top: 1px solid var(--border);
  font-family: var(--font-sans);
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.app-footer a {
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.2s;
}

.app-footer a:hover {
  color: var(--gold);
}

.footer-sep {
  color: var(--border-hover);
  opacity: 0.6;
}

.footer-attr {
  font-size: 0.72rem;
  opacity: 0.7;
}
</style>
