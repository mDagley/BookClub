// useVoting accepts an `upvoteSuggestion` function as a parameter so that
// callers can share a single useSuggestions() instance rather than
// creating a new Firestore listener on every castVote call.
// Usage: const { upvoteSuggestion } = useSuggestions()
//        const { hasVoted, castVote } = useVoting(upvoteSuggestion)
import { ref } from 'vue'

const STORAGE_KEY = 'bookclub_votes'

function loadVotedIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

function saveVotedIds(set) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]))
}

export function useVoting(upvoteSuggestion) {
  const votedIds = ref(loadVotedIds())

  function hasVoted(id) {
    return votedIds.value.has(id)
  }

  async function castVote(id) {
    if (hasVoted(id)) return
    // Optimistic update before await prevents double-vote on rapid taps
    votedIds.value = new Set([...votedIds.value, id])
    saveVotedIds(votedIds.value)
    await upvoteSuggestion(id)
  }

  return { hasVoted, castVote }
}
