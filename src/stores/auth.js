import { defineStore } from 'pinia'
import { ref } from 'vue'

// Placeholder auth store — will be fully implemented in Phase 3
export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)

  return { user }
})
