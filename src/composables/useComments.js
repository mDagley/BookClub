import { ref, onUnmounted, watch } from 'vue'
import { db } from '../firebase.js'
import {
  collection, onSnapshot, addDoc, deleteDoc, doc,
  serverTimestamp, query, orderBy
} from 'firebase/firestore'

export function useComments(suggestionId) {
  const comments = ref([])
  const loading = ref(false)
  let unsubscribe = null

  function startListening(id) {
    if (unsubscribe) unsubscribe()
    if (!id || !db) { comments.value = []; return }

    loading.value = true
    const q = query(
      collection(db, 'suggestions', id, 'comments'),
      orderBy('createdAt', 'asc')
    )
    unsubscribe = onSnapshot(q, (snap) => {
      comments.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      loading.value = false
    }, () => {
      loading.value = false
    })
  }

  watch(suggestionId, (id) => startListening(id), { immediate: true })

  onUnmounted(() => { if (unsubscribe) unsubscribe() })

  async function addComment(suggestionId, { uid, displayName, avatarUrl, content }) {
    return addDoc(collection(db, 'suggestions', suggestionId, 'comments'), {
      userId: uid,
      displayName,
      avatarUrl: avatarUrl || null,
      content: content.trim(),
      createdAt: serverTimestamp(),
    })
  }

  async function deleteComment(suggestionId, commentId) {
    return deleteDoc(doc(db, 'suggestions', suggestionId, 'comments', commentId))
  }

  return { comments, loading, addComment, deleteComment }
}
