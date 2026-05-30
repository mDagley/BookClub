<template>
  <footer class="app-footer">
    <a :href="discordUrl" target="_blank" rel="noopener" v-if="discordUrl">Discord Server</a>
    <span class="footer-sep" v-if="discordUrl && goodreadsUrl">·</span>
    <a :href="goodreadsUrl" target="_blank" rel="noopener" v-if="goodreadsUrl">Goodreads Group</a>
    <span class="footer-sep" v-if="goodreadsUrl && audiobookUrl">·</span>
    <a :href="audiobookUrl" target="_blank" rel="noopener" v-if="audiobookUrl">Audiobookshelf</a>
  </footer>
</template>

<script setup>
// Will be wired to useConfig() in Phase 4; hardcode empty for now
const discordUrl = ''
const goodreadsUrl = ''
const audiobookUrl = ''
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
