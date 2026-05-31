// Note: The query below uses orderBy('votes', 'desc'), orderBy('createdAt', 'desc'),
// which requires a composite index in Firestore. This index will be created in
// Phase 10 via firestore.indexes.json.
import { ref, onUnmounted } from 'vue'
import { db } from '../firebase.js'
import {
  collection, onSnapshot, addDoc, deleteDoc, doc,
  updateDoc, increment, serverTimestamp, query, orderBy
} from 'firebase/firestore'

export function useSuggestions() {
  const suggestions = ref([])
  const loading = ref(true)

  const q = query(collection(db, 'suggestions'), orderBy('votes', 'desc'), orderBy('createdAt', 'desc'))

  const unsubscribe = onSnapshot(q, (snap) => {
    suggestions.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    loading.value = false
  }, (error) => {
    console.error('useSuggestions snapshot error:', error)
    loading.value = false
  })

  onUnmounted(unsubscribe)

  async function addSuggestion(data) {
    return addDoc(collection(db, 'suggestions'), {
      ...data,
      votes: 0,
      createdAt: serverTimestamp(),
    })
  }

  async function deleteSuggestion(id) {
    return deleteDoc(doc(db, 'suggestions', id))
  }

  async function upvoteSuggestion(id) {
    return updateDoc(doc(db, 'suggestions', id), { votes: increment(1) })
  }

  async function updateSuggestion(id, data) {
    return updateDoc(doc(db, 'suggestions', id), data)
  }

  return { suggestions, loading, addSuggestion, deleteSuggestion, upvoteSuggestion, updateSuggestion }
}
