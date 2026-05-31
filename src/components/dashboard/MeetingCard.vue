<template>
  <div class="meeting-card card">
    <p class="section-title">Next Meeting</p>
    <div class="meeting-row">
      <span class="meeting-icon">📅</span>
      <span>{{ meeting.date || 'TBD' }}</span>
    </div>
    <div class="meeting-row">
      <span class="meeting-icon">🕐</span>
      <span>{{ meeting.time || 'TBD' }}</span>
    </div>
    <div class="meeting-row" v-if="meeting.location">
      <span class="meeting-icon">📍</span>
      <span>{{ meeting.location }}</span>
    </div>
    <a
      v-if="meeting.discordVoiceUrl"
      :href="meeting.discordVoiceUrl"
      target="_blank"
      rel="noopener"
      class="btn btn-discord meeting-join"
    >Join Voice</a>
  </div>
</template>

<script setup>
defineProps({
  meeting: { type: Object, required: true },
})
</script>

<style scoped>
.meeting-card {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.meeting-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-sans);
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.meeting-icon {
  font-size: 1rem;
  line-height: 1;
}

.meeting-join {
  margin-top: 0.5rem;
  justify-content: center;
}
</style>
