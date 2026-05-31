<template>
  <section class="book-section card">
    <p class="section-title">Discussion Threads</p>
    <div class="threads-list">
      <div v-for="thread in threads" :key="thread.url" class="thread-row">
        <span class="thread-title">{{ thread.title }}</span>
        <a
          :href="thread.url"
          target="_blank"
          rel="noopener"
          class="btn btn-discord btn-sm"
        >Open in Discord →</a>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  threads: { type: Array, required: true },
})
</script>

<style scoped>
.threads-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.thread-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.thread-title {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.btn-sm {
  padding: 0.25rem 0.7rem;
  font-size: 0.78rem;
}
</style>
