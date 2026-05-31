import { computed } from 'vue'
import { useConfig } from './useConfig.js'

export function useMemberProfiles() {
  const { memberProfiles } = useConfig()

  // Build a map from handle → display name for O(1) lookups
  const handleMap = computed(() => {
    const map = {}
    for (const p of memberProfiles.value) {
      if (p.handle) map[p.handle.toLowerCase()] = p.name || p.handle
    }
    return map
  })

  function resolveName(handle) {
    if (!handle) return handle
    return handleMap.value[handle.toLowerCase()] || handle
  }

  function resolveNames(handles) {
    return (handles || []).map(resolveName)
  }

  return { resolveName, resolveNames }
}
