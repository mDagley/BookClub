export function primaryThreadUrl(book) {
  const found = book.discordThreads?.find(t => t.url?.trim())
  return found ? found.url.trim() : (book.discordThreadUrl?.trim() ?? null)
}
