export function useVoting(voteOnSuggestion) {
  function getVoteDirection(suggestion, uid) {
    if (!uid || !suggestion.votedUsers) return 0
    return suggestion.votedUsers[uid] || 0
  }

  async function castVote(suggestionId, uid, direction) {
    if (!uid) return
    await voteOnSuggestion(suggestionId, uid, direction)
  }

  return { getVoteDirection, castVote }
}
