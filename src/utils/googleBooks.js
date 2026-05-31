export async function fetchCoverUrl(title, author) {
  if (!title) return null
  try {
    const query = encodeURIComponent(`intitle:${title}${author ? ` inauthor:${author}` : ''}`)
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1`)
    if (!res.ok) return null
    const data = await res.json()
    const thumbnail = data.items?.[0]?.volumeInfo?.imageLinks?.thumbnail
    if (!thumbnail) return null
    // Force HTTPS and request higher resolution
    return thumbnail.replace('http://', 'https://').replace('zoom=1', 'zoom=2')
  } catch {
    return null
  }
}
