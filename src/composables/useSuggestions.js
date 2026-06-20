// Note: The query below uses orderBy('votes', 'desc'), orderBy('createdAt', 'desc'),
// which requires a composite index in Firestore. This index will be created in
// Phase 10 via firestore.indexes.json.
import { ref, onUnmounted } from 'vue'
import { db } from '../firebase.js'
import {
  collection, onSnapshot, addDoc, deleteDoc, doc,
  updateDoc, serverTimestamp, query, orderBy, runTransaction, deleteField,
  arrayUnion, arrayRemove
} from 'firebase/firestore'

export function useSuggestions() {
  const suggestions = ref([])
  const loading = ref(true)

  let unsubscribe = () => {}
  if (db) {
    const q = query(collection(db, 'suggestions'), orderBy('votes', 'desc'), orderBy('createdAt', 'desc'))
    unsubscribe = onSnapshot(q, (snap) => {
      suggestions.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      loading.value = false
    }, (error) => {
      console.error('useSuggestions snapshot error:', error)
      loading.value = false
    })
  } else if (import.meta.env.DEV) {
    suggestions.value = [
      { id: 'dev-1', title: 'Project Hail Mary', author: 'Andy Weir', genres: ['Sci-Fi'], votes: 7, suggestedBy: 'melly2024', alreadyRead: ['dadreads'], coverUrl: 'https://covers.openlibrary.org/b/id/12547486-L.jpg', publishedDate: '2021', description: 'A lone astronaut must save Earth.' },
      { id: 'dev-2', title: 'The Name of the Wind', author: 'Patrick Rothfuss', genres: ['Fantasy'], votes: 5, suggestedBy: 'dadreads', alreadyRead: [], coverUrl: 'https://covers.openlibrary.org/b/id/8482644-L.jpg', publishedDate: '2007', description: 'The tale of Kvothe, a legendary figure.' },
      { id: 'dev-3', title: 'Piranesi', author: 'Susanna Clarke', genres: ['Fantasy', 'Mystery'], votes: 4, suggestedBy: 'melly2024', alreadyRead: ['melly2024'], coverUrl: 'https://covers.openlibrary.org/b/id/10521270-L.jpg', publishedDate: '2020', description: 'A man lives alone in a house of infinite halls.' },
    ]
    loading.value = false
  } else {
    console.error('Firestore is not configured')
    loading.value = false
  }

  onUnmounted(unsubscribe)

  async function addSuggestion(data) {
    if (!db) throw new Error('Firestore is not configured')
    return addDoc(collection(db, 'suggestions'), {
      ...data,
      votes: 0,
      createdAt: serverTimestamp(),
    })
  }

  async function deleteSuggestion(id) {
    if (!db) throw new Error('Firestore is not configured')
    return deleteDoc(doc(db, 'suggestions', id))
  }

  async function voteOnSuggestion(id, uid, direction) {
    if (!db) throw new Error('Firestore is not configured')
    const ref = doc(db, 'suggestions', id)
    return runTransaction(db, async (tx) => {
      const snap = await tx.get(ref)
      const data = snap.data() || {}
      const votedUsers = data.votedUsers || {}
      const current = votedUsers[uid] || 0
      let votes = data.votes || 0

      if (current === direction) {
        // Toggle off
        votes -= direction
        tx.update(ref, { votes, [`votedUsers.${uid}`]: deleteField() })
      } else {
        // Add or switch vote
        votes = votes - current + direction
        tx.update(ref, { votes, [`votedUsers.${uid}`]: direction })
      }
    })
  }

  async function toggleAlreadyRead(id, username, isCurrentlyRead) {
    if (!db) throw new Error('Firestore is not configured')
    const op = isCurrentlyRead ? arrayRemove(username) : arrayUnion(username)
    return updateDoc(doc(db, 'suggestions', id), { alreadyRead: op })
  }

  async function updateSuggestion(id, data) {
    if (!db) throw new Error('Firestore is not configured')
    return updateDoc(doc(db, 'suggestions', id), data)
  }

  return { suggestions, loading, addSuggestion, deleteSuggestion, voteOnSuggestion, toggleAlreadyRead, updateSuggestion }
}
