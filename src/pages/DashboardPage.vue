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
        :uid="uid"
        :auth-username="authUsername"
        :vote-on-suggestion="voteOnSuggestion"
        :toggle-already-read="(id, username, isRead) => toggleAlreadyRead(id, username, isRead)"
        @open-suggest="showSuggestModal = true"
      />
      <PastBooksWidget :past-books="recentPastBooks" />
      <div class="card">
        <AudiobookWidget :audiobook-server="audiobookServer" />
        <br />
        <DiscordWidget :discord-invite-url="discordInviteUrl" />
      </div>
    </div>

    <!-- Suggest modal (opens from TopSuggestions) -->
    <SuggestModal v-if="showSuggestModal" :add-suggestion="addSuggestion" @close="showSuggestModal = false" @submitted="showSuggestModal = false" />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useConfig } from '../composables/useConfig.js'
import { useSuggestions } from '../composables/useSuggestions.js'
import { usePastBooks } from '../composables/usePastBooks.js'
import { useAuthStore } from '../stores/auth.js'
import HeroSection from '../components/dashboard/HeroSection.vue'
import TopSuggestions from '../components/dashboard/TopSuggestions.vue'
import PastBooksWidget from '../components/dashboard/PastBooksWidget.vue'
import AudiobookWidget from '../components/dashboard/AudiobookWidget.vue'
import DiscordWidget from '../components/dashboard/DiscordWidget.vue'
import SuggestModal from '../components/suggestions/SuggestModal.vue'

const { currentBook, audiobookServer, discordInviteUrl, loading: configLoading } = useConfig()
const { suggestions, addSuggestion, voteOnSuggestion, toggleAlreadyRead } = useSuggestions()
const { pastBooks } = usePastBooks()
const authStore = useAuthStore()

const uid = computed(() => authStore.user?.uid ?? null)
const authUsername = computed(() => authStore.user?.discordUsername ?? null)

const topSuggestions = computed(() => suggestions.value.slice(0, 3))
const recentPastBooks = computed(() => pastBooks.value.slice(0, 5))
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
