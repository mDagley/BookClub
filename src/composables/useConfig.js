import { ref, onUnmounted } from 'vue'
import { db } from '../firebase.js'
import { doc, onSnapshot } from 'firebase/firestore'

export function useConfig() {
  const currentBook = ref(null)
  const audiobookServer = ref(null)
  const familyMembers = ref([])
  const memberProfiles = ref([]) // [{ name: 'Melissa', handle: 'melly2024' }]
  const discordGuildUrl = ref('')
  const discordInviteUrl = ref('')
  const goodreadsGroupUrl = ref('')
  const audiobookServerUrl = ref('')
  const discordWebhookUrl = ref('')
  const loading = ref(true)

  const unsubscribe = onSnapshot(doc(db, 'config', 'main'), (snap) => {
    if (snap.exists()) {
      const data = snap.data()
      currentBook.value = data.currentBook || null
      audiobookServer.value = data.audiobookServer || null
      familyMembers.value = data.familyMembers || []
      memberProfiles.value = data.memberProfiles || []
      discordGuildUrl.value = data.discordGuildUrl || ''
      discordInviteUrl.value = data.discordInviteUrl || ''
      goodreadsGroupUrl.value = data.goodreadsGroupUrl || ''
      audiobookServerUrl.value = data.audiobookServerUrl || ''
      discordWebhookUrl.value = data.discordWebhookUrl || ''
    }
    loading.value = false
  }, (error) => {
    console.error('useConfig snapshot error:', error)
    loading.value = false
  })

  onUnmounted(unsubscribe)

  return {
    currentBook,
    audiobookServer,
    familyMembers,
    memberProfiles,
    discordGuildUrl,
    discordInviteUrl,
    goodreadsGroupUrl,
    audiobookServerUrl,
    discordWebhookUrl,
    loading,
  }
}
