<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal-box card">
      <p class="section-title">Suggest a Book</p>
      <p style="font-size:0.85rem; color: var(--text-muted)">Coming in Phase 7…</p>
      <button class="btn" @click="$emit('close')">Close</button>
    </div>
  </div>
</template>

<script setup>
defineEmits(['close'])
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-box {
  min-width: 320px;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
}
</style>
