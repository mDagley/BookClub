<template>
  <div class="cover-upload">
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="sr-only"
      @change="onFileChange"
    />
    <button
      type="button"
      class="upload-btn"
      :disabled="uploading"
      @click="fileInput.click()"
    >
      <span v-if="uploading" class="upload-spinner">↺</span>
      <span v-else>📁</span>
      {{ uploading ? 'Uploading…' : label }}
    </button>
    <p v-if="error" class="upload-error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { uploadCoverImage } from '../../utils/uploadCover.js'

const props = defineProps({
  bookId: { type: String, required: true },
  label: { type: String, default: 'Upload image' },
})

const emit = defineEmits(['uploaded'])

const fileInput = ref(null)
const uploading = ref(false)
const error = ref('')

async function onFileChange(event) {
  const file = event.target.files?.[0]
  if (!file) return
  uploading.value = true
  error.value = ''
  try {
    const url = await uploadCoverImage(file, props.bookId)
    emit('uploaded', url)
  } catch (err) {
    error.value = err.message || 'Upload failed'
  } finally {
    uploading.value = false
    // Reset so the same file can be selected again
    event.target.value = ''
  }
}
</script>

<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}

.upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: var(--surface-subtle);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-family: var(--font-sans);
  font-size: 0.8rem;
  padding: 0.35rem 0.7rem;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
  white-space: nowrap;
}

.upload-btn:hover:not(:disabled) {
  border-color: var(--border-hover);
  color: var(--text-primary);
}

.upload-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.upload-spinner {
  display: inline-block;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.upload-error {
  font-family: var(--font-sans);
  font-size: 0.75rem;
  color: #f28b82;
  margin: 0.25rem 0 0;
}
</style>
