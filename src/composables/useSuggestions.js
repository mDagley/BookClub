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
  } else {
    loading.value = false
  }

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

  async function voteOnSuggestion(id, uid, direction) {
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
    const op = isCurrentlyRead ? arrayRemove(username) : arrayUnion(username)
    return updateDoc(doc(db, 'suggestions', id), { alreadyRead: op })
  }

  async function updateSuggestion(id, data) {
    return updateDoc(doc(db, 'suggestions', id), data)
  }

  return { suggestions, loading, addSuggestion, deleteSuggestion, voteOnSuggestion, toggleAlreadyRead, updateSuggestion }
}
