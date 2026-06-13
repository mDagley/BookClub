import { ref } from 'vue'
import { searchBooks } from '../utils/googleBooks.js'

export function useBookSearch() {
  const searchResults = ref([])
  const showDropdown = ref(false)
  const searching = ref(false)
  const highlightedIndex = ref(-1)

  let debounceTimer = null

  function onTitleInput(query) {
    highlightedIndex.value = -1
    clearTimeout(debounceTimer)
    if (!query || query.length < 3) {
      searchResults.value = []
      showDropdown.value = false
      searching.value = false
      return
    }
    searching.value = true
    debounceTimer = setTimeout(async () => {
      const results = await searchBooks(query)
      searchResults.value = results
      showDropdown.value = results.length > 0
      searching.value = false
    }, 350)
  }

  function closeDropdown() {
    showDropdown.value = false
    highlightedIndex.value = -1
  }

  // Pass the caller's selectResult function as onSelect.
  // Returns true if the event was handled so caller can stop propagation if needed.
  function onSearchKeydown(e, onSelect) {
    if (e.key === 'ArrowDown') {
      if (!showDropdown.value) return false
      e.preventDefault()
      highlightedIndex.value = Math.min(highlightedIndex.value + 1, searchResults.value.length - 1)
      return true
    }
    if (e.key === 'ArrowUp') {
      if (!showDropdown.value) return false
      e.preventDefault()
      highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0)
      return true
    }
    if (e.key === 'Enter' && showDropdown.value && highlightedIndex.value >= 0) {
      e.preventDefault()
      onSelect(searchResults.value[highlightedIndex.value])
      return true
    }
    if (e.key === 'Escape' && showDropdown.value) {
      e.stopPropagation()
      closeDropdown()
      return true
    }
    return false
  }

  return {
    searchResults,
    showDropdown,
    searching,
    highlightedIndex,
    onTitleInput,
    closeDropdown,
    onSearchKeydown,
  }
}
