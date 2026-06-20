import { ref, onUnmounted } from 'vue'
import { db } from '../firebase.js'
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, query, orderBy
} from 'firebase/firestore'

export function usePastBooks() {
  const pastBooks = ref([])
  const loading = ref(true)

  let unsubscribe = () => {}
  if (db) {
    const q = query(collection(db, 'pastBooks'), orderBy('dateRead', 'desc'))
    unsubscribe = onSnapshot(q, (snap) => {
      pastBooks.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      loading.value = false
    }, (error) => {
      console.error('usePastBooks snapshot error:', error)
      loading.value = false
    })
  } else {
    pastBooks.value = [
      { id: 'dev-p1', title: 'The Hobbit', author: 'J.R.R. Tolkien', genres: ['Fantasy'], dateRead: { toDate: () => new Date('2024-03-01') }, coverUrl: 'https://covers.openlibrary.org/b/id/8406786-L.jpg', discordThreads: [{ title: 'Discussion', url: '' }] },
      { id: 'dev-p2', title: 'Dune', author: 'Frank Herbert', genres: ['Sci-Fi'], dateRead: { toDate: () => new Date('2024-06-15') }, coverUrl: 'https://covers.openlibrary.org/b/id/8475472-L.jpg', discordThreads: [] },
    ]
    loading.value = false
  }

  onUnmounted(unsubscribe)

  async function addPastBook(data) {
    if (!db) throw new Error('Firestore is not configured')
    return addDoc(collection(db, 'pastBooks'), {
      ...data,
      dateRead: data.dateRead || serverTimestamp(),
    })
  }

  async function updatePastBook(id, data) {
    if (!db) throw new Error('Firestore is not configured')
    return updateDoc(doc(db, 'pastBooks', id), data)
  }

  async function deletePastBook(id) {
    if (!db) throw new Error('Firestore is not configured')
    return deleteDoc(doc(db, 'pastBooks', id))
  }

  return { pastBooks, loading, addPastBook, updatePastBook, deletePastBook }
}
