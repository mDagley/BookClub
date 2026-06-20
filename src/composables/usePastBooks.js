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
    loading.value = false
  }

  onUnmounted(unsubscribe)

  async function addPastBook(data) {
    return addDoc(collection(db, 'pastBooks'), {
      ...data,
      dateRead: data.dateRead || serverTimestamp(),
    })
  }

  async function updatePastBook(id, data) {
    return updateDoc(doc(db, 'pastBooks', id), data)
  }

  async function deletePastBook(id) {
    return deleteDoc(doc(db, 'pastBooks', id))
  }

  return { pastBooks, loading, addPastBook, updatePastBook, deletePastBook }
}
