<template>
  <section class="book-section card quotes-carousel">
    <p class="section-title">Quotes</p>

    <div class="carousel" @mouseenter="pause" @mouseleave="resume">
      <Transition :name="direction" mode="out-in">
        <div class="quote-slide" :key="current">
          <blockquote class="quote-text">{{ quotes[current].text }}</blockquote>
          <cite v-if="quotes[current].attribution" class="quote-attribution">— {{ quotes[current].attribution }}</cite>
        </div>
      </Transition>

      <div v-if="quotes.length > 1" class="carousel-controls">
        <button class="nav-btn" @click="prev" aria-label="Previous quote">‹</button>
        <div class="dots">
          <button
            v-for="(_, i) in quotes"
            :key="i"
            class="dot"
            :class="{ active: i === current }"
            @click="goTo(i)"
            :aria-label="`Quote ${i + 1}`"
          />
        </div>
        <button class="nav-btn" @click="next" aria-label="Next quote">›</button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  quotes: { type: Array, required: true },
})

const current = ref(0)
const direction = ref('slide-next')
let timer = null

function goTo(i) {
  direction.value = i > current.value ? 'slide-next' : 'slide-prev'
  current.value = i
  restart()
}

function next() {
  direction.value = 'slide-next'
  current.value = (current.value + 1) % props.quotes.length
  restart()
}

function prev() {
  direction.value = 'slide-prev'
  current.value = (current.value - 1 + props.quotes.length) % props.quotes.length
  restart()
}

function start() {
  if (props.quotes.length <= 1) return
  timer = setInterval(next, 5000)
}

function pause() { clearInterval(timer); timer = null }
function resume() { start() }
function restart() { pause(); start() }

onMounted(start)
onUnmounted(pause)
</script>

<style scoped>
.quotes-carousel {
  text-align: center;
}

.carousel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  min-height: 110px;
}

.quote-slide {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  padding: 0 1.5rem;
}

.quote-text {
  font-family: var(--font-serif);
  font-size: 1.05rem;
  font-style: italic;
  color: var(--text-primary);
  line-height: 1.7;
  margin: 0;
  quotes: none;
}

.quote-attribution {
  font-family: var(--font-sans);
  font-size: 0.8rem;
  color: var(--gold);
  font-style: normal;
  letter-spacing: 0.04em;
}

.carousel-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.nav-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
  padding: 0.1rem 0.3rem;
  border-radius: var(--radius-sm);
  transition: color 0.15s;
}

.nav-btn:hover { color: var(--gold); }

.dots {
  display: flex;
  gap: 0.4rem;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--border);
  border: none;
  cursor: pointer;
  padding: 0;
  transition: background 0.2s;
}

.dot.active { background: var(--gold); }

/* Slide transitions */
.slide-next-enter-active,
.slide-next-leave-active,
.slide-prev-enter-active,
.slide-prev-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.slide-next-enter-from { opacity: 0; transform: translateX(30px); }
.slide-next-leave-to  { opacity: 0; transform: translateX(-30px); }
.slide-prev-enter-from { opacity: 0; transform: translateX(-30px); }
.slide-prev-leave-to  { opacity: 0; transform: translateX(30px); }
</style>
