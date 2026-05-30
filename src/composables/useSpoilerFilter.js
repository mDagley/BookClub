import { ref, watch } from 'vue'

const STORAGE_KEY = 'bookclub_spoiler_chapter'

export function useSpoilerFilter() {
  const stored = localStorage.getItem(STORAGE_KEY)
  const currentChapter = ref(stored ? parseInt(stored, 10) : 0)

  watch(currentChapter, (val) => {
    localStorage.setItem(STORAGE_KEY, String(val))
  })

  // Returns true if content at `chapter` should be visible
  // 0 = show everything (filter not set)
  function isVisible(chapter) {
    if (!currentChapter.value) return true
    return chapter <= currentChapter.value
  }

  return { currentChapter, isVisible }
}
