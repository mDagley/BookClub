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

  let unsubscribe = () => {}
  if (db) {
    unsubscribe = onSnapshot(doc(db, 'config', 'main'), (snap) => {
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
  } else if (import.meta.env.DEV) {
    console.warn('[useConfig] Firestore not configured — using mock data')
    currentBook.value = {
      title: 'The Way of Kings', author: 'Brandon Sanderson',
      coverUrl: 'https://covers.openlibrary.org/b/id/8391136-L.jpg',
      synopsis: 'A sweeping epic of war, magic, and ancient secrets.',
      genres: ['Fantasy', 'Epic'],
      goodreadsUrl: '',
      meeting: { date: '2026-07-15', time: '19:00', location: "Mom & Dad's", discordVoiceUrl: '' },
      discordThreads: [{ title: 'General Discussion', url: '' }, { title: 'Chapters 1–10', url: '' }],
      supplementalMaterials: [{ title: 'Brandon Sanderson Interview', url: '', type: 'video' }],
      characters: [
        { name: 'Kaladin', description: 'A soldier turned slave with mysterious powers.', firstAppearanceChapter: 1, isMajor: true },
        { name: 'Shallan', description: 'A scholar seeking to save her family.', firstAppearanceChapter: 3, isMajor: true },
      ],
      timeline: [
        { label: 'Battle of the Shattered Plains', note: '', chapter: 1 },
        { label: 'Kaladin joins Bridge Four', note: '', chapter: 4 },
      ],
    }
    familyMembers.value = ['Melissa', 'Dad', 'Mom', 'Jake']
    memberProfiles.value = [
      { name: 'Melissa', handle: 'melly2024' },
      { name: 'Dad', handle: 'dadreads' },
    ]
    loading.value = false
  } else {
    console.error('Firestore is not configured')
    loading.value = false
  }

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
