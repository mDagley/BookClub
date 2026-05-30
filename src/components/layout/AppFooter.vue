<template>
  <footer class="app-footer">
    <a v-if="discordGuildUrl" :href="discordGuildUrl" target="_blank" rel="noopener">Discord Server</a>
    <span v-if="discordGuildUrl && goodreadsGroupUrl" class="footer-sep">·</span>
    <a v-if="goodreadsGroupUrl" :href="goodreadsGroupUrl" target="_blank" rel="noopener">Goodreads Group</a>
    <span v-if="goodreadsGroupUrl && audiobookServerUrl" class="footer-sep">·</span>
    <a v-if="audiobookServerUrl" :href="audiobookServerUrl" target="_blank" rel="noopener">Audiobookshelf</a>
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
  gap: 0.75rem;
  padding: 1.25rem;
  border-top: 1px solid var(--border);
  font-family: var(--font-sans);
  font-size: 0.8rem;
  color: var(--text-dim);
}

.app-footer a {
  color: var(--text-muted);
  text-decoration: none;
}

.app-footer a:hover {
  color: var(--gold);
}

.footer-sep {
  color: var(--border);
}
</style>
