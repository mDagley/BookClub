<template>
  <div class="dashboard">
    <!-- Hero: full-width current book -->
    <HeroSection v-if="currentBook" :book="currentBook" />
    <div v-else-if="configLoading" class="hero-skeleton skeleton" />
    <div v-else class="hero-empty card">
      <p class="section-title">No current book set</p>
      <p>Check back soon — the next book is being chosen!</p>
    </div>

    <!-- 3-column grid -->
    <div class="dashboard-grid">
      <TopSuggestions
        class="col-wide"
        :suggestions="topSuggestions"
        :total="suggestions.length"
        @open-suggest="showSuggestModal = true"
      />
      <PastBooksWidget :past-books="recentPastBooks" />
      <AudiobookWidget
        :audiobook-server="audiobookServer"
        :webhook-url="discordWebhookUrl"
      />
    </div>

    <!-- Suggest modal (opens from TopSuggestions) -->
    <SuggestModal v-if="showSuggestModal" @close="showSuggestModal = false" />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useConfig } from '../composables/useConfig.js'
import { useSuggestions } from '../composables/useSuggestions.js'
import { usePastBooks } from '../composables/usePastBooks.js'
import HeroSection from '../components/dashboard/HeroSection.vue'
import TopSuggestions from '../components/dashboard/TopSuggestions.vue'
import PastBooksWidget from '../components/dashboard/PastBooksWidget.vue'
import AudiobookWidget from '../components/dashboard/AudiobookWidget.vue'
import SuggestModal from '../components/suggestions/SuggestModal.vue'

const { currentBook, audiobookServer, discordWebhookUrl, loading: configLoading } = useConfig()
const { suggestions } = useSuggestions()
const { pastBooks } = usePastBooks()

const topSuggestions = computed(() => suggestions.value.slice(0, 3))
const recentPastBooks = computed(() => pastBooks.value.slice(0, 3))
const showSuggestModal = ref(false)
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.hero-skeleton {
  height: 280px;
  border-radius: var(--radius-md);
}

.hero-empty {
  text-align: center;
  padding: 3rem;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 1.25rem;
}

@media (max-width: 900px) {
  .dashboard-grid { grid-template-columns: 1fr; }
}
</style>
