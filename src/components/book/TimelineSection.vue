<template>
  <section class="book-section card">
    <p class="section-title">Timeline</p>
    <div class="timeline">
      <template v-for="group in grouped" :key="group.chapter">
        <div class="chapter-divider">Chapter {{ group.chapter }}</div>
        <div
          v-for="event in group.events"
          :key="`${event.chapter}-${event.label}`"
          class="timeline-item"
          :class="{ spoiled: !isVisible(event.chapter) }"
        >
          <template v-if="isVisible(event.chapter)">
            <div class="timeline-marker">
              <span class="timeline-dot" />
            </div>
            <div class="timeline-content">
              <p class="timeline-label">{{ event.label }}</p>
              <p v-if="event.note" class="timeline-note">{{ event.note }}</p>
            </div>
          </template>
          <div v-else class="timeline-spoiler">
            <div class="timeline-marker">
              <span class="timeline-dot spoiler-dot" />
            </div>
            <p class="spoiler-text">Spoiler — set your chapter above to reveal</p>
          </div>
        </div>
      </template>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  timeline: { type: Array, required: true },
  currentChapter: { type: Number, default: 0 },
  isVisible: { type: Function, required: true },
})

const grouped = computed(() => {
  const groups = []
  let lastChapter = null
  const sorted = [...props.timeline].sort((a, b) => a.chapter - b.chapter)
  for (const event of sorted) {
    if (event.chapter !== lastChapter) {
      groups.push({ chapter: event.chapter, events: [] })
      lastChapter = event.chapter
    }
    groups[groups.length - 1].events.push(event)
  }
  return groups
})
</script>

<style scoped>
.timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
  position: relative;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 6px;
  top: 12px;
  bottom: 12px;
  width: 1px;
  background: var(--border);
}

.chapter-divider {
  font-family: var(--font-sans);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-dim);
  padding: 0.5rem 0 0.25rem 1.5rem;
}

.timeline-item {
  display: flex;
  gap: 1rem;
  padding-bottom: 1.25rem;
  position: relative;
}

.timeline-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  flex-shrink: 0;
  padding-top: 3px;
}

.timeline-dot {
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: var(--border-hover);
  border: 2px solid var(--surface);
  z-index: 1;
}

.spoiler-dot { background: var(--border); }

.timeline-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.timeline-label {
  font-size: 0.9rem;
  color: var(--text-primary);
  line-height: 1.4;
}

.timeline-note {
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.spoiled {
  user-select: none;
  cursor: not-allowed;
}

.timeline-spoiler {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.spoiler-text {
  font-family: var(--font-sans);
  font-size: 0.78rem;
  color: var(--text-dim);
}
</style>
