import { ref, watch } from 'vue'

export function useSpoilerFilter(key = 'bookclub_spoiler_chapter', { hideWhenUnset = false } = {}) {
  const stored = localStorage.getItem(key)
  const parsed = parseInt(stored, 10)
  const currentChapter = ref(Number.isFinite(parsed) ? parsed : 0)

  watch(currentChapter, (val) => {
    localStorage.setItem(key, String(val))
  })

  function isVisible(chapter) {
    if (!currentChapter.value) return !hideWhenUnset
    return chapter <= currentChapter.value
  }

  return { currentChapter, isVisible }
}
