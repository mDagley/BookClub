import { computed, ref, unref, watch } from 'vue'

export function useSpoilerFilter(key = 'bookclub_spoiler_chapter', { hideWhenUnset = false } = {}) {
  const storageKey = computed(() => String(unref(key) ?? 'bookclub_spoiler_chapter'))
  const currentChapter = ref(0)

  watch(storageKey, (nextKey) => {
    const stored = localStorage.getItem(nextKey)
    const parsed = parseInt(stored, 10)
    currentChapter.value = Number.isFinite(parsed) ? parsed : 0
  }, { immediate: true })

  watch([currentChapter, storageKey], ([val, nextKey]) => {
    localStorage.setItem(nextKey, String(val))
  })

  function isVisible(chapter) {
    if (!currentChapter.value) return !hideWhenUnset
    return chapter <= currentChapter.value
  }

  return { currentChapter, isVisible }
}
